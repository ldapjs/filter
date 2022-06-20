'use strict'

const tap = require('tap')
const EqualityFilter = require('./equality')
const OrFilter = require('./or')

tap.test('constructs instance', async t => {
  const f = new OrFilter({
    filters: [
      new EqualityFilter({ attribute: 'foo', value: 'bar' }),
      new EqualityFilter({ attribute: 'zig', value: 'zag' })
    ]
  })
  t.ok(f)
  t.equal(f.toString(), '(|(foo=bar)(zig=zag))')
})

tap.test('matches', t => {
  t.test('match true', async t => {
    const f = new OrFilter()
    f.addClause(new EqualityFilter({
      attribute: 'foo',
      value: 'bar'
    }))
    f.addClause(new EqualityFilter({
      attribute: 'zig',
      value: 'zag'
    }))
    t.ok(f)
    t.ok(f.matches({ foo: 'bar', zig: 'zonk' }))
    t.same(f.json, {
      type: 'OrFilter',
      filters: [
        { type: 'EqualityFilter', attribute: 'foo', value: 'bar' },
        { type: 'EqualityFilter', attribute: 'zig', value: 'zag' }
      ]
    })
  })

  t.test('match false', async t => {
    const f = new OrFilter()
    f.addClause(new EqualityFilter({
      attribute: 'foo',
      value: 'bar'
    }))
    f.addClause(new EqualityFilter({
      attribute: 'zig',
      value: 'zag'
    }))
    t.ok(f)
    t.equal(f.matches({ foo: 'baz', zig: 'zonk' }), false)
  })

  t.test('RFC-4526 - empty OR', async t => {
    const f = new OrFilter()
    t.equal(f.matches({}), false)
  })

  t.end()
})

tap.test('encodes to BER correctly', async t => {
  const expected = Buffer.from([
    0xa1, 0x0c, 0xa3, 0x0a, // or tag, length, eq tag, length
    0x04, 0x03, 0x66, 0x6f, 0x6f, // OctetString "foo"
    0x04, 0x03, 0x62, 0x61, 0x72 // OctetString "bar"
  ])
  const eqFilter = new EqualityFilter({ attribute: 'foo', value: 'bar' })
  const f = new OrFilter({ filters: [eqFilter] })
  const ber = f.toBer()
  t.equal(expected.compare(ber.buffer), 0)
})

tap.test('parse', t => {
  t.test('parses buffer', async t => {
    const input = Buffer.from([
      0xa1, 0x0c, 0xa3, 0x0a, // or tag, length, eq tag, length
      0x04, 0x03, 0x66, 0x6f, 0x6f, // OctetString "foo"
      0x04, 0x03, 0x62, 0x61, 0x72 // OctetString "bar"
    ])
    const f = OrFilter.parse(input)
    t.equal(f.clauses.length, 1)
    t.equal(f.toString(), '(|())')
  })

  t.test('throws for unexpected sequence', async t => {
    const input = Buffer.from([
      0xa3, 0x0c, 0xa3, 0x0a, // or tag, length, eq tag, length
      0x04, 0x03, 0x66, 0x6f, 0x6f, // OctetString "foo"
      0x04, 0x03, 0x62, 0x61, 0x72 // OctetString "bar"
    ])
    t.throws(
      () => OrFilter.parse(input),
      Error('expected or filter sequence 0xa1, got 0xa3')
    )
  })

  t.end()
})
