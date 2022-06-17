// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
// Copyright 2016 Joyent, Inc.
'use strict'

const { test } = require('tap')

let EqualityFilter
let NotFilter

test('load library', function (t) {
  const filters = require('../index')
  t.ok(filters)
  EqualityFilter = filters.EqualityFilter
  NotFilter = filters.NotFilter
  t.ok(EqualityFilter)
  t.ok(NotFilter)
  t.end()
})

test('Construct no args', function (t) {
  t.ok(new NotFilter())
  t.end()
})

test('Construct args', function (t) {
  const f = new NotFilter({
    filter: new EqualityFilter({
      attribute: 'foo',
      value: 'bar'
    })
  })
  t.ok(f)
  t.equal(f.toString(), '(!(foo=bar))')
  t.same(f.json, {
    type: 'Not',
    filter: {
      type: 'EqualityFilter',
      attribute: 'foo',
      value: 'bar'
    }
  })
  t.end()
})

test('match true', function (t) {
  const f = new NotFilter({
    filter: new EqualityFilter({
      attribute: 'foo',
      value: 'bar'
    })
  })
  t.ok(f)
  t.ok(f.matches({ foo: 'baz' }))
  t.end()
})

test('match false', function (t) {
  const f = new NotFilter({
    filter: new EqualityFilter({
      attribute: 'foo',
      value: 'bar'
    })
  })
  t.ok(f)
  t.ok(!f.matches({ foo: 'bar' }))
  t.end()
})

test('setFilter', function (t) {
  const f = new NotFilter({
    filter: new EqualityFilter({
      attribute: 'foo',
      value: 'bar'
    })
  })
  t.ok(f)
  t.equal(f.toString(), '(!(foo=bar))')
  f.setFilter(new EqualityFilter({
    attribute: 'new',
    value: 'val'
  }))
  t.equal(f.toString(), '(!(new=val))')
  t.end()
})
