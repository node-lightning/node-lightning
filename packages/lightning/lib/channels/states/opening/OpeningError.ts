import { OpeningErrorType } from "./OpeningErrorType";

export class OpeningError extends Error {
    constructor(readonly type: OpeningErrorType) {
        super(OpeningErrorType[type]);
    }
}
