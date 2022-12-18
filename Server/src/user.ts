import { Player } from "./player";
import { WebSocket } from "ws";

export type User = {
    socket: WebSocket,
    player: Player,
};