import { ShortChannelId } from "../shortchanid";

export interface IQueryShortIdsStrategy {
  enqueue(...scids: ShortChannelId[]): void;
}
