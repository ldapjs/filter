'use strict'

const tap = require('tap')
const FilterString = require('./filter-string')

tap.test('creates an empty filter string', async t => {
  const f = new FilterString()
  t.equal(f.TAG, 0x30)
  t.equal(f.type, 'FilterString')
  t.equal(f.attribute, '')
  t.equal(f.toString(), '()')
})

tap.test('mathes are false', async t => {
  const f = new FilterString()
  t.equal(f.matches(), false)
  t.equal(f.matches('nonsense'), false)
})

tap.test('encodes BER correctly', async t => {
  const expected = Buffer.from([0x30, 0x02, 0x05, 0x00])
  const f = new FilterString()
  const ber = f.toBer()

  t.equal(expected.compare(ber.buffer), 0)
})

tap.test('#parse', t => {
  t.test('throws for bad length', async t => {
    const input = Buffer.alloc(3)
    t.throws(
      () => FilterString.parse(input),
      Error('expected buffer length 4, got 3')
    )
  })

  t.test('throws for bad sequence start', async t => {
    const input = Buffer.from([0x31, 0x02, 0x05, 0x00])
    t.throws(
      () => FilterString.parse(input),
      Error('expected sequence start, got 0x31')
    )
  })

  t.test('throws for bad null sequence start', async t => {
    const input = Buffer.from([0x30, 0x02, 0x06, 0x00])
    t.throws(
      () => FilterString.parse(input),
      Error('expected null sequence start, got 0x06')
    )
  })

  t.test('parses a buffer', async t => {
    const f = FilterString.parse(Buffer.from([0x30, 0x02, 0x05, 0x00]))
    t.equal(f.toString(), '()')
  })

  t.end()
})
