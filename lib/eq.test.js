// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
// Copyright 2016 Joyent, Inc.
'use strict'

const { test } = require('tap')

let EqualityFilter

test('load library', function (t) {
  const filters = require('./index')
  t.ok(filters)
  EqualityFilter = filters.EqualityFilter
  t.ok(EqualityFilter)
  t.end()
})

test('Construct no args', function (t) {
  const f = new EqualityFilter()
  t.ok(f)
  t.ok(!f.attribute)
  t.ok(!f.value)
  t.end()
})

test('Construct args', function (t) {
  const f = new EqualityFilter({
    attribute: 'foo',
    value: 'bar'
  })
  t.ok(f)
  t.equal(f.attribute, 'foo')
  t.equal(f.value, 'bar')
  t.equal(f.toString(), '(foo=bar)')
  t.same(f.json, {
    type: 'EqualityMatch',
    attribute: 'foo',
    value: 'bar'
  })
  t.end()
})

test('construct with raw', function (t) {
  const f = new EqualityFilter({
    attribute: 'foo',
    raw: Buffer.from([240])
  })
  t.ok(f)
  t.ok(f.raw)
  t.equal(f.raw[0], 240)
  t.end()
})

test('value setter', function (t) {
  const f = new EqualityFilter()
  let data = Buffer.from([240])
  f.value = data
  t.equal(f.raw[0], data[0], 'preserve buffer')

  data = Buffer.from('a')
  f.value = data.toString()
  t.equal(f.raw[0], data[0], 'convert string')

  f.value = true
  t.equal(typeof (f.value), 'boolean', 'preserve other type')
  t.ok(f.value)
  t.end()
})

test('escape value only in toString()', function (t) {
  const f = new EqualityFilter({
    attribute: 'foo',
    value: 'ba(r)'
  })
  t.ok(f)
  t.equal(f.attribute, 'foo')
  t.equal(f.value, 'ba(r)')
  t.equal(f.toString(), '(foo=ba\\28r\\29)')
  t.end()
})

test('match true', function (t) {
  const f = new EqualityFilter({
    attribute: 'foo',
    value: 'bar'
  })
  t.ok(f)
  t.ok(f.matches({ foo: 'bar' }))
  t.end()
})

test('match multiple', function (t) {
  const f = new EqualityFilter({
    attribute: 'foo',
    value: 'bar'
  })
  t.ok(f)
  t.ok(f.matches({ foo: ['plop', 'bar'] }))
  t.end()
})

test('match false', function (t) {
  const f = new EqualityFilter({
    attribute: 'foo',
    value: 'bar'
  })
  t.ok(f)
  t.ok(!f.matches({ foo: 'baz' }))
  t.end()
})

test('escape EqualityFilter inputs', function (t) {
  const f = new EqualityFilter({
    attribute: '(|(foo',
    value: 'bar))('
  })

  t.equal(f.attribute, '(|(foo')
  t.equal(f.value, 'bar))(')
  t.equal(f.toString(), '(\\28|\\28foo=bar\\29\\29\\28)')

  f.value = Buffer.from([97, 115, 100, 102, 41, 40, 0, 255])
  t.equal(f.toString(), '(\\28|\\28foo=\\61\\73\\64\\66\\29\\28\\00\\ff)')

  f.value = Buffer.from([195, 40])
  t.equal(f.toString(), '(\\28|\\28foo=\\c3\\28)')

  f.value = Buffer.from([195, 177])
  t.equal(f.toString(), '(\\28|\\28foo=ñ)')
  t.end()
})

test('reject bad raw value', function (t) {
  const f = new EqualityFilter({
    attribute: 'foo',
    value: 'bar'
  })
  t.equal(f.toString(), '(foo=bar)')
  f.raw = 'sure'
  t.equal(f.toString(), '(foo=sure)')
  f.raw = { bogus: 'yup' }
  t.throws(function () {
    f.toString()
  })
  t.end()
})
