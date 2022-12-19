import { MessageType } from "../../Common/src/net";
import { sendMsg } from "./net";
import { Projectile } from "./projectile";
import { User } from "./user";

export class Projectiles {
    private data: Map<number, Projectile>;
    private nextProjectileId: number;

    constructor() {
        this.data = new Map<number, Projectile>();
        this.nextProjectileId = 0;
    }

    spawnProjectile = (x: number, y: number, z: number, dirX: number, dirY: number, dirZ: number, speed: number, range: number, users: Map<number, User>) => {
        const newProjectileId = this.nextProjectileId++;
        const newProjectile = new Projectile(x, y, z, dirX, dirY, dirZ, speed, range);
        this.data.set(newProjectileId, newProjectile);

        const newProjectileData = {
            id: newProjectileId,
            x,
            y,
            z,
            dirX,
            dirY,
            dirZ,
            speed,
            range,
        };

        for (let [_id, user] of users) {
            sendMsg(user.socket, MessageType.SpawnProjectile, newProjectileData);
        }
    }

    update = (deltaTime: number) => {
        for (let [id, projectile] of this.data) {
            if (!projectile.update(deltaTime)) {
                this.data.delete(id);
            }
        }
    }
}