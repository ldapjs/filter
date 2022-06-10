// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
// Copyright 2016 Joyent, Inc.
'use strict'

const { test } = require('tap')

let ApproximateFilter

test('load library', function (t) {
  const filters = require('../index')
  t.ok(filters)
  ApproximateFilter = filters.ApproximateFilter
  t.ok(ApproximateFilter)
  t.end()
})

test('Construct no args', function (t) {
  const f = new ApproximateFilter()
  t.ok(f)
  t.ok(!f.attribute)
  t.ok(!f.value)
  t.end()
})

test('Construct args', function (t) {
  const f = new ApproximateFilter({
    attribute: 'foo',
    value: 'bar'
  })
  t.ok(f)
  t.equal(f.attribute, 'foo')
  t.equal(f.value, 'bar')
  t.equal(f.toString(), '(foo~=bar)')
  t.same(f.json, {
    type: 'ApproximateMatch',
    attribute: 'foo',
    value: 'bar'
  })
  t.end()
})

test('escape value only in toString()', function (t) {
  const f = new ApproximateFilter({
    attribute: 'foo',
    value: 'ba(r)'
  })
  t.ok(f)
  t.equal(f.attribute, 'foo')
  t.equal(f.value, 'ba(r)')
  t.equal(f.toString(), '(foo~=ba\\28r\\29)')
  t.end()
})

test('matches throws', function (t) {
  t.plan(1)
  const f = new ApproximateFilter()
  try {
    f.matches({})
  } catch (err) {
    t.ok(err)
  }
})
