import { distance } from "../../Common/src/gameMath";
import { Projectiles } from "./projectiles";
import { User } from "./user";

const wanderDelay = 1;

export class Enemy {
    public readonly id: number;
    private x: number;
    private y: number;
    private z: number;
    private targetX: number;
    private targetY: number;
    private targetZ: number;
    private targetPlayerId: number;
    private speed: number;
    private wanderRange: number;
    private wanderTimer: number;

    constructor(id: number, x: number, y: number, z: number, speed: number, wanderRange: number) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;
        this.speed = speed;
        this.wanderRange = wanderRange;
        this.wanderTimer = 0;
        this.targetPlayerId = 0;
    }

    getWanderPos = () => {
        return (Math.random() * 2 - 1) * this.wanderRange;
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
            dirX, dirY, dirZ, 6.0, 4.0, users);
    }

    update = (projectiles: Projectiles, users: Map<number, User>, deltaTime: number) => {
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
        this.x += dirX * currentSpeed;
        this.y += dirY * currentSpeed;
        this.z += dirZ * currentSpeed;

        this.wanderTimer -= deltaTime;

        if (this.wanderTimer <= 0) {
            this.wanderTimer = wanderDelay;

            this.targetX = this.x + this.getWanderPos();
            this.targetZ = this.z + this.getWanderPos();

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