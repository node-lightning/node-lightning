export class ChannelSettings {
  public direction: number;
  public timestamp: number;
  public cltvExpiryDelta: number;
  public htlcMinimumMsat: bigint;
  public htlcMaximumMsat: bigint;
  public feeBaseMsat: number;
  public feeProportionalMillionths: number;
  public disabled: boolean = false;
}
