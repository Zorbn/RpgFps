import * as Three from "three";
import { EntityModel } from "./entityModel";

const playerSpeed = 3;
const maxLookAngle = Math.PI * 0.5 * 0.99;
const eyeOffset = 0.1875;

export class Player {
    public readonly model: EntityModel;
    private x: number;
    private y: number;
    private z: number;
    private angle: Three.Euler;
    private forwardDir: Three.Vector2;
    private rightDir: Three.Vector2;
    private lookDir: Three.Vector3;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.model = new EntityModel(x, y, z, 0);

        this.angle = new Three.Euler(0, 0, 0, "YXZ");
        this.forwardDir = new Three.Vector2();
        this.rightDir = new Three.Vector2();
        this.lookDir = new Three.Vector3();
    }

    rotate = (camera: Three.Camera, deltaX: number, deltaY: number) => {
        this.angle.x += deltaX;
        this.angle.y += deltaY;
        this.angle.x = Math.max(Math.min(this.angle.x, maxLookAngle), -maxLookAngle);

        this.forwardDir.x = Math.sin(this.angle.y);
        this.forwardDir.y = Math.cos(this.angle.y);

        const rightCameraAngle = this.angle.y + Math.PI / 2;

        this.rightDir.x = Math.sin(rightCameraAngle);
        this.rightDir.y = Math.cos(rightCameraAngle);

        camera.quaternion.setFromEuler(this.angle);
        camera.getWorldDirection(this.lookDir);
    };

    update = (deltaTime: number) => {
        this.model.interpolate(this.x, this.y, this.z, deltaTime);
    }

    move = (moveX: number, moveZ: number, deltaTime: number) => {
        const currentSpeed = playerSpeed * deltaTime;

        this.x -= (moveZ * this.forwardDir.x + moveX * this.rightDir.x) * currentSpeed;
        this.z -= (moveZ * this.forwardDir.y + moveX * this.rightDir.y) * currentSpeed;
    }

    moveCamera = (camera: Three.Camera) => {
        camera.position.x = this.x;
        camera.position.y = this.y + eyeOffset;
        camera.position.z = this.z;
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