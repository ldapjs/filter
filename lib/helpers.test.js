// Copyright 2014 Mark Cavage, Inc.  All rights reserved.
// Copyright 2014 Patrick Mooney.  All rights reserved.
'use strict'

const { test } = require('tap')

let lib

test('load library', function (t) {
  lib = require('./index')
  t.ok(lib)
  t.type(lib.testValues, Function)
  t.type(lib.getAttrValue, Function)
  t.type(lib.getAttributeValue, Function)
  t.end()
})
