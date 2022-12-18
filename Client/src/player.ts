import * as Three from "three";

const playerSpeed = 3;
const playerModelInterpSpeed = 10;
const maxLookAngle = Math.PI * 0.5 * 0.99;

export class Player {
    public readonly size: number;
    private x: number;
    private y: number;
    private z: number;
    private eyeOffset: number;
    private angle: Three.Euler;
    private forwardDir: Three.Vector2;
    private rightDir: Three.Vector2;
    private lookDir: Three.Vector3;
    private model: Three.Mesh;

    constructor(scene: Three.Scene, x: number, y: number, z: number, size: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = size;
        this.eyeOffset = size * 0.25;

        const geometry = new Three.BoxGeometry(size, size, size);
        const material = new Three.MeshBasicMaterial({
            color: 0x00ff00,
        });

        this.model = new Three.Mesh(geometry, material);
        this.model.position.x = x;
        this.model.position.y = y;
        this.model.position.z = z;

        scene.add(this.model);

        this.angle = new Three.Euler(0, 0, 0, "YXZ");
        this.forwardDir = new Three.Vector2();
        this.rightDir = new Three.Vector2();
        this.lookDir = new Three.Vector3();
    }

    delete = (scene: Three.Scene) => {
        scene.remove(this.model);

        this.model.geometry.dispose();
        let material = this.model.material as Three.Material;
        material.dispose();
    };

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

    move = (moveX: number, moveZ: number, deltaTime: number) => {
        const currentSpeed = playerSpeed * deltaTime;

        this.x -= (moveZ * this.forwardDir.x + moveX * this.rightDir.x) * currentSpeed;
        this.z -= (moveZ * this.forwardDir.y + moveX * this.rightDir.y) * currentSpeed;
    }

    moveCamera = (camera: Three.Camera) => {
        camera.position.x = this.x;
        camera.position.y = this.y + this.eyeOffset;
        camera.position.z = this.z;
    }

    interpolateModel = (deltaTime: number) => {
        this.model.position.x += deltaTime * playerModelInterpSpeed * (this.x - this.model.position.x);
        this.model.position.y += deltaTime * playerModelInterpSpeed * (this.y - this.model.position.y);
        this.model.position.z += deltaTime * playerModelInterpSpeed * (this.z - this.model.position.z);
    }

    setPos = (x: number, y: number, z: number) => {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    setVisible = (visible: boolean) => {
        this.model.visible = visible;
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