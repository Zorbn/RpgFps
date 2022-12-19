import { EntityModel } from "./entityModel";

export class Enemy {
    public readonly model: EntityModel;
    private x: number;
    private y: number;
    private z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.model = new EntityModel(x, y, z, 1);
    }

    update = (deltaTime: number) => {
        this.model.interpolate(this.x, this.y, this.z, deltaTime);
    }

    setPos = (x: number, y: number, z: number) => {
        this.x = x;
        this.y = y;
        this.z = z;
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