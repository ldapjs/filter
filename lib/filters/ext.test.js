// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2015 Patrick Mooney
// Copyright 2016 Joyent, Inc.
'use strict'

const { test } = require('tap')

let ExtensibleFilter
let parse

test('load library', function (t) {
  const lib = require('../index')
  t.ok(lib)
  ExtensibleFilter = lib.ExtensibleFilter
  parse = lib.parse
  t.end()
})

test('Construct no args', function (t) {
  const f = new ExtensibleFilter()
  t.ok(f)
  t.end()
})

test('Construct args', function (t) {
  let f = new ExtensibleFilter({
    matchType: 'foo',
    value: 'bar'
  })
  t.ok(f)
  t.equal(f.matchType, 'foo')
  t.equal(f.value, 'bar')
  t.equal(f.toString(), '(foo:=bar)')
  f = new ExtensibleFilter({
    matchType: 'foo',
    rule: '1.2',
    dnAttributes: true,
    value: 'baz'
  })
  t.same(f.json, {
    type: 'ExtensibleMatch',
    matchRule: '1.2',
    matchType: 'foo',
    matchValue: 'baz',
    dnAttributes: true
  })
  t.equal(f.toString(), '(foo:dn:1.2:=baz)')
  f = new ExtensibleFilter({
    attribute: 'test',
    value: 'bar'
  })
  t.equal(f.matchType, 'test')
  t.same(f.json, {
    type: 'ExtensibleMatch',
    matchRule: undefined,
    matchType: 'test',
    matchValue: 'bar',
    dnAttributes: false
  })
  f = new ExtensibleFilter({
    dnAttributes: true,
    value: 'foo'
  })
  t.equal(f.toString(), '(:dn:=foo)')
  t.same(f.json, {
    type: 'ExtensibleMatch',
    matchRule: undefined,
    matchType: undefined,
    matchValue: 'foo',
    dnAttributes: true
  })
  t.end()
})

test('attribute synonym', function (t) {
  const f = parse('foo:=bar')
  t.equal(f.matchType, 'foo')
  t.equal(f.attribute, 'foo')
  f.attribute = 'baz'
  t.equal(f.matchType, 'baz')
  t.equal(f.attribute, 'baz')
  t.end()
})

test('parse RFC example 1', function (t) {
  const f = parse('(cn:caseExactMatch:=Fred Flintstone)')
  t.ok(f)
  t.equal(f.type, 'ext')
  t.equal(f.matchType, 'cn')
  t.equal(f.matchingRule, 'caseExactMatch')
  t.equal(f.matchValue, 'Fred Flintstone')
  t.notOk(f.dnAttributes)
  t.end()
})

test('parse RFC example 2', function (t) {
  const f = parse('(cn:=Betty Rubble)')
  t.ok(f)
  t.equal(f.matchType, 'cn')
  t.equal(f.matchValue, 'Betty Rubble')
  t.notOk(f.dnAttributes)
  t.notOk(f.matchingRule)
  t.end()
})

test('parse RFC example 3', function (t) {
  const f = parse('(sn:dn:2.4.6.8.10:=Barney Rubble)')
  t.ok(f)
  t.equal(f.matchType, 'sn')
  t.equal(f.matchingRule, '2.4.6.8.10')
  t.equal(f.matchValue, 'Barney Rubble')
  t.ok(f.dnAttributes)
  t.end()
})

test('parse RFC example 3', function (t) {
  const f = parse('(o:dn:=Ace Industry)')
  t.ok(f)
  t.equal(f.matchType, 'o')
  t.notOk(f.matchingRule)
  t.equal(f.matchValue, 'Ace Industry')
  t.ok(f.dnAttributes)
  t.end()
})

test('parse RFC example 4', function (t) {
  const f = parse('(:1.2.3:=Wilma Flintstone)')
  t.ok(f)
  t.notOk(f.matchType)
  t.equal(f.matchingRule, '1.2.3')
  t.equal(f.matchValue, 'Wilma Flintstone')
  t.notOk(f.dnAttributes)
  t.end()
})

test('parse RFC example 5', function (t) {
  const f = parse('(:DN:2.4.6.8.10:=Dino)')
  t.ok(f)
  t.notOk(f.matchType)
  t.equal(f.matchingRule, '2.4.6.8.10')
  t.equal(f.matchValue, 'Dino')
  t.ok(f.dnAttributes)
  t.end()
})

test('missing :=', function (t) {
  t.throws(function () {
    parse('(:dn:oops)')
  })
  t.end()
})

test('substring-style handling', function (t) {
  const f = parse('(foo:1.2.3.4:=a*\\2ab*c)')
  t.ok(f)
  t.equal(f.value, 'a**b*c')
  t.equal(f.initial, 'a')
  t.same(f.any, ['*b'])
  t.equal(f.final, 'c')

  t.end()
})

test('matches throws', function (t) {
  t.plan(1)
  const f = new ExtensibleFilter()
  try {
    f.matches({})
  } catch (err) {
    t.ok(err)
  }
})
