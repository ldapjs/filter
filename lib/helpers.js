// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.
'use strict'

/// --- API

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
  Filter
}
