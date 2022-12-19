import { distance } from "../../Common/src/gameMath";

export class Projectile {
    private x: number;
    private y: number;
    private z: number;

    private startX: number;
    private startY: number;
    private startZ: number;

    private dirX: number;
    private dirY: number;
    private dirZ: number;

    private speed: number;
    private range: number;

    constructor(x: number, y: number, z: number, dirX: number, dirY: number, dirZ: number, speed: number, range: number) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.startX = x;
        this.startY = y;
        this.startZ = z;

        this.dirX = dirX;
        this.dirY = dirY;
        this.dirZ = dirZ;

        this.speed = speed;
        this.range = range;
    }

    update = (deltaTime: number) => {
        const currentSpeed = this.speed * deltaTime;
        this.x += this.dirX * currentSpeed;
        this.y += this.dirY * currentSpeed;
        this.z += this.dirZ * currentSpeed;

        const dist = distance(this.x, this.y, this.z, this.startX, this.startY, this.startZ);

        if (dist > this.range) {
            return false;
        }

        return true;
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