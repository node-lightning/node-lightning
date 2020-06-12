export interface IBufferDeserializable<T> {
    deserialize(buf: Buffer): T;
}
