// @ts-check

exports.ipv6StringFromBuffer = ipv6StringFromBuffer;

/**
  Converts a buffer containing an IPv6 address into string notation.
  String notation consists of 8 sets of 16-bits each. Each group is
  written as four hexadecimal values separated by colons (:).  This method
  follows RFC 5952 shortening.

  @remarks
  RFC 5952 https://tools.ietf.org/html/rfc5952

  The following shortening rules are applied:
    1. Leading zeros are shorted as much as possible
    2. Zero compression is from left to right and
    3. Addresses are returned in lowercase.



  @param {Buffer} buffer
  @returns {string}
 */
function ipv6StringFromBuffer(buffer) {
  let sections = getHexSections(buffer);
  let result = sectionsToString(sections);

  return result;
}

/**
  @private
  @param {Buffer} buffer
  @returns {Array<string>}
 */
function getHexSections(buffer) {
  let bytesPerSection = 2;
  let sections = [];
  for (let i = 0; i < buffer.length; i += bytesPerSection) {
    let section = buffer.slice(i, i + bytesPerSection).toString('hex');
    section = discardLeadingZeros(section);
    sections.push(section);
  }
  return sections;
}

/**
  @private
  @param {string} section
  @return {string}
 */
function discardLeadingZeros(section) {
  return section.replace(/^0+/g, '');
}

/**
  @private
  @param {Array<string>} sections
  @returns {string}
 */
function sectionsToString(sections) {
  let result = '';
  let hasCollapsed = false;
  for (let s of sections) {
    // alrerady in collapse state, no-op
    if (result.endsWith('::') && s === '') continue;

    // collapse zero section
    if (result.endsWith(':') && s === '' && !hasCollapsed) {
      hasCollapsed = true;
      result += ':';
      continue;
    }

    // we have a zero, but already collapsed so we need to mark as zero
    if (hasCollapsed && s === '') {
      result += '0:';
      continue;
    }

    // normal condition
    result += s + ':';
  }

  // remove trailing except with ending with ::;
  if (!result.endsWith('::')) result = result.slice(0, -1);

  return result;
}
