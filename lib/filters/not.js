'use strict'

const FilterString = require('../filter-string')
const { BerReader } = require('@ldapjs/asn1')
const { search } = require('@ldapjs/protocol')

/**
 * Represents a basic filter that negates other filters, e.g.
 * `(!(cn=foo))`. A `NotFilter` may only have one direct negated
 * filter, but that filter may represent a multiple clause filter
 * such as an `AndFilter`.
 */
class NotFilter extends FilterString {
  /**
   * @typedef {FilterStringParams} NotParams
   * @property {FilterString} filter The filter to negate.
   */

  /**
   * @param {NotParams} input
   *
   * @throws If not filter is provided.
   */
  constructor ({ filter } = {}) {
    if (filter instanceof FilterString === false) {
      throw Error('filter is required and must be a filter instance')
    }

    super()

    // We set `attribute` to `undefined` because the NOT filter is a specal
    // case: it must not have an attribute or an value. It must have an inner
    // filter.
    this.attribute = undefined
    this.filter = filter

    Object.defineProperties(this, {
      TAG: { value: search.FILTER_NOT },
      type: { value: 'NotFilter' }
    })
  }

  get json () {
    return {
      type: this.type,
      filter: this.filter.json
    }
  }

  get filter () {
    return this.clauses[0]
  }

  set filter (filter) {
    if (filter instanceof FilterString === false) {
      throw Error('filter must be a filter instance')
    }
    this.clauses[0] = filter
  }

  setFilter (filter) {
    this.clauses[0] = filter
  }

  toString () {
    return '(!' + this.filter.toString() + ')'
  }

  /**
   * Invokes the direct filter's `matches` routine and inverts the result.
   *
   * @example
   * const eqFilter = new EqualityFilter({ attribute: 'foo', value: 'bar' })
   * const filter = new NotFilter({ filter: eqFilter })
   * assert.equal(filter.matches({ foo: 'bar' }), false)
   *
   * @param {object} obj An object to check for match.
   * @param {boolean} [strictAttrCase=true] If `false`, "fOo" witll mach
   * "foo" in the attribute position (lefthand side).
   *
   * @throws When input types are not correct.
   *
   * @returns {boolean}
   */
  matches (obj, strictAttrCase = true) {
    return !this.filter.matches(obj, strictAttrCase)
  }

  _toBer (ber) {
    const innerBer = this.filter.toBer(ber)
    ber.appendBuffer(innerBer.buffer)
    return ber
  }

  /**
   * Parses a BER encoded `Buffer` and returns a new filter.
   *
   * @param {Buffer} buffer BER encoded buffer.
   *
   * @throws When the buffer does not start with the proper BER tag.
   *
   * @returns {NotFilter}
   */
  static parse (buffer) {
    const reader = new BerReader(buffer)

    const seq = reader.readSequence()
    if (seq !== search.FILTER_NOT) {
      const expected = '0x' + search.FILTER_NOT.toString(16).padStart(2, '0')
      const found = '0x' + seq.toString(16).padStart(2, '0')
      throw Error(`expected not filter sequence ${expected}, got ${found}`)
    }

    // TODO: in order to parse a NOT filter, we need to read the lenght
    // and the next tag. We must then parse the filter represented by
    // that tag and pass sub-buffer (of the read length) to the associated
    // filter's parse method. Which means we need to first finish all other
    // filter implementations. ~ 2022-06-19
    const filter = new FilterString()

    return new NotFilter({ filter })
  }
}

module.exports = NotFilter
