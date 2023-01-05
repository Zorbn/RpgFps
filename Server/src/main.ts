import { WebSocketServer } from "ws";
import { sendMsg } from "./net";
import { MessageType } from "common";
import { World } from "./world";
import { User } from "./user";
import { Enemy } from "./enemy";
import { Projectiles } from "./projectiles";
import { EntityTypes } from "common";

// TODO: Also check projectile collisions with players.

const port = 8080;
const wss = new WebSocketServer({ port });
const updateRate = 0.05;
const entitySize = 0.25;

let connectedUsers = new Map<number, User>();
let nextWsId = 0;
let world = new World(32, 8, 2, 1);
world.generate();
let nextEnemyId = 0;
let enemies = new Map<number, Enemy>;
let projectiles = new Projectiles();

const spawnEnemy = () => {
    let spawnX = Math.floor(Math.random() * world.mapSizeInChunks);
    let spawnY = 0;
    let spawnZ = Math.floor(Math.random() * world.mapSizeInChunks);

    let spawnPos = world.getSpawnPos(spawnX, spawnY, spawnZ, entitySize, false);

    if (!spawnPos.succeeded) return;

    const newEnemyId = nextEnemyId++;
    const newEnemy = new Enemy(spawnPos.x, spawnPos.y, spawnPos.z, 1, 100, 5);
    enemies.set(newEnemyId, newEnemy);

    // Tell players about the new enemy.
    for (let [_id, user] of connectedUsers) {
        sendMsg(user.socket, MessageType.SpawnEnemy, {
            id: newEnemyId,
            x: newEnemy.getX(),
            y: newEnemy.getY(),
            z: newEnemy.getZ(),
        });
    }
};

for (let i = 0; i < 64; i++) {
    spawnEnemy();
}

wss.on("connection", (ws) => {
    let spawnX = Math.floor(Math.random() * world.mapSizeInChunks);
    let spawnY = 0;
    let spawnZ = Math.floor(Math.random() * world.mapSizeInChunks);

    let spawnPos = world.getSpawnPos(spawnX, spawnY, spawnZ, entitySize, true);

    let player = {
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
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
    world.update(new Map<number, User>([
        [id, connectedUsers.get(id)!]
    ]), true);

    // Tell new player about all enemies on the map.
    for (let [id, enemy] of enemies) {
        sendMsg(ws, MessageType.SpawnEnemy, {
            id: id,
            x: enemy.getX(),
            y: enemy.getY(),
            z: enemy.getZ(),
        });
    }

    // Tell new player about all projectiles on the map.
    projectiles.spawnExistingProjectiles(ws);

    // Tell old players about the new player.
    const newPlayerData = {
        id,
        x: player.x,
        y: player.y,
        z: player.z,
    };

    for (let [otherId, user] of connectedUsers) {
        if (id == otherId) continue;
        sendMsg(user.socket, MessageType.SpawnPlayer, newPlayerData);
    }

    sendMsg(ws, MessageType.InitClient, {
        id,
    });

    ws.on("close", () => {
        connectedUsers.delete(id);

        // Tell other players to destroy this one.
        const data = {
            id,
        };

        for (let [_otherId, user] of connectedUsers) {
            sendMsg(user.socket, MessageType.DestroyPlayer, data);
        }
    });

    const handleMessage = (msg: any) => {
        switch (msg.type) {
            case MessageType.MovePlayer:
                if (!connectedUsers.has(msg.data.id)) return;

                let user = connectedUsers.get(msg.data.id)!;
                user.player.x = msg.data.x;
                user.player.y = msg.data.y;
                user.player.z = msg.data.z;
                break;

            case MessageType.SpawnProjectile:
                projectiles.spawnProjectile(msg.data.x, msg.data.y, msg.data.z, msg.data.dirX,
                    msg.data.dirY, msg.data.dirZ, msg.data.type, connectedUsers);
                break;
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
    // const start = performance.now();

    world.clearStored();

    for (let [id, enemy] of enemies) {
        enemy.update(projectiles, connectedUsers, world.mapSize, updateRate);
        world.tryStore(id, enemy.getX(), enemy.getY(), enemy.getZ(), entitySize, EntityTypes.Enemy);
    }

    for (let [id, user] of connectedUsers) {
        world.tryStore(id, user.player.x, user.player.y, user.player.z, entitySize, EntityTypes.Player);

        const userMoveData = {
            id: id,
            x: user.player.x,
            y: user.player.y,
            z: user.player.z,
        };

        for (let [otherId, otherUser] of connectedUsers) {
            if (otherId == id) continue;
            sendMsg(otherUser.socket, MessageType.MovePlayer, userMoveData);
        }

        let enemyUpdates = [];

        for (let [id, enemy] of enemies) {
            enemyUpdates.push({
                id,
                x: enemy.getX(),
                y: enemy.getY(),
                z: enemy.getZ(),
            })
        }

        sendMsg(user.socket, MessageType.MoveEnemy, {
            enemyUpdates,
        });
    }

    projectiles.update(updateRate);
    projectiles.checkCollisions(world, connectedUsers, enemies, entitySize);

    world.update(connectedUsers, false);

    // const end = performance.now();
    // console.log(end - start);
};

setInterval(update, updateRate * 1000);