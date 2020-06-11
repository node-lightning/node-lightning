import { ITransport } from "../transport";

export class ConsoleTransport implements ITransport {
    public console: Console;

    constructor(console: Console) {
        this.console = console;
    }

    public write(line: string) {
        this.console.log(line);
    }
}
