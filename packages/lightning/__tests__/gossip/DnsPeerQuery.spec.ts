/* eslint-disable @typescript-eslint/no-explicit-any */
/* tslint:disable: no-unused-expression */
/* tslint:disable: no-floating-promises */

import { DnsPeerQuery } from "../../lib/gossip/DnsPeerQuery";
import Sinon from "sinon";
import { bech32Decode } from "../_test-utils";

import { AddressType } from "../../lib";
import { promises as dnsPromises, SrvRecord } from "dns";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import { expect } from "chai";

describe("DnsPeerQuery", () => {
    describe(".query()", () => {
        it("should bubble up resolver exceptions from resolver.resolveSrv", async () => {
            const resolver = new dnsPromises.Resolver();
            Sinon.stub(resolver, "resolveSrv").throws();
            const dnsPeerQuery = new DnsPeerQuery(resolver);

            await expect(
                dnsPeerQuery.query({
                    dnsSeed: "lseed.bitcoinstats.com",
                }),
            ).to.eventually.be.rejectedWith("Error");
        });

        it("should successfully serialize query options into properly formatted dns seed", async () => {
            const resolver = new dnsPromises.Resolver();
            const resolveSrvStub = Sinon.stub(resolver, "resolveSrv").returns(
                Promise.resolve<SrvRecord[]>([]),
            );

            const dnsPeerQuery = new DnsPeerQuery(resolver);

            await dnsPeerQuery.query({
                realm: 0,
                addressTypes: [AddressType.IPv4, AddressType.IPv6],
                desiredReplyRecords: 25,
                dnsSeed: "lseed.bitcoinstats.com",
            });

            expect(resolveSrvStub.getCall(0).args[0]).to.equal(`r0.a6.n25.lseed.bitcoinstats.com`);
        });

        it("should return peers using information from resolver", async () => {
            const resolver = new dnsPromises.Resolver();

            const resolveSrvStub = Sinon.stub(resolver, "resolveSrv").returns(
                Promise.resolve([
                    {
                        name:
                            "ln1qwktpe6jxltmpphyl578eax6fcjc2m807qalr76a5gfmx7k9qqfjwy4mctz.lseed.bitcoinstats.com.",
                        port: 6331,
                        priority: 0,
                        weight: 0,
                    },
                ]),
            );

            const resolveStub = Sinon.stub(resolver, "resolve").returns(
                Promise.resolve(["139.59.143.87"]),
            );

            const dnsPeerQuery = new DnsPeerQuery(resolver);

            const peerHostRecords = await dnsPeerQuery.query({
                dnsSeed: "lseed.bitcoinstats.com",
            });

            expect(peerHostRecords).to.have.same.deep.members([
                {
                    address: "139.59.143.87",
                    port: 6331,
                    publicKey: bech32Decode(
                        "ln1qwktpe6jxltmpphyl578eax6fcjc2m807qalr76a5gfmx7k9qqfjwy4mctz",
                    ),
                },
            ]);

            expect(resolveSrvStub.getCall(0).args[0]).to.equal("lseed.bitcoinstats.com");
            expect(resolveStub.getCall(0).args[0]).to.equal(
                "ln1qwktpe6jxltmpphyl578eax6fcjc2m807qalr76a5gfmx7k9qqfjwy4mctz.lseed.bitcoinstats.com.",
            );
        });

        it("should filter out failed ip resolutions", async () => {
            const resolver = new dnsPromises.Resolver();

            const resolveSrvStub = Sinon.stub(resolver, "resolveSrv").returns(
                Promise.resolve([
                    {
                        name:
                            "ln1qwktpe6jxltmpphyl578eax6fcjc2m807qalr76a5gfmx7k9qqfjwy4mctz.lseed.bitcoinstats.com.",
                        port: 6331,
                        weight: 0,
                        priority: 0,
                    },
                    {
                        name:
                            "ln1qv2w3tledmzczw227nnkqrrltvmydl8gu4w4d70g9td7avke6nmz2tdefqp.lseed.bitcoinstats.com.",
                        port: 9735,
                        weight: 0,
                        priority: 0,
                    },
                    {
                        name: "invalid-bech32-encoded-public-key.lseed.bitcoinstats.com.",
                        port: 9735,
                        weight: 0,
                        priority: 0,
                    },
                ]),
            );

            const resolveStub = Sinon.stub(resolver, "resolve")
                .onFirstCall()
                .returns(Promise.resolve(["139.59.143.87"]))
                .onSecondCall()
                .returns(Promise.reject(new Error()));

            const dnsPeerQuery = new DnsPeerQuery(resolver);

            const results = await dnsPeerQuery.query({
                dnsSeed: "lseed.bitcoinstats.com",
            });

            expect(results).deep.equals([
                {
                    address: "139.59.143.87",
                    port: 6331,
                    publicKey: bech32Decode(
                        "ln1qwktpe6jxltmpphyl578eax6fcjc2m807qalr76a5gfmx7k9qqfjwy4mctz",
                    ),
                },
            ]);

            expect(resolveSrvStub.getCall(0).args[0]).to.equal("lseed.bitcoinstats.com");

            expect(resolveStub.getCall(0).args[0]).to.equal(
                "ln1qwktpe6jxltmpphyl578eax6fcjc2m807qalr76a5gfmx7k9qqfjwy4mctz.lseed.bitcoinstats.com.",
            );

            expect(resolveStub.getCall(1).args[0]).to.equal(
                "ln1qv2w3tledmzczw227nnkqrrltvmydl8gu4w4d70g9td7avke6nmz2tdefqp.lseed.bitcoinstats.com.",
            );

            expect(resolveStub.getCall(2).args[0]).to.equal(
                "invalid-bech32-encoded-public-key.lseed.bitcoinstats.com.",
            );
        });
    });
});
