import winston from "winston";
import { MESSAGE_TYPE } from "./message-type";
import { ChannelAnnouncementMessage } from "./messages/channel-announcement-message";
import { ChannelUpdateMessage } from "./messages/channel-update-message";
import { ErrorMessage } from "./messages/error-message";
import { InitMessage } from "./messages/init-message";
import { NodeAnnouncementMessage } from "./messages/node-announcement-message";
import { PingMessage } from "./messages/ping-message";
import { PongMessage } from "./messages/pong-message";

const typeMap = {
  // control messages
  [MESSAGE_TYPE.INIT]: InitMessage,
  [MESSAGE_TYPE.ERROR]: ErrorMessage,
  [MESSAGE_TYPE.PING]: PingMessage,
  [MESSAGE_TYPE.PONG]: PongMessage,

  // channel messages
  // [MESSAGE_TYPE.ANNOUNCEMENT_SIGNATURES]: messages.AnnouncementSignaturesMessage,
  [MESSAGE_TYPE.NODE_ANNOUNCEMENT]: NodeAnnouncementMessage,
  [MESSAGE_TYPE.CHANNEL_ANNOUNCEMENT]: ChannelAnnouncementMessage,
  [MESSAGE_TYPE.CHANNEL_UPDATE]: ChannelUpdateMessage,
};

function constructType(type: MESSAGE_TYPE): any {
  return typeMap[type];
}

export function deserialize(buffer) {
  const type = buffer.readUInt16BE();

  // tslint:disable-next-line: variable-name
  const Type = constructType(type);
  if (Type) return Type.deserialize(buffer);
  else winston.warn("unknown message type " + type);
}

export function construct(type: any, args: any[]) {
  // tslint:disable-next-line: variable-name
  const Type = constructType(type);
  return new Type(args);
}
