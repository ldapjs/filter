'use strict'

const tap = require('tap')
const escapeFilterValue = require('./escape-filter-value')

// See https://datatracker.ietf.org/doc/html/rfc4515#section-4
tap.test('escapes all rfc defined characters (string)', async t => {
  const expected = [
    'Parens R Us \\28for all your parenthetical needs\\29',
    '\\2a',
    'C:\\5cMyFile',
    '\\00\\00\\00\\04',
    'Lu\\c4\\8di\\c5\\87',
    'f\\c3\\b6o'
  ]
  const inputs = [
    'Parens R Us (for all your parenthetical needs)',
    '*',
    'C:\\MyFile',
    Buffer.from([0x00, 0x00, 0x00, 0x04]).toString(),
    'LučiŇ',
    'föo'
  ]

  for (let i = 0; i < expected.length; i += 1) {
    t.equal(escapeFilterValue(inputs[i]), expected[i])
  }
})

// See https://datatracker.ietf.org/doc/html/rfc4515#section-4
tap.test('escapes all rfc defined characters (buffer)', async t => {
  const expected = [
    'Parens R Us \\28for all your parenthetical needs\\29',
    '\\2a',
    'C:\\5cMyFile',
    '\\00\\00\\00\\04',
    'Lu\\c4\\8di\\c5\\87',
    'f\\c3\\b6o'
  ]
  const inputs = [
    Buffer.from('Parens R Us (for all your parenthetical needs)'),
    Buffer.from('*'),
    Buffer.from('C:\\MyFile'),
    Buffer.from([0x00, 0x00, 0x00, 0x04]),
    Buffer.from('LučiŇ'),
    Buffer.from('föo')
  ]

  for (let i = 0; i < expected.length; i += 1) {
    t.equal(escapeFilterValue(inputs[i]), expected[i])
  }
})

tap.test('needs string or buffer', async t => {
  t.throws(() => escapeFilterValue([42]))
})

tap.test('encodes 3-byte utf-8', async t => {
  const input = 'ᎢᏣᎵᏍᎠᏁᏗ'
  const expected = '\\e1\\8e\\a2\\e1\\8f\\a3\\e1\\8e\\b5\\e1\\8f\\8d\\e1\\8e\\a0\\e1\\8f\\81\\e1\\8f\\97'
  t.equal(escapeFilterValue(input), expected)
})
