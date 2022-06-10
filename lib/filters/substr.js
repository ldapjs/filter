// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
'use strict'

const util = require('util')
const assert = require('assert-plus')

const helpers = require('../helpers')
const escapeFilterValue = require('../utils/escape-filter-value')
const testValues = require('../utils/test-values')
const getAttributeValue = require('../utils/get-attribute-value')

/// --- Helpers

function escapeRegExp (str) {
  /* JSSTYLED */
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') // eslint-disable-line
}

/// --- API

function SubstringFilter (options) {
  assert.optionalObject(options)
  if (options) {
    assert.string(options.attribute, 'options.attribute')

    this.attribute = options.attribute
    this.initial = options.initial
    this.any = options.any ? options.any.slice(0) : []
    this.final = options.final
  } else {
    this.any = []
  }
}
util.inherits(SubstringFilter, helpers.Filter)
Object.defineProperties(SubstringFilter.prototype, {
  type: {
    get: function getType () { return 'substring' },
    configurable: false
  },
  json: {
    get: function getJson () {
      return {
        type: 'SubstringMatch',
        initial: this.initial,
        any: this.any,
        final: this.final
      }
    },
    configurable: false
  }
})

SubstringFilter.prototype.toString = function toString () {
  let str = '(' + escapeFilterValue(this.attribute) + '='

  if (this.initial) { str += escapeFilterValue(this.initial) }

  str += '*'

  this.any.forEach(function (s) {
    str += escapeFilterValue(s) + '*'
  })

  if (this.final) { str += escapeFilterValue(this.final) }

  str += ')'

  return str
}

SubstringFilter.prototype.matches = function matches (target, strictAttrCase) {
  assert.object(target, 'target')

  const tv = getAttributeValue({ sourceObject: target, attributeName: this.attribute, strictCase: strictAttrCase })

  if (tv !== undefined && tv !== null) {
    let re = ''

    if (this.initial) { re += '^' + escapeRegExp(this.initial) + '.*' }
    this.any.forEach(function (s) {
      re += escapeRegExp(s) + '.*'
    })
    if (this.final) { re += escapeRegExp(this.final) + '$' }

    const matcher = new RegExp(re)
    return testValues({
      rule: function (v) {
        return matcher.test(v)
      },
      value: tv
    })
  }

  return false
}

/// --- Exports

module.exports = SubstringFilter
