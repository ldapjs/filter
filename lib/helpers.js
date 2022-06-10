// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.
'use strict'

const assert = require('assert-plus')

/// --- API

/**
 * Check value or array with test function.
 *
 * @param {Function} rule test function.
 * @param value value or array of values.
 * @param {Boolean} allMatch require all array values to match. default: false
 */
function testValues (rule, value, allMatch) {
  if (Array.isArray(value)) {
    let i
    if (allMatch) {
      // Do all entries match rule?
      for (i = 0; i < value.length; i++) {
        if (!rule(value[i])) {
          return false
        }
      }
      return true
    } else {
      // Do any entries match rule?
      for (i = 0; i < value.length; i++) {
        if (rule(value[i])) {
          return true
        }
      }
      return false
    }
  } else {
    return rule(value)
  }
}

/**
 * Fetch value for named object attribute.
 *
 * @param {Object} obj object to fetch value from
 * @param {String} attr name of attribute to fetch
 * @param {Boolean} strictCase attribute name is case-sensitive. default: false
 */
function getAttrValue (obj, attr, strictCase) {
  assert.object(obj)
  assert.string(attr)
  // Check for exact case match first
  if (Object.prototype.hasOwnProperty.call(obj, attr)) {
    return obj[attr]
  } else if (strictCase) {
    return undefined
  }

  // Perform case-insensitive enumeration after that
  const lower = attr.toLowerCase()
  let result
  Object.getOwnPropertyNames(obj).some(function (name) {
    if (name.toLowerCase() === lower) {
      result = obj[name]
      return true
    }
    return false
  })
  return result
}

/**
 * Filter base class
 */
/* istanbul ignore next */
function Filter () {
}

/**
 * Depth-first filter traversal
 */
Filter.prototype.forEach = function forEach (cb) {
  if (this.filter) {
    // not
    this.filter.forEach(cb)
  } else if (this.filters) {
    // and/or
    this.filters.forEach(function (item) {
      item.forEach(cb)
    })
  }

  cb(this) // eslint-disable-line
}

/**
 * Depth-first map traversal.
 */
Filter.prototype.map = function map (cb) {
  let child
  if (this.filter) {
    child = this.filter.map(cb)
    if (child === null) {
      // empty NOT not allowed
      return null
    } else {
      this.filter = child
    }
  } else if (this.filters) {
    child = this.filters.map(function (item) {
      return item.map(cb)
    }).filter(function (item) {
      return (item !== null)
    })
    if (child.length === 0) {
      // empty and/or not allowed
      return null
    } else {
      this.filters = child
    }
  }
  return cb(this) // eslint-disable-line
}

/// --- Exports

module.exports = {
  testValues,
  getAttrValue,
  Filter
}
