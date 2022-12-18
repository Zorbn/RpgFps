/*
 * AI Movement:
 * Pick a random spot within $range around itself every $time and
 * move there. If a player is nearby at the end of $time, pick a random
 * spot within $range of player and move there.
 */

const wanderDelay = 1;

export class Enemy {
    public readonly id: number;
    private x: number;
    private y: number;
    private z: number;
    private targetX: number;
    private targetY: number;
    private targetZ: number;
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
    }

    getWanderPos = () => {
        return (Math.random() * 2 - 1) * this.wanderRange;
    }

    update = (deltaTime: number) => {
        const currentSpeed = this.speed * deltaTime;
        this.x += Math.sign(this.targetX - this.x) * currentSpeed;
        this.y += Math.sign(this.targetY - this.y) * currentSpeed;
        this.z += Math.sign(this.targetZ - this.z) * currentSpeed;

        this.wanderTimer -= deltaTime;

        if (this.wanderTimer <= 0) {
            this.wanderTimer = wanderDelay;

            this.targetX = this.x + this.getWanderPos();
            this.targetY = this.y + this.getWanderPos();
            this.targetZ = this.z + this.getWanderPos();
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