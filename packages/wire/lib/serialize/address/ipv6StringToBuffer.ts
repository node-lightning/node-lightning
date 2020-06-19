import { BufferWriter } from "@lntools/buffer-cursor";

/**
 * Converts an IPv6 address in string notation to the
 * byte representation.
 */
export function ipv6StringToBuffer(host: string): Buffer {
    // replace start or end expansion with single part to retain correct
    // number of parts (8) that are used in the remainder of the logic.
    // ie: ::1:2:3:4:5:6:7 would split to ['','',1,2,3,4,5,6,7] and
    // result in overflows
    if (host.startsWith("::")) host = host.substr(1);
    else if (host.endsWith("::")) host = host.substr(0, host.length - 1);

    const parts = host.split(":");

    const writer = new BufferWriter(Buffer.alloc(16));

    const expandBy = 8 - parts.length;
    let needsExpansion = expandBy > 0;

    for (const part of parts) {
        if (needsExpansion && part === "") {
            const b = Buffer.alloc((expandBy + 1) * 2);
            writer.writeBytes(b);
            needsExpansion = false;
        } else {
            const b = Buffer.from(expandZeros(part), "hex");
            writer.writeBytes(b);
        }
    }

    return writer.toBuffer();
}

function expandZeros(part: string): string {
    return part.padStart(4, "0");
}
