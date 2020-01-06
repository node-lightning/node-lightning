import { ErrorCode } from "./error-code";
import { ErrorCodeStrings } from "./error-code-string";

/**
 * Creates an error for a graph operation and captures relevant that
 * caused the error to be emitted or thrown.
 */
export class GraphError extends Error {
  public area: string;
  public code: ErrorCode;
  public data: any;

  constructor(code: ErrorCode, data: any) {
    const msg = `${ErrorCodeStrings[code]}`;
    super(msg);

    this.area = "graph";
    this.code = code;
    this.data = data;
  }
}
