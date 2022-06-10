// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
'use strict'

const util = require('util')
const assert = require('assert-plus')

const helpers = require('../helpers')
const escapeFilterValue = require('../utils/escape-filter-value')

/// --- API

function LessThanEqualsFilter (options) {
  assert.optionalObject(options)
  if (options) {
    assert.string(options.attribute, 'options.attribute')
    assert.string(options.value, 'options.attribute')
    this.attribute = options.attribute
    this.value = options.value
  }
}
util.inherits(LessThanEqualsFilter, helpers.Filter)
Object.defineProperties(LessThanEqualsFilter.prototype, {
  type: {
    get: function getType () { return 'le' },
    configurable: false
  },
  json: {
    get: function getJson () {
      return {
        type: 'LessThanEqualsMatch',
        attribute: this.attribute,
        value: this.value
      }
    },
    configurable: false
  }
})

LessThanEqualsFilter.prototype.toString = function toString () {
  return ('(' + escapeFilterValue(this.attribute) +
          '<=' + escapeFilterValue(this.value) + ')')
}

LessThanEqualsFilter.prototype.matches = function (target, strictAttrCase) {
  assert.object(target, 'target')

  const tv = helpers.getAttrValue(target, this.attribute, strictAttrCase)
  const value = this.value

  return helpers.testValues(function (v) {
    return value >= v
  }, tv)
}

/// --- Exports

module.exports = LessThanEqualsFilter
