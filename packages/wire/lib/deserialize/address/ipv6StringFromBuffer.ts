/**
 * Converts a buffer containing an IPv6 address into string notation.
 * String notation consists of 8 sets of 16-bits each. Each group is
 * written as four hexadecimal values separated by colons (:).  This method
 * follows RFC 5952 shortening.
 *
 * @remarks
 * RFC 5952 https://tools.ietf.org/html/rfc5952
 *
 * The following shortening rules are applied:
 *   1. Leading zeros are shorted as much as possible
 *   2. Zero compression is from left to right and
 *   3. Addresses are returned in lowercase.
 */
export function ipv6StringFromBuffer(buffer: Buffer): string {
    const sections = getHexSections(buffer);
    const result = sectionsToString(sections);

    return result;
}

function getHexSections(buffer: Buffer): string[] {
    const bytesPerSection = 2;
    const sections: string[] = [];
    for (let i = 0; i < buffer.length; i += bytesPerSection) {
        let section = buffer.slice(i, i + bytesPerSection).toString("hex");
        section = discardLeadingZeros(section);
        sections.push(section);
    }
    return sections;
}

function discardLeadingZeros(section: string): string {
    return section.replace(/^0+/g, "");
}

function sectionsToString(sections: string[]): string {
    let result = "";
    let hasCollapsed = false;
    for (const s of sections) {
        // alrerady in collapse state, no-op
        if (result.endsWith("::") && s === "") continue;

        // collapse zero section
        if (s === "" && !hasCollapsed) {
            hasCollapsed = true;
            if (result === "") result += "::";
            else result += ":";
            continue;
        }

        // we have a zero, but already collapsed so we need to mark as zero
        if (hasCollapsed && s === "") {
            result += "0:";
            continue;
        }

        // normal condition
        result += s + ":";
    }

    // remove trailing except with ending with ::;
    if (!result.endsWith("::")) result = result.slice(0, -1);

    return result;
}
