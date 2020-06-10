import { TlvValueReader } from "./TlvValueReader";

/**
 * Interface for a type that supports methods used
 * by the TlvStreamReader.  Objects that support this can
 * be registers with the reader and will be automatically
 * processed.
 */
export interface ITlvDeserializable<T> {
  type: bigint;
  new (): T;
  deserialize(reader: TlvValueReader): T;
}
