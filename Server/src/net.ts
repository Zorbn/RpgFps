import { WebSocket } from "ws";
import { MessageType } from "common";

export const sendMsg = (socket: WebSocket, type: MessageType, data: object) => {
    socket.send(JSON.stringify({
        type,
        data,
    }));
};