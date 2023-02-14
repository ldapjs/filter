'use strict'

const tap = require('tap')
const { search } = require('@ldapjs/protocol')
const PresenceFilter = require('./presence')

tap.test('Construct no args', async t => {
  t.throws(
    () => new PresenceFilter(),
    Error('attribute must be a string of at least one character')
  )
})

tap.test('Construct args', async t => {
  const f = new PresenceFilter({ attribute: 'foo' })
  t.ok(f)
  t.equal(Object.prototype.toString.call(f), '[object FilterString]')
  t.equal(f.TAG, search.FILTER_PRESENT)
  t.equal(f.type, 'PresenceFilter')
  t.equal(f.attribute, 'foo')
  t.equal(f.toString(), '(foo=*)')
})

tap.test('escape value only in toString()', async t => {
  const f = new PresenceFilter({ attribute: 'fo)o' })
  t.ok(f)
  t.equal(f.attribute, 'fo)o')
  t.equal(f.toString(), '(fo\\29o=*)')
})

tap.test('match true', async t => {
  const f = new PresenceFilter({ attribute: 'foo' })
  t.ok(f)
  t.equal(f.matches({ foo: 'bar' }), true)
})

tap.test('match false', async t => {
  const f = new PresenceFilter({ attribute: 'foo' })
  t.ok(f)
  t.equal(f.matches({ bar: 'foo' }), false)
})

tap.test('encodes to BER correctly', async t => {
  const expected = Buffer.from([0x87, 0x03, 0x66, 0x6f, 0x6f])
  const f = new PresenceFilter({ attribute: 'foo' })
  const ber = f.toBer()

  t.equal(expected.compare(ber.buffer), 0)
})

tap.test('#parse', t => {
  t.test('throws if starts with wrong sequence', async t => {
    const buffer = Buffer.from([0x88, 0x03, 0x66, 0x6f, 0x6f])
    t.throws(
      () => PresenceFilter.parse(buffer),
      Error('expected presence filter sequence 0x87, got 0x88')
    )
  })

  t.test('parses buffer', async t => {
    const buffer = Buffer.from([0x87, 0x03, 0x66, 0x6f, 0x6f])
    const f = PresenceFilter.parse(buffer)
    t.equal(f.toString(), '(foo=*)')
  })

  t.end()
})

tap.test('original node-ldap tests', t => {
  // This set of subtests are from the original "filters/presence" test suite
  // in the core `ldapjs` module code.

  t.test('GH-109 = escape value only in toString()', async t => {
    const f = new PresenceFilter({ attribute: 'fo)o' })
    t.ok(f)
    t.equal(f.attribute, 'fo)o')
    t.equal(f.toString(), '(fo\\29o=*)')
  })

  t.test('GH-109 = to ber uses plain values', async t => {
    let f = new PresenceFilter({ attribute: 'f(o)o' })
    t.ok(f)

    const ber = f.toBer()
    f = PresenceFilter.parse(ber.buffer)

    t.equal(f.attribute, 'f(o)o')
    t.end()
  })

  t.end()
})
