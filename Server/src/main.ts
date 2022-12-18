import { WebSocketServer } from "ws";
import { MessageType, sendMsg } from "./net";
import { World } from "./world";
import { User } from "./user";

const port = 8080;
const wss = new WebSocketServer({ port });
const updateRate = 0.016;

let connectedUsers = new Map<number, User>();
let nextWsId = 0;
let world = new World(32, 8, 2, 1);

wss.on("connection", (ws) => {
    let player = {
        x: Math.random() * 5,
        y: 0.25,
        z: 0,
    };

    let id = nextWsId++;
    connectedUsers.set(id, {
        socket: ws,
        player,
    });

    // Tell new player about all current players (including themself).
    for (let [otherId, user] of connectedUsers) {
        sendMsg(ws, MessageType.SpawnPlayer, {
            id: otherId,
            x: user.player.x,
            y: user.player.y,
            z: user.player.z,
        });
    }

    // Tell new player about the map.
    world.update(world, new Map<number, User>([
        [id, connectedUsers.get(id)!]
    ]), true);

    // Tell old players about the new player.
    for (let [otherId, user] of connectedUsers) {
        if (id == otherId) continue;
        sendMsg(user.socket, MessageType.SpawnPlayer, {
            id,
            x: player.x,
            y: player.y,
            z: player.z,
        });
    }

    sendMsg(ws, MessageType.InitClient, {
        id,
    });

    ws.on("close", () => {
        connectedUsers.delete(id);
    });

    const handleMessage = (msg: any) => {
        if (msg.type == MessageType.MovePlayer) {
            if (!connectedUsers.has(msg.data.id)) return;

            let user = connectedUsers.get(msg.data.id)!;
            user.player.x = msg.data.x;
            user.player.y = msg.data.y;
            user.player.z = msg.data.z;
        }
    };

    ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());

        try {
            handleMessage(msg);
        } catch (e) {
            console.log(`Failed to handle packed from ${id}: ${e}`);
        }
    })
});

const update = () => {
    for (let [id, user] of connectedUsers) {
        for (let [otherId, otherUser] of connectedUsers) {
            if (otherId == id) continue;
            sendMsg(user.socket, MessageType.MovePlayer, {
                id: otherId,
                x: otherUser.player.x,
                y: otherUser.player.y,
                z: otherUser.player.z,
            });
        }
    }

    world.update(world, connectedUsers, false);
};

world.generate();

setInterval(update, updateRate * 1000);