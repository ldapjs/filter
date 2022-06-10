// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
// Copyright 2016 Joyent, Inc.
'use strict'

const { test } = require('tap')

let PresenceFilter

test('load library', function (t) {
  const filters = require('./index')
  t.ok(filters)
  PresenceFilter = filters.PresenceFilter
  t.ok(PresenceFilter)
  t.end()
})

test('Construct no args', function (t) {
  const f = new PresenceFilter()
  t.ok(f)
  t.ok(!f.attribute)
  t.end()
})

test('Construct args', function (t) {
  const f = new PresenceFilter({
    attribute: 'foo'
  })
  t.ok(f)
  t.equal(f.attribute, 'foo')
  t.equal(f.toString(), '(foo=*)')
  t.same(f.json, {
    type: 'PresenceMatch',
    attribute: 'foo'
  })
  t.end()
})

test('escape value only in toString()', function (t) {
  const f = new PresenceFilter({
    attribute: 'fo)o'
  })
  t.ok(f)
  t.equal(f.attribute, 'fo)o')
  t.equal(f.toString(), '(fo\\29o=*)')
  t.end()
})

test('match true', function (t) {
  const f = new PresenceFilter({
    attribute: 'foo'
  })
  t.ok(f)
  t.ok(f.matches({ foo: 'bar' }))
  t.end()
})

test('match false', function (t) {
  const f = new PresenceFilter({
    attribute: 'foo'
  })
  t.ok(f)
  t.ok(!f.matches({ bar: 'foo' }))
  t.end()
})
