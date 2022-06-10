// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
'use strict'

const util = require('util')
const assert = require('assert-plus')

const helpers = require('./helpers')

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
  let str = '(' + helpers.escape(this.attribute) + '='

  if (this.initial) { str += helpers.escape(this.initial) }

  str += '*'

  this.any.forEach(function (s) {
    str += helpers.escape(s) + '*'
  })

  if (this.final) { str += helpers.escape(this.final) }

  str += ')'

  return str
}

SubstringFilter.prototype.matches = function matches (target, strictAttrCase) {
  assert.object(target, 'target')

  const tv = helpers.getAttrValue(target, this.attribute, strictAttrCase)

  if (tv !== undefined && tv !== null) {
    let re = ''

    if (this.initial) { re += '^' + escapeRegExp(this.initial) + '.*' }
    this.any.forEach(function (s) {
      re += escapeRegExp(s) + '.*'
    })
    if (this.final) { re += escapeRegExp(this.final) + '$' }

    const matcher = new RegExp(re)
    return helpers.testValues(function (v) {
      return matcher.test(v)
    }, tv)
  }

  return false
}

/// --- Exports

module.exports = SubstringFilter
