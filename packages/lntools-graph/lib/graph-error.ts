export enum ErrorCode {
  duplicateChannel = 1,
  nodeNotFound = 2,
  channelNotFound = 3,
}

export function graphErrorCodeMessage(code: ErrorCode) {
  switch (code) {
    case ErrorCode.duplicateChannel:
      return "channel_exists";
  }
}

export class GraphError extends Error {
  public code: ErrorCode;

  constructor(code: ErrorCode) {
    super();
    this.code = code;
    this.message = `graph error ${graphErrorCodeMessage(code)}`;
  }
}
