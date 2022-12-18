import { WebSocket } from "ws";

export enum MessageType {
    SpawnPlayer,
    MovePlayer,
    InitClient,
    UpdateChunk,
};

export const sendMsg = (socket: WebSocket, type: MessageType, data: object) => {
    socket.send(JSON.stringify({
        type,
        data,
    }));
};