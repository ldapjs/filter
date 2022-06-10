// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney

const util = require('util')
const assert = require('assert-plus')

const helpers = require('../helpers')
const escapeFilterValue = require('../utils/escape-filter-value')
const getAttributeValue = require('../utils/get-attribute-value')

/// --- API

function PresenceFilter (options) {
  assert.optionalObject(options)
  options = options || {}
  assert.optionalString(options.attribute)

  this.attribute = options.attribute
}
util.inherits(PresenceFilter, helpers.Filter)
Object.defineProperties(PresenceFilter.prototype, {
  type: {
    get: function getType () { return 'present' },
    configurable: false
  },
  json: {
    get: function getJson () {
      return {
        type: 'PresenceMatch',
        attribute: this.attribute
      }
    },
    configurable: false
  }
})

PresenceFilter.prototype.toString = function toString () {
  return '(' + escapeFilterValue(this.attribute) + '=*)'
}

PresenceFilter.prototype.matches = function matches (target, strictAttrCase) {
  assert.object(target, 'target')

  const value = getAttributeValue({ sourceObject: target, attributeName: this.attribute, strictCase: strictAttrCase })

  return (value !== undefined && value !== null)
}

/// --- Exports

module.exports = PresenceFilter
