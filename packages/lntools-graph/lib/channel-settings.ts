import BN = require("bn.js");

export class ChannelSettings {
  public signature: Buffer;
  public direction: number;
  public timestamp: number;
  public cltvExpiryDelta: number;
  public htlcMinimumMsat: BN;
  public htlcMaximumMsat: BN;
  public feeBaseMsat: number;
  public feeProportionalMillionths: number;
  public disabled: boolean;

  public toJSON() {
    return {
      signature: this.signature.toString("hex"),
      timestamp: this.timestamp,
      cltvExpiryDelta: this.cltvExpiryDelta,
      htlcMinimumMsat: this.htlcMinimumMsat.toString(10),
      htlcMaximumMsat: this.htlcMaximumMsat ? this.htlcMaximumMsat.toString(10) : undefined,
      feeBaseMsat: this.feeBaseMsat.toString(10),
      feeProportionalMillionths: this.feeProportionalMillionths.toString(10),
      disabled: this.disabled,
    };
  }
}
