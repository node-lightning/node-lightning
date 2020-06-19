import { BufferReader } from "@lntools/buffer-cursor";
import { ITlvDeserializable } from "./ITlvDeserializable";
import { TlvValueReader } from "./TlvValueReader";

export class TlvStreamReader {
    private _deserializers: Map<bigint, ITlvDeserializable<any>> = new Map();
    private _lastType: bigint;

    public register(type: ITlvDeserializable<any>) {
        this._deserializers.set(type.type, type);
    }

    public read(reader: BufferReader): any[] {
        const results = [];
        while (!reader.eof) {
            const result = this.readRecord(reader);
            if (result) results.push(result);
        }
        return results;
    }

    public readRecord(reader: BufferReader): any {
        if (reader.eof) return;

        const type = reader.readBigSize();
        const len = reader.readBigSize();
        const bytes = reader.readBytes(Number(len));

        if (type <= this._lastType) {
            throw new Error("Invalid TLV stream");
        }
        this._lastType = type;

        const deserType = this._deserializers.get(type);
        if (deserType) {
            const valueReader = new TlvValueReader(bytes);
            const result = deserType.deserialize(valueReader);
            valueReader.done();
            return result;
        } else if (type % BigInt(2) === BigInt(0)) {
            throw new Error("Unknown even type");
        }
    }
}
