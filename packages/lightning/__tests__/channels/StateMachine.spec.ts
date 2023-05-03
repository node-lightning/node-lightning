import Sinon from "sinon";
import { ChannelStateId, StateMachine } from "../../lib";
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

        it("should call second transition", async () => {
            // arrange
            const channel = createFakeChannel();
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            const logger = createFakeLogger();
            const fn1 = Sinon.stub();
            const fn2 = Sinon.stub().resolves(ChannelStateId.Channel_Abandoned);
            const sut = new StateMachine(logger, "A")
                .addTransition(ChannelEventType.BlockConnected, fn1)
                .addTransition(ChannelEventType.BlockConnected, fn2);

            // act
            const result = await sut.onEvent(event);

            // assert
            expect(fn1.called).to.equal(true);
            expect(fn2.called).to.equal(true);
            expect(result).to.equal(ChannelStateId.Channel_Abandoned);
        });

        it("should return undefined when no matching transitions", async () => {
            // arrange
            const channel = createFakeChannel();
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            const logger = createFakeLogger();
            const sut = new StateMachine(logger, "A");

            // act
            const result = await sut.onEvent(event);

            // assert
            expect(result).to.equal(undefined);
        });

        it("should return undefined when handlers ignored", async () => {
            // arrange
            const channel = createFakeChannel();
            const event = new ChannelEvent(ChannelEventType.BlockConnected, channel);
            const logger = createFakeLogger();
            const fn1 = Sinon.stub();
            const fn2 = Sinon.stub();
            const sut = new StateMachine(logger, "A")
                .addTransition(ChannelEventType.BlockConnected, fn1)
                .addTransition(ChannelEventType.BlockConnected, fn2);

            // act
            const result = await sut.onEvent(event);

            // assert
            expect(result).to.equal(undefined);
        });
    });
});
