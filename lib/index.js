// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.
// Copyright 2016 Joyent, Inc.
'use strict'

const assert = require('assert-plus')

const testValues = require('./utils/test-values')
const getAttributeValue = require('./utils/get-attribute-value')

const FilterString = require('./filter-string')
const AndFilter = require('./filters/and')
const ApproximateFilter = require('./filters/approximate')
const EqualityFilter = require('./filters/equality')
const ExtensibleFilter = require('./filters/extensible')
const GreaterThanEqualsFilter = require('./filters/greater-than-equals')
const LessThanEqualsFilter = require('./filters/less-than-equals')
const NotFilter = require('./filters/not')
const OrFilter = require('./filters/or_filter')
const PresenceFilter = require('./filters/presence')
const SubstringFilter = require('./filters/substr')

/// --- Globals

/* JSSTYLED */
const attrRegex = /^[-_a-zA-Z0-9]+/
const hexRegex = /^[a-fA-F0-9]{2}$/

/// --- Internal

function escapeValue (str) {
  let cur = 0
  const len = str.length
  let out = ''

  while (cur < len) {
    const c = str[cur]

    switch (c) {
      case '(':
      /*
       * Although '*' characters should be escaped too, we ignore them here in
       * case downstream ExtensibleFilter consumers wish to perform their own
       * value-add parsing after the fact.
       *
       * Handling unescaped ')' is not needed since such occurances will parse
       * as premature (and likely) unbalanced parens in the filter expression.
       */
        throw new Error('illegal unescaped char: ' + c)

      case '\\': {
      /* Parse a \XX hex escape value */
        const val = str.substr(cur + 1, 2)
        if (val.match(hexRegex) === null) {
          throw new Error('invalid escaped char')
        }
        out += String.fromCharCode(parseInt(val, 16))
        cur += 3
        break
      }

      default: {
      /* Add one regular char */
        out += c
        cur++
        break
      }
    }
  }

  return out
}

function escapeSubstr (str) {
  const fields = str.split('*')
  const out = {}
  assert.ok(fields.length > 1, 'wildcard missing')

  out.initial = escapeValue(fields.shift())
  out.final = escapeValue(fields.pop())
  out.any = fields.map(escapeValue)
  return out
}

function parseExt (attr, str) {
  const fields = str.split(':')
  const res = {
    attribute: attr
  }

  /* Having already parsed the attr, the first entry should be empty */
  assert.ok(fields.length > 1, 'invalid ext filter')
  fields.shift()

  if (fields[0].toLowerCase() === 'dn') {
    res.dnAttributes = true
    fields.shift()
  }
  if (fields.length !== 0 && fields[0][0] !== '=') {
    res.rule = fields.shift()
  }
  if (fields.length === 0 || fields[0][0] !== '=') {
    /* With matchType, dnAttribute, and rule consumed, the := must be next */
    throw new Error('missing := in ext filter')
  }

  /*
   * Trim the leading = (from the :=)  and reinsert any extra ':' charachters
   * which may have been present in the value field.
   */
  str = fields.join(':').substr(1)
  res.value = escapeValue(str)
  const out = new ExtensibleFilter(res)

  /*
   * Some extensible filters (such as caseIgnoreSubstringsMatch) operate with
   * values formatted with the substring syntax.  In order to prevent ambiguity
   * between '*' characters which are not escaped and any which are, we attempt
   * substring-style parsing on any value which contains the former.
   */
  if (str.indexOf('*') !== -1) {
    const subres = escapeSubstr(str)
    out.initial = subres.initial
    out.any = subres.any
    out.final = subres.final
  }

  return out
}

function parseExpr (str) {
  let attr, match, remain

  if (str[0] === ':') {
    /*
     * An extensible filter can have no attribute name.
     * (Only valid when using dn and * matching-rule evaluation)
     */
    attr = ''
    remain = str
  } else if ((match = str.match(attrRegex)) !== null) {
    attr = match[0]
    remain = str.substr(attr.length)
  } else {
    throw new Error('invalid attribute name')
  }

  if (remain === '=*') {
    return new PresenceFilter({
      attribute: attr
    })
  } else if (remain[0] === '=') {
    remain = remain.substr(1)
    if (remain.indexOf('*') !== -1) {
      const val = escapeSubstr(remain)
      return new SubstringFilter({
        attribute: attr,
        initial: val.initial,
        any: val.any,
        final: val.final
      })
    } else {
      return new EqualityFilter({
        attribute: attr,
        value: escapeValue(remain)
      })
    }
  } else if (remain[0] === '>' && remain[1] === '=') {
    return new GreaterThanEqualsFilter({
      attribute: attr,
      value: escapeValue(remain.substr(2))
    })
  } else if (remain[0] === '<' && remain[1] === '=') {
    return new LessThanEqualsFilter({
      attribute: attr,
      value: escapeValue(remain.substr(2))
    })
  } else if (remain[0] === '~' && remain[1] === '=') {
    return new ApproximateFilter({
      attribute: attr,
      value: escapeValue(remain.substr(2))
    })
  } else if (remain[0] === ':') {
    return parseExt(attr, remain)
  }
  throw new Error('invalid expression')
}

function parseFilter (str, start) {
  let cur = start
  const len = str.length
  let res; let end; let output; const children = []

  if (str[cur++] !== '(') {
    throw new Error('missing paren')
  }

  if (str[cur] === '&') {
    cur++
    do {
      res = parseFilter(str, cur)
      children.push(res.filter)
      cur = res.end + 1
    } while (cur < len && str[cur] !== ')')

    output = new AndFilter({ filters: children })
  } else if (str[cur] === '|') {
    cur++
    do {
      res = parseFilter(str, cur)
      children.push(res.filter)
      cur = res.end + 1
    } while (cur < len && str[cur] !== ')')

    output = new OrFilter({ filters: children })
  } else if (str[cur] === '!') {
    res = parseFilter(str, cur + 1)
    output = new NotFilter({ filter: res.filter })
    cur = res.end + 1
    assert.equal(str[cur], ')', 'unbalanced parens')
  } else {
    end = str.indexOf(')', cur)
    assert.notEqual(end, -1, 'unbalanced parens')

    output = parseExpr(str.substr(cur, end - cur))
    cur = end
  }
  if (cur >= len) {
    throw new Error('unbalanced parens')
  }
  return {
    end: cur,
    filter: output
  }
}

/// --- Exports

module.exports = {
  parse: function (str) {
    assert.string(str, 'input must be string')
    assert.ok(str.length > 0, 'input string cannot be empty')

    /* Wrap the input in parens if it was not already */
    if (str.charAt(0) !== '(') {
      str = '(' + str + ')'
    }
    const parsed = parseFilter(str, 0)

    const lastIdx = str.length - 1
    if (parsed.end < lastIdx) {
      throw new Error('unbalanced parens')
    }

    return parsed.filter
  },

  // Helper utilties for writing custom matchers
  testValues,
  getAttrValue: getAttributeValue,
  getAttributeValue,

  // Filter definitions
  FilterString,
  AndFilter,
  ApproximateFilter,
  EqualityFilter,
  ExtensibleFilter,
  GreaterThanEqualsFilter,
  LessThanEqualsFilter,
  NotFilter,
  OrFilter,
  PresenceFilter,
  SubstringFilter
}
