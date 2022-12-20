const interpSpeed = 10;
const blinkSpeed = 5;

export class EntityModel {
    public readonly sprite: number;
    public visible: boolean;
    private x: number;
    private y: number;
    private z: number;
    private blink: number;

    constructor(x: number, y: number, z: number, sprite: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.sprite = sprite;
        this.visible = true;
        this.blink = 0;
    }

    interpolate = (targetX: number, targetY: number, targetZ: number, deltaTime: number) => {
        this.x += deltaTime * interpSpeed * (targetX - this.x);
        this.y += deltaTime * interpSpeed * (targetY - this.y);
        this.z += deltaTime * interpSpeed * (targetZ - this.z);

        this.blink = Math.max(this.blink - deltaTime * blinkSpeed, 0);
    }

    startBlink = () => {
        this.blink = 1;
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

    getBlink = () => {
        return this.blink;
    }
}