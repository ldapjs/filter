// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
'use strict'

const util = require('util')
const assert = require('assert-plus')

const helpers = require('../helpers')
const escapeFilterValue = require('../utils/escape-filter-value')

/// --- API

function ApproximateFilter (options) {
  assert.optionalObject(options)
  if (options) {
    assert.string(options.attribute, 'options.attribute')
    assert.string(options.value, 'options.value')
    this.attribute = options.attribute
    this.value = options.value
  }
}
util.inherits(ApproximateFilter, helpers.Filter)
Object.defineProperties(ApproximateFilter.prototype, {
  type: {
    get: function getType () { return 'approx' },
    configurable: false
  },
  json: {
    get: function getJson () {
      return {
        type: 'ApproximateMatch',
        attribute: this.attribute,
        value: this.value
      }
    },
    configurable: false
  }
})

ApproximateFilter.prototype.toString = function toString () {
  return ('(' + escapeFilterValue(this.attribute) +
          '~=' + escapeFilterValue(this.value) + ')')
}

ApproximateFilter.prototype.matches = function matches () {
  // Consumers must implement this themselves
  throw new Error('approx match implementation missing')
}

/// --- Exports

module.exports = ApproximateFilter
