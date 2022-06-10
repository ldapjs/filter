// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.
'use strict'

const { test } = require('tap')

let lib
let testValues
let getAttrValue

test('load library', function (t) {
  lib = require('./index')
  t.ok(lib)
  t.ok(testValues = lib.testValues)
  t.ok(getAttrValue = lib.getAttrValue)
  t.end()
})

test('testValues array', function (t) {
  const rule = function (item) {
    return (item === 3)
  }
  t.ok(testValues(rule, [1, 2, 3]))
  t.ok(!testValues(rule, [1, 2]))
  t.end()
})

test('testValues value', function (t) {
  const rule = function (item) {
    return (item === 3)
  }
  t.ok(testValues(rule, 3))
  t.ok(!testValues(rule, 1))
  t.end()
})

test('testValues allMatch', function (t) {
  const rule = function (item) {
    return (item === 3)
  }
  t.ok(testValues(rule, 3, true))
  t.ok(!testValues(rule, 1, true))
  t.ok(testValues(rule, [3, 3, 3], true))
  t.ok(!testValues(rule, [3, 2, 1], true))
  t.end()
})

test('getAttrValue exact match', function (t) {
  const f = getAttrValue
  t.equal(f({ attr: 'testval' }, 'attr'), 'testval')
  t.equal(f({ attr: 'testval' }, 'missing'), undefined)
  t.end()
})

test('getAttrValue insensitive match', function (t) {
  const f = getAttrValue
  const data = {
    lower: 'lower',
    UPPER: 'upper',
    MiXeD: 'mixed'
  }
  t.equal(f(data, 'lower'), 'lower')
  t.equal(f(data, 'upper'), 'upper')
  t.equal(f(data, 'mixed'), 'mixed')
  t.equal(f(data, 'missing'), undefined)
  t.end()
})

test('getAttrValue strict match', function (t) {
  const f = getAttrValue
  const data = {
    lower: 'lower',
    UPPER: 'upper',
    MiXeD: 'mixed'
  }
  t.equal(f(data, 'lower', true), 'lower')
  t.equal(f(data, 'upper', true), undefined)
  t.equal(f(data, 'UPPER', true), 'upper')
  t.equal(f(data, 'mixed', true), undefined)
  t.equal(f(data, 'MiXeD', true), 'mixed')
  t.equal(f(data, 'missing', true), undefined)
  t.end()
})
