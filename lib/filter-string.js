'use strict'

const { BerReader, BerWriter } = require('@ldapjs/asn1')

/**
 * Baseline LDAP filter object. This exists solely to define the interface
 * and basline properties and methods for actual LDAP filters.
 */
class FilterString {
  /**
   * The BER tag for the filter as defined in
   * https://datatracker.ietf.org/doc/html/rfc4511#section-4.5.1.
   */
  TAG = 0x30
  // For this base `FilterString` we repurpose the sequence start tag. We
  // represent it as a sequence that contains a null value.
  // So we do this because it is nonsense to have an empty filter string.

  /**
   * Local name of the filter.
   */
  type = 'FilterString'

  /**
   * String value denoting which LDAP attribute the filter tagets. For example,
   * in the filter `(&(cn=Foo Bar))`, the value would be "cn".
   */
  attribute = ''

  /**
   * TODO
   */
  clauses = new Set()

  /**
   * Creates a new filter object and sets the `attrbitute`.
   *
   * @param {object} input
   * @param {string} input.attrbitute The name of the attribute the filter
   * will target.
   *
   * @returns {FilterString}
   */
  constructor ({ attribute = '' } = {}) {
    this.attribute = attribute
  }

  /**
   * Determines if a filter instance meets specific criteria.
   * Each type of filter provides its own logic for this method.
   * Thus, the documentation for the method should be consulted on each
   * specific filter. This baseline implementation always returnns `false`.
   *
   * @returns {boolean} Always `false`.
   */
  matches () {
    return false
  }

  /**
   * Generate a string representation of the filter.
   *
   * @returns {string}
   */
  toString () {
    return '()'
  }

  /**
   * Returns a BER instance of the filter. This is typically used when
   * constructing search messages to send to an LDAP server.
   *
   * @returns {object} A `BerReader` instance from `@ldapjs/asn1`.
   */
  toBer () {
    const ber = new BerWriter()

    ber.startSequence(this.TAG)
    this._toBer(ber)
    ber.endSequence()

    return new BerReader(ber.buffer)
  }

  _toBer (ber) {
    ber.writeNull()
  }

  /**
   * Parses a `Buffer` instance and returns a new `FilterString` representation.
   * Each `FilterString` implementation must implement this method.
   *
   * @param {Buffer} buffer
   *
   * @throws When the input `buffer` does not match the expected format.
   *
   * @returns {FilterString}
   */
  static parse (buffer) {
    // It is actually nonsense to implement this method for the base
    // `FilteSring`, but we do it any way for completeness sake. We effectively
    // just validate that the input buffer is the one we expect for our made up
    // "empty" filter string and return a new instance if the buffer validates.

    if (buffer.length !== 4) {
      throw Error(`expected buffer length 4, got ${buffer.length}`)
    }

    const reader = new BerReader(buffer)
    let seq = reader.readSequence()
    if (seq !== 0x30) {
      throw Error(`expected sequence start, got 0x${seq.toString(16).padStart(2, '0')}`)
    }

    seq = reader.readSequence()
    if (seq !== 0x05) {
      throw Error(`expected null sequence start, got 0x${seq.toString(16).padStart(2, '0')}`)
    }

    return new FilterString()
  }
}

module.exports = FilterString
