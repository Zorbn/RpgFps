import { MessageType } from "../../Common/src/net";
import { sendMsg } from "./net";
import { Projectile } from "./projectile";
import { User } from "./user";
import { ProjectileTypes } from "../../Common/src/projectiles";
import { World } from "./world";
import { EntityTypes } from "../../Common/src/entityTypes";
import { Enemy } from "./enemy";

export class Projectiles {
    private data: Map<number, Projectile>;
    private nextProjectileId: number;

    constructor() {
        this.data = new Map<number, Projectile>();
        this.nextProjectileId = 0;
    }

    spawnProjectile = (x: number, y: number, z: number, dirX: number, dirY: number, dirZ: number, type: ProjectileTypes, users: Map<number, User>) => {
        const newProjectileId = this.nextProjectileId++;
        const newProjectile = new Projectile(x, y, z, dirX, dirY, dirZ, type);
        this.data.set(newProjectileId, newProjectile);

        const newProjectileData = {
            id: newProjectileId,
            x,
            y,
            z,
            dirX,
            dirY,
            dirZ,
            type,
        };

        for (let [_id, user] of users) {
            sendMsg(user.socket, MessageType.SpawnProjectile, newProjectileData);
        }
    }

    // TODO: Also check collisions with players
    checkCollisions = (world: World, users: Map<number, User>, enemies: Map<number, Enemy>, entitySize: number) => {
        for (let [_projectileId, projectile] of this.data) {
            if (projectile.type == ProjectileTypes.Laser) continue;

            const chunkX = Math.floor(projectile.getX() / world.chunkSize);
            const chunkY = Math.floor(projectile.getY() / world.chunkHeight);
            const chunkZ = Math.floor(projectile.getZ() / world.chunkSize);

            const chunk = world.getChunk(chunkX, chunkY, chunkZ);
            if (chunk == undefined) return;

            for (let enemyId of chunk.storedEnemyIds) {
                const enemy = enemies.get(enemyId);
                if (enemy == undefined) continue;

                if (Math.abs(enemy.getX() - projectile.getX()) < entitySize &&
                    Math.abs(enemy.getY() - projectile.getY()) < entitySize &&
                    Math.abs(enemy.getZ() - projectile.getZ()) < entitySize) {

                    enemies.delete(enemyId);

                    const destroyEnemyData = {
                        id: enemyId,
                    };

                    for (let [_id, user] of users) {
                        sendMsg(user.socket, MessageType.DestroyEnemy, destroyEnemyData);
                    }
                }
            }
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