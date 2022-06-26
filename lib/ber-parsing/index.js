'use strict'

const protocol = require('@ldapjs/protocol')

const AndFilter = require('../filters/and')
const ApproximateFilter = require('../filters/approximate')
const EqualityFilter = require('../filters/equality')
const ExtensibleFilter = require('../filters/extensible')
const GreaterThanEqualsFilter = require('../filters/greater-than-equals')
const LessThanEqualsFilter = require('../filters/less-than-equals')
const NotFilter = require('../filters/not')
const OrFilter = require('../filters/or')
const PresenceFilter = require('../filters/presence')
const SubstringFilter = require('../filters/substring')

/**
 * Reads a buffer that is encoded BER data and returns the appropriate
 * filter that it represents.
 *
 * @param {BerReader} ber The BER buffer to parse.
 *
 * @returns {FilterString}
 *
 * @throws If input is not of correct type or there is an error is parsing.
 */
module.exports = function parseBer (ber) {
  if (Object.prototype.toString.call(ber) !== '[object BerReader]') {
    throw new TypeError('ber (BerReader) required')
  }

  return _parse(ber)
}

function _parse (ber) {
  let f

  const type = ber.readSequence()
  switch (type) {
    case protocol.search.FILTER_AND: {
      f = new AndFilter()
      parseSet(f)
      break
    }

    case protocol.search.FILTER_APPROX: {
      f = ApproximateFilter.parse(getBerBuffer(ber))
      break
    }

    case protocol.search.FILTER_EQUALITY: {
      f = EqualityFilter.parse(getBerBuffer(ber))
      return f
    }

    case protocol.search.FILTER_EXT: {
      f = ExtensibleFilter.parse(getBerBuffer(ber))
      return f
    }

    case protocol.search.FILTER_GE: {
      f = GreaterThanEqualsFilter.parse(getBerBuffer(ber))
      return f
    }

    case protocol.search.FILTER_LE: {
      f = LessThanEqualsFilter.parse(getBerBuffer(ber))
      return f
    }

    case protocol.search.FILTER_NOT: {
      const innerFilter = _parse(ber)
      f = new NotFilter({ filter: innerFilter })
      break
    }

    case protocol.search.FILTER_OR: {
      f = new OrFilter()
      parseSet(f)
      break
    }

    case protocol.search.FILTER_PRESENT: {
      f = PresenceFilter.parse(getBerBuffer(ber))
      break
    }

    case protocol.search.FILTER_SUBSTRINGS: {
      f = SubstringFilter.parse(getBerBuffer(ber))
      break
    }

    default: {
      throw Error(
        'invalid search filter type: 0x' + type.toString(16).padStart(2, '0')
      )
    }
  }

  return f

  function parseSet (f) {
    const end = ber.offset + ber.length
    while (ber.offset < end) { f.addClause(_parse(ber)) }
  }

  function getBerBuffer (inputBer) {
    // Since our new filter code does not allow "empty" constructors,
    // we need to pass a BER into the filter's `.parse` method in order
    // to get a new instance. In order to do that, we need to read the
    // full BER section of the buffer for the filter. We do this by using
    // the `BerReader` properties "offset" and "length"; noting that "offset"
    // is the start of the value in the TLV part of the buffer.
    // Further, we use a `for` loop here because for unknown reasons
    // `buffer.subarray` is not working.
    const buffer = Buffer.alloc(inputBer.length + 2)
    for (let i = 0; i < buffer.length; i += 1) {
      const berOffset = (inputBer.offset - 2) + i
      buffer.writeUInt8(inputBer._buf[berOffset], i)
    }

    // We must advance the internal offset of the passed in BER here.
    // Again, this is due to the original side effect reliant nature of
    // ldapjs.
    ber._offset += inputBer.length
    return buffer
  }
}
