import Sinon from "sinon";
import { StateMachine } from "../../lib";
import { ChannelEventType } from "../../lib/channels/ChannelEventType";
import { createFakeChannel, createFakeLogger } from "../_test-utils";
import { ChannelEvent } from "../../lib/channels/ChannelEvent";
import { expect } from "chai";

describe(StateMachine.name, () => {
    describe(StateMachine.prototype.onEvent.name, () => {
        it("should call direct", async () => {
            // arrange
            const channel = createFakeChannel();
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            const logger = createFakeLogger();
            const fn = Sinon.stub();
            const sut = new StateMachine(logger, "A").addTransition(
                ChannelEventType.BlockConnected,
                fn,
            );

            // act
            await sut.onEvent(event);

            // assert
            expect(fn.called).to.equal(true);
        });

        it("should call parent", async () => {
            // arrange
            const channel = createFakeChannel();
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            const logger = createFakeLogger();
            const fn = Sinon.stub();
            const sut = new StateMachine(logger, "A")
                .addSubState(new StateMachine(logger, "B"))
                .addTransition(ChannelEventType.BlockConnected, fn);

            // act
            await sut.onEvent(event);

            // assert
            expect(fn.called).to.equal(true);
        });

        it("should call grandparent", async () => {
            // arrange
            const channel = createFakeChannel();
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            const logger = createFakeLogger();
            const fn = Sinon.stub();
            const sut = new StateMachine(logger, "A")
                .addSubState(new StateMachine(logger, "B"))
                .addSubState(new StateMachine(logger, "C"))
                .addTransition(ChannelEventType.BlockConnected, fn);

            // act
            await sut.onEvent(event);

            // assert
            expect(fn.called).to.equal(true);
        });
    });
});
