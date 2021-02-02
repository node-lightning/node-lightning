import { expect } from "chai";

export type Fixture<INPUT, EXPECTED> = {
    title: string;
    input: INPUT;
    expected?: EXPECTED;
    throws?: boolean;
};

export type Run<INPUT, OUTPUT> = (input: INPUT) => OUTPUT;
export type Assert<ACTUAL, EXPECTED> = (actual: ACTUAL, expected: EXPECTED) => void;

function testFixture<INPUT, OUTPUT, EXPECTED>(
    fixture: Fixture<INPUT, EXPECTED>,
    run: Run<INPUT, OUTPUT>,
    assert: Assert<OUTPUT, EXPECTED>,
) {
    it(fixture.title, () => {
        if (fixture.throws) {
            expect(() => run(fixture.input)).to.throw();
            return;
        }
        assert(run(fixture.input), fixture.expected);
    });
}

export function testFixtures<I, O, E>(
    fixtures: Array<Fixture<I, E>>,
    run: Run<I, O>,
    assert: Assert<O, E>,
) {
    for (const fixture of fixtures) {
        testFixture(fixture, run, assert);
    }
}
