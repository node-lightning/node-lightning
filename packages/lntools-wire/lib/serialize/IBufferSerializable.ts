export interface IBufferSerializable<T> {
    serialize(instance: T): Buffer;
}
