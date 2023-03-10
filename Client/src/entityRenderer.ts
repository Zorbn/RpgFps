import * as Three from "three";
import { Enemy } from "./enemy";
import { EntityModel } from "./entityModel";
import { Player } from "./player";
import { Projectile } from "./projectile";

const entityVs = `
precision highp float;
precision highp int;

in int sprite;
in float blink;

out vec2 vertUv;
flat out int instId;
flat out int instSprite;
out float instBlink;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    instId = gl_InstanceID;
    instSprite = sprite;
    instBlink = blink;
    vertUv = uv;
}
`;

const entityFs = `
precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2DArray diffuse;
in vec2 vertUv;
flat in int instId;
flat in int instSprite;
in float instBlink;

out vec4 outColor;

void main() {
    vec4 color = texture(diffuse, vec3(vertUv.x, 1.0 - vertUv.y, instSprite));
    outColor = mix(color, vec4(1.0, 0.0, 0.0, color.a), instBlink);

    if (outColor.a < 0.1) {
        discard;
    }
}
`;

export class EntityRenderer {
    private mesh?: Three.InstancedMesh;
    private sprites: Int32Array;
    private blinks: Float32Array;
    private maxEntities: number;

    constructor(maxEntities: number) {
        this.sprites = new Int32Array(maxEntities);
        this.blinks = new Float32Array(maxEntities);
        this.maxEntities = maxEntities;

    }

    createMesh = (scene: Three.Scene, texture: Three.Texture) => {
        const material = new Three.ShaderMaterial({
            uniforms: {
                diffuse: { value: texture },
            },
            vertexShader: entityVs,
            fragmentShader: entityFs,
            glslVersion: Three.GLSL3,
        });

        this.mesh = new Three.InstancedMesh(
            new Three.PlaneGeometry(0.25, 0.25),
            material,
            this.maxEntities,
        );

        this.mesh.instanceMatrix.setUsage(Three.DynamicDrawUsage);

        scene.add(this.mesh);
    }

    destroy = (scene: Three.Scene) => {
        scene.remove(this.mesh!);
    }

    createMatrix = (camX: number, camZ: number, x: number, y: number, z: number) => {
        const posMatrix = new Three.Matrix4().makeTranslation(
            x,
            y,
            z,
        );

        const angle = Math.atan2(camX - x, camZ - z);
        const rotMatrix = new Three.Matrix4().makeRotationY(angle);

        return posMatrix.multiply(rotMatrix);
    }

    addModel = (model: EntityModel, instanceIndex: number, camX: number, camZ: number) => {
        if (this.mesh == undefined) return false;
        if (instanceIndex >= this.maxEntities) return false;
        if (!model.visible) return false;

        this.sprites[instanceIndex] = model.sprite;
        this.blinks[instanceIndex] = model.getBlink();
        this.mesh.setMatrixAt(instanceIndex, this.createMatrix(camX, camZ, model.getX(), model.getY(), model.getZ()));

        return true;
    }

    update = (camX: number, camZ: number, enemies: Map<number, Enemy>, players: Map<number, Player>, projectiles: Map<number, Projectile>) => {
        if (this.mesh == undefined) return;

        let instanceCount = 0;

        for (let [_id, enemy] of enemies) {
            if (this.addModel(enemy.model, instanceCount, camX, camZ)) {
                instanceCount++;
            }
        }

        for (let [_id, projectile] of projectiles) {
            if (this.addModel(projectile.model, instanceCount, camX, camZ)) {
                instanceCount++;
            }
        }

        for (let [_id, player] of players) {
            if (this.addModel(player.model, instanceCount, camX, camZ)) {
                instanceCount++;
            }
        }

        this.mesh.geometry.setAttribute("sprite", new Three.InstancedBufferAttribute(this.sprites, 1));
        this.mesh.geometry.setAttribute("blink", new Three.InstancedBufferAttribute(this.blinks, 1));

        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.count = instanceCount;
    };
}