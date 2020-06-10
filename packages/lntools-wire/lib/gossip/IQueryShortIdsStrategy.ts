import { ShortChannelId } from "../ShortChannelId";

export interface IQueryShortIdsStrategy {
  enqueue(...scids: ShortChannelId[]): void;
}
