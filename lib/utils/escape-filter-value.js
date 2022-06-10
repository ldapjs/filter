'use strict'

module.exports = escapeFilterValue

/**
 * Escapes LDAP filter attribute values. For example,
 * in the filter `(cn=föo)`, this function would be used
 * to encode `föo` to `f\c3\b6o`.
 *
 * @param {string|Buffer} toEscape
 *
 * @returns {string}
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4515
 */
function escapeFilterValue (toEscape) {
  if (typeof toEscape === 'string') {
    return escapeBuffer(Buffer.from(toEscape))
  }

  if (Buffer.isBuffer(toEscape)) {
    return escapeBuffer(toEscape)
  }

  throw Error('toEscape must be a string or a Buffer')
}

function escapeBuffer (buf) {
  let result = ''
  for (let i = 0; i < buf.length; i += 1) {
    if (buf[i] >= 0xc0 && buf[i] <= 0xdf) {
      // Represents the first byte in a 2-byte UTF-8 character.
      result += '\\' + buf[i].toString(16) + '\\' + buf[i + 1].toString(16)
      i += 1
      continue
    }

    if (buf[i] >= 0xe0 && buf[i] <= 0xef) {
      // Represents the first byte in a 3-byte UTF-8 character.
      result += [
        '\\', buf[i].toString(16),
        '\\', buf[i + 1].toString(16),
        '\\', buf[i + 2].toString(16)
      ].join('')
      i += 2
      continue
    }

    if (buf[i] <= 31) {
      // It's an ASCII control character so we will straight
      // encode it (excluding the "space" character).
      result += '\\' + buf[i].toString(16).padStart(2, '0')
      continue
    }

    const char = String.fromCharCode(buf[i])
    switch (char) {
      case '*': {
        result += '\\2a'
        break
      }

      case '(': {
        result += '\\28'
        break
      }

      case ')': {
        result += '\\29'
        break
      }

      case '\\': {
        result += '\\5c'
        break
      }

      default: {
        result += char
        break
      }
    }
  }
  return result
}
