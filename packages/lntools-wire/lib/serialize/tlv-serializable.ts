export interface ITlvSerializable {
  type: bigint;
  serializeValue(): Buffer;
}
