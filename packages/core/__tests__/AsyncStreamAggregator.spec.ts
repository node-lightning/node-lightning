/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/require-await */
import Sinon from "sinon";
import { expect } from "chai";
import { Readable } from "stream";
import { AsyncStreamAggregator } from "../lib/AsyncStreamAggregator";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("AsyncStreamAggregator", () => {
    class MockStream extends Readable {
        protected count: number = 0;

        constructor(readonly name: string) {
            super({ objectMode: true });
        }

        public _read(): void {
            // do nothing here
        }

        /**
         * This will trigger a "readable" event
         */
        public test(): boolean {
            return this.push({ name: this.name, count: ++this.count });
        }
    }

    it("should read from single producers", done => {
        const mock = new MockStream("test");

        const sut = new AsyncStreamAggregator(
            async (data: any) => {
                await wait(0);
                expect(data).to.deep.equal({ name: "test", count: 1 });
                done();
            },
            async (ex: Error) => {
                done(ex);
            },
        );
        sut.add(mock);

        mock.test();
    });

    it("should calls error handler", done => {
        const mock = new MockStream("test");

        const sut = new AsyncStreamAggregator(
            async () => {
                await wait(0);
                throw new Error("Boom");
            },
            async (ex: Error) => {
                try {
                    expect(ex.message).to.equal("Boom");
                    done();
                } catch (ex2) {
                    done(ex2);
                }
            },
        );
        sut.add(mock);

        mock.test();
    });

    it("should read from multiple producers", done => {
        const mock1 = new MockStream("1");
        const mock2 = new MockStream("2");

        const calls = [];
        const sut = new AsyncStreamAggregator(
            async (data: any) => {
                await wait(0);
                calls.push(data);
                if (calls.length === 2) {
                    expect(calls[0]).to.deep.equal({ name: "1", count: 1 });
                    expect(calls[1]).to.deep.equal({ name: "2", count: 1 });
                    done();
                }
            },
            async (ex: Error) => {
                done(ex);
            },
        );
        sut.add(mock1);
        sut.add(mock2);

        mock1.test();
        mock2.test();
    });

    it("should read from multiple producers in round-robin order", done => {
        const mock1 = new MockStream("1");
        const mock2 = new MockStream("2");

        const calls = [];
        const sut = new AsyncStreamAggregator(
            async (data: any) => {
                await wait(0);
                calls.push(data);
                if (calls.length === 5) {
                    expect(calls[0]).to.deep.equal({ name: "1", count: 1 });
                    expect(calls[1]).to.deep.equal({ name: "2", count: 1 });
                    expect(calls[2]).to.deep.equal({ name: "1", count: 2 });
                    expect(calls[3]).to.deep.equal({ name: "2", count: 2 });
                    expect(calls[4]).to.deep.equal({ name: "1", count: 3 });
                    done();
                }
            },
            async (ex: Error) => {
                done(ex);
            },
        );
        sut.add(mock1);
        sut.add(mock2);

        mock1.test();
        mock1.test();
        mock1.test();
        mock2.test();
        mock2.test();
    });
});
