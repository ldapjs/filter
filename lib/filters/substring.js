'use strict'

const FilterString = require('../filter-string')
const { BerReader } = require('@ldapjs/asn1')
const { search } = require('@ldapjs/protocol')
const escapeFilterValue = require('../utils/escape-filter-value')
const testValues = require('../utils/test-values')
const getAttributeValue = require('../utils/get-attribute-value')

/**
 * Represents a filter that matches substrings withing LDAP entry attribute
 * values, e.g. `(cn=*f*o*o)`.
 */
class SubstringFilter extends FilterString {
  #subInitial
  #subAny = []
  #subFinal

  /**
   * @param {object} input
   * @param {string} input.attribute The attribute to test against.
   * @param {string} [input.subInitial] Text that must appear at the start
   * of a value and may not overlap any value of `subAny` or `subFinal`.
   * @param {string[]} [input.subAny] Text items that must appear in the
   * attribute value that do not overlap with `subInitial`, `subFinal`, or
   * any other `subAny` item.
   * @param {string} [input.subFinal] Text that must appear at the end of
   * the attribute value. May not overlap with `subInitial` or any `subAny`
   * item.
   *
   * @throws When any input parameter is of an incorrect type.
   */
  constructor ({ attribute, subInitial, subAny = [], subFinal } = {}) {
    if (typeof attribute !== 'string' || attribute.length < 1) {
      throw Error('attribute must be a string of at least one character')
    }
    if (Array.isArray(subAny) === false) {
      throw Error('subAny must be an array of items')
    }
    if (subFinal && typeof subFinal !== 'string') {
      throw Error('subFinal must be a string')
    }

    super({ attribute })

    this.#subInitial = subInitial
    Array.prototype.push.apply(this.#subAny, subAny)
    this.#subFinal = subFinal

    Object.defineProperties(this, {
      TAG: { value: search.FILTER_SUBSTRINGS },
      type: { value: 'SubstringFilter' }
    })
  }

  get subInitial () {
    return this.#subInitial
  }

  get subAny () {
    return this.#subAny
  }

  get subFinal () {
    return this.#subFinal
  }

  get json () {
    return {
      type: this.type,
      subInitial: this.#subInitial,
      subAny: this.#subAny,
      subFinal: this.#subFinal
    }
  }

  toString () {
    let result = '(' + escapeFilterValue(this.attribute) + '='

    if (this.#subInitial) {
      result += escapeFilterValue(this.#subInitial)
    }

    result += '*'

    for (const any of this.#subAny) {
      result += escapeFilterValue(any) + '*'
    }

    if (this.#subFinal) {
      result += escapeFilterValue(this.#subFinal)
    }

    result += ')'
    return result
  }

  /**
   * Determines if an object represents an equivalent filter instance.
   * Both the filter attribute and filter value must match the comparison
   * object.
   *
   * @example
   * const filter = new EqualityFilter({ attribute: 'foo', subInitial: 'bar' })
   * assert.equal(filter.matches({ foo: 'bar' }), true)
   *
   * @param {object} obj An object to check for match.
   * @param {boolean} [strictAttrCase=true] If `false`, "fOo" witll mach
   * "foo" in the attribute position (lefthand side).
   *
   * @throws When input types are not correct.
   *
   * @returns {boolean}
   */
  matches (obj, strictAttrCase) {
    const targetValue = getAttributeValue({ sourceObject: obj, attributeName: this.attribute, strictCase: strictAttrCase })

    if (targetValue === undefined || targetValue === null) {
      return false
    }

    let re = ''

    if (this.#subInitial) { re += '^' + escapeRegExp(this.#subInitial) + '.*' }
    this.#subAny.forEach(function (s) {
      re += escapeRegExp(s) + '.*'
    })
    if (this.#subFinal) { re += escapeRegExp(this.#subFinal) + '$' }

    const matcher = new RegExp(re)
    return testValues({
      rule: v => matcher.test(v),
      value: targetValue
    })
  }

  _toBer (ber) {
    ber.writeString(this.attribute)
    ber.startSequence()

    if (this.#subInitial) { ber.writeString(this.#subInitial, 0x80) }

    if (this.#subAny.length > 0) {
      for (const sub of this.#subAny) {
        ber.writeString(sub, 0x81)
      }
    }

    if (this.#subFinal) { ber.writeString(this.#subFinal, 0x82) }

    ber.endSequence()

    return ber
  }

  /**
   * Parses a BER encoded `Buffer` and returns a new filter.
   *
   * @param {Buffer} buffer BER encoded buffer.
   *
   * @throws When the buffer does not start with the proper BER tag.
   *
   * @returns {AndFilter}
   */
  static parse (buffer) {
    const reader = new BerReader(buffer)

    const seq = reader.readSequence()
    if (seq !== search.FILTER_SUBSTRINGS) {
      const expected = '0x' + search.FILTER_SUBSTRINGS.toString(16).padStart(2, '0')
      const found = '0x' + seq.toString(16).padStart(2, '0')
      throw Error(`expected substring filter sequence ${expected}, got ${found}`)
    }

    let subInitial
    const subAny = []
    let subFinal

    const attribute = reader.readString().toLowerCase()
    reader.readSequence()

    // Must set end outside of loop as the reader will update the
    // length property as the buffer is read.
    const end = reader.offset + reader.length
    while (reader.offset < end) {
      const tag = reader.peek()
      switch (tag) {
        case 0x80: { // Initial
          subInitial = reader.readString(tag)
          if (attribute === 'objectclass') {
            subInitial = subInitial.toLowerCase()
          }
          break
        }

        case 0x81: { // Any
          let anyVal = reader.readString(tag)
          if (attribute === 'objectclass') {
            anyVal = anyVal.toLowerCase()
          }
          subAny.push(anyVal)
          break
        }

        case 0x82: { // Final
          subFinal = reader.readString(tag)
          if (attribute === 'objectclass') {
            subFinal = subFinal.toLowerCase()
          }
          break
        }

        default: {
          throw new Error('Invalid substrings filter type: 0x' + tag.toString(16))
        }
      }
    }

    return new SubstringFilter({ attribute, subInitial, subAny, subFinal })
  }
}

function escapeRegExp (str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') // eslint-disable-line
}

module.exports = SubstringFilter
