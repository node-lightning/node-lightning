import { Result } from "../Result";
import { OpeningErrorType } from "./OpeningErrorType";

export class OpeningError extends Error {
    public static toResult<T>(type: OpeningErrorType): Result<T, OpeningError> {
        return Result.err(new OpeningError(type));
    }

    constructor(readonly type: OpeningErrorType) {
        super(OpeningErrorType[type]);
    }
}
