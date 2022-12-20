import { distance } from "../../Common/src/gameMath";
import { ProjectileTypes, projectileAttributes } from "../../Common/src/projectiles";

export class Projectile {
    public readonly type: ProjectileTypes;
    public readonly damage: number;

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

    constructor(x: number, y: number, z: number, dirX: number, dirY: number, dirZ: number, type: ProjectileTypes) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.startX = x;
        this.startY = y;
        this.startZ = z;

        this.dirX = dirX;
        this.dirY = dirY;
        this.dirZ = dirZ;

        this.type = type;

        const attributes = projectileAttributes.get(type)!
        this.speed = attributes.speed;
        this.range = attributes.range;
        this.damage = attributes.damage;
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