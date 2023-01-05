import { MessageType } from "common";
import { sendMsg } from "./net";
import { Projectile } from "./projectile";
import { User } from "./user";
import { ProjectileTypes } from "common";
import { World } from "./world";
import { Enemy } from "./enemy";
import { getCornerX, getCornerY, getCornerZ } from "common";
import { WebSocket } from "ws";

export class Projectiles {
    private data: Map<number, Projectile>;
    private nextProjectileId: number;

    constructor() {
        this.data = new Map<number, Projectile>();
        this.nextProjectileId = 0;
    }

    spawnProjectile = (x: number, y: number, z: number, dirX: number, dirY: number, dirZ: number, type: ProjectileTypes, users: Map<number, User>) => {
        if (dirX == 0 && dirY == 0 && dirZ == 0) return;

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

    spawnExistingProjectiles = (socket: WebSocket) => {
        for (let [id, projectile] of this.data) {
            sendMsg(socket, MessageType.SpawnProjectile, {
                id,
                x: projectile.getX(),
                y: projectile.getY(),
                z: projectile.getZ(),
                dirX: projectile.dirX,
                dirY: projectile.dirY,
                dirZ: projectile.dirZ,
                type: projectile.type,
            });
        }
    }

    checkCollisions = (world: World, users: Map<number, User>, enemies: Map<number, Enemy>, size: number) => {
        let projectileIds = [];
        let enemyIds = [];
        let damagedEnemyIds = [];

        for (let [projectileId, projectile] of this.data) {
            if (projectile.type == ProjectileTypes.Laser) continue;

            for (let i = 0; i < 8; i++) {
                const cornerX = projectile.getX() + size * 0.5 * getCornerX(i);
                const cornerY = projectile.getY() + size * 0.5 * getCornerY(i);
                const cornerZ = projectile.getZ() + size * 0.5 * getCornerZ(i);

                const chunkX = Math.floor(cornerX / world.chunkSize);
                const chunkY = Math.floor(cornerY / world.chunkHeight);
                const chunkZ = Math.floor(cornerZ / world.chunkSize);

                const chunk = world.getChunk(chunkX, chunkY, chunkZ);
                if (chunk == undefined) continue;

                let hit = false;

                for (let enemyId of chunk.storedEnemyIds) {
                    const enemy = enemies.get(enemyId);
                    if (enemy == undefined) continue;

                    if (Math.abs(enemy.getX() - projectile.getX()) < size &&
                        Math.abs(enemy.getY() - projectile.getY()) < size &&
                        Math.abs(enemy.getZ() - projectile.getZ()) < size) {

                        // Destroy enemy if taking damage killed it.
                        if (enemy.takeDamage(projectile.damage)) {
                            enemies.delete(enemyId);
                            enemyIds.push(enemyId);
                        } else {
                            damagedEnemyIds.push(enemyId);
                        }

                        this.data.delete(projectileId);
                        projectileIds.push(projectileId);

                        hit = true;
                        break;
                    }
                }

                if (hit) break;
            }
        }

        for (let [_id, user] of users) {
            sendMsg(user.socket, MessageType.DestroyEnemy, {
                enemyIds,
            });

            sendMsg(user.socket, MessageType.DamageEnemy, {
                damagedEnemyIds,
            });

            sendMsg(user.socket, MessageType.DestroyProjectile, {
                projectileIds,
            });
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