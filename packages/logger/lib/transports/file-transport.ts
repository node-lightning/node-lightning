import fs from "fs";
import { ITransport } from "../transport";

export class FileTransport implements ITransport {
    public filePath: string;
    public fileDescriptor: number;

    constructor(filepath: string) {
        this.filePath = filepath;
        this.fileDescriptor = fs.openSync(filepath, "a", 0o666);
    }

    public write(line: string) {
        fs.writeSync(this.fileDescriptor, line + "\n");
    }
}
