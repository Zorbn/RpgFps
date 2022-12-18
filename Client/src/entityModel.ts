const interpSpeed = 10;

export class EntityModel {
    public readonly sprite: number;
    public visible: boolean;
    public x: number;
    public y: number;
    public z: number;

    constructor(x: number, y: number, z: number, sprite: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.sprite = sprite;
        this.visible = true;
    }

    interpolate = (targetX: number, targetY: number, targetZ: number, deltaTime: number) => {
        this.x += deltaTime * interpSpeed * (targetX - this.x);
        this.y += deltaTime * interpSpeed * (targetY - this.y);
        this.z += deltaTime * interpSpeed * (targetZ - this.z);
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