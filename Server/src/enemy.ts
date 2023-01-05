import { clamp, distance } from "common";
import { ProjectileTypes } from "common";
import { Projectiles } from "./projectiles";
import { User } from "./user";

const wanderDelay = 1;

export class Enemy {
    private x: number;
    private y: number;
    private z: number;
    private targetX: number;
    private targetY: number;
    private targetZ: number;
    private targetPlayerId: number;
    private health: number;
    private speed: number;
    private wanderRange: number;
    private wanderTimer: number;

    constructor(x: number, y: number, z: number, speed: number, health: number, wanderRange: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;
        this.speed = speed;
        this.health = health;
        this.wanderRange = wanderRange;
        this.wanderTimer = 0;
        this.targetPlayerId = 0;
    }

    getWanderPos = (current: number, min: number, max: number) => {
        const newPos = current + (Math.random() * 2 - 1) * this.wanderRange;

        if (newPos < min) return min;
        if (newPos >= max) return max;

        return newPos;
    }

    attack = (projectiles: Projectiles, users: Map<number, User>) => {
        if (!users.has(this.targetPlayerId)) return;

        let targetPlayer = users.get(this.targetPlayerId)!.player;

        let dirX = targetPlayer.x - this.x;
        let dirY = targetPlayer.y - this.y;
        let dirZ = targetPlayer.z - this.z;

        const dist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

        if (dist != 0) {
            dirX /= dist;
            dirY /= dist;
            dirZ /= dist;
        }

        projectiles.spawnProjectile(this.x, this.y, this.z,
            dirX, dirY, dirZ, ProjectileTypes.Laser, users);
    }

    update = (projectiles: Projectiles, users: Map<number, User>, mapSize: number, deltaTime: number) => {
        this.wanderTimer -= deltaTime;

        if (this.wanderTimer <= 0) {
            this.wanderTimer = wanderDelay;

            this.targetX = this.getWanderPos(this.x, 1, mapSize - 1);
            this.targetZ = this.getWanderPos(this.z, 1, mapSize - 1);

            let nearestDistance = Infinity;

            for (let [id, user] of users) {
                const dist = distance(this.x, this.y, this.z, user.player.x,
                    user.player.y, user.player.z);
                if (dist < nearestDistance) {
                    nearestDistance = dist;
                    this.targetPlayerId = id;
                }
            }

            this.attack(projectiles, users);
        }

        let dirX = this.targetX - this.x;
        let dirY = this.targetY - this.y;
        let dirZ = this.targetZ - this.z;

        const dist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

        if (dist != 0) {
            dirX /= dist;
            dirY /= dist;
            dirZ /= dist;
        }

        const currentSpeed = this.speed * deltaTime;
        this.x = clamp(this.x + dirX * currentSpeed, 0, mapSize);
        this.y = clamp(this.y + dirY * currentSpeed, 0, mapSize);
        this.z = clamp(this.z + dirZ * currentSpeed, 0, mapSize);
    }

    takeDamage = (amount: number) => {
        this.health -= amount;

        return this.health <= 0;
    }

    getX = () => {
        return this.x;
    }

    getY = () => {
        return this.y;
    }

    getZ = () => {
        return this.z;
    }
}