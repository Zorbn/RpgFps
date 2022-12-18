import * as Three from "three";
import { Blocks, blockAttributes } from "../../Common/src/blocks";
import { directionVecs } from "../../Common/src/direction";
import { cubeMesh } from "./cubeMesh";
import { crossMesh } from "./crossMesh";
import { World } from "./world";

const vs = `
attribute vec3 uv3;

out vec3 vertUv;
out vec3 vertColor;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vertUv = uv3;
    vertColor = color;
}
`;

const fs = `
precision highp float;
precision highp sampler2DArray;

uniform sampler2DArray diffuse;
in vec3 vertUv;
in vec3 vertColor;

out vec4 outColor;

void main() {
    outColor = texture(diffuse, vertUv) * vec4(vertColor, 1.0);

    if (outColor.a < 0.5) {
        discard;
    }
}
`;

export class Chunk {
    public needsUpdate: boolean;
    private chunkX: number;
    private chunkY: number;
    private chunkZ: number;
    private size: number;
    private height: number;
    private data: Blocks[];
    private mesh: Three.Mesh;

    constructor(size: number, height: number, x: number, y: number, z: number, scene: Three.Scene, texture: Three.Texture) {
        this.chunkX = x;
        this.chunkY = y;
        this.chunkZ = z;
        this.size = size;
        this.height = height;
        this.data = new Array(size * height * size);

        const material = new Three.ShaderMaterial({
            uniforms: {
                diffuse: { value: texture },
            },
            vertexColors: true,
            vertexShader: vs,
            fragmentShader: fs,
            glslVersion: Three.GLSL3,
        });
        this.mesh = new Three.Mesh(new Three.BufferGeometry(), material);
        scene.add(this.mesh);

        this.needsUpdate = false;
    }

    getBlockIndex = (x: number, y: number, z: number) => {
        return x + y * this.size + z * this.size * this.height;
    }

    setBlock = (x: number, y: number, z: number, type: number) => {
        if (x < 0 || x >= this.size || y < 0 || y >= this.height || z < 0 || z >= this.size) return false;

        this.data[this.getBlockIndex(x, y, z)] = type;
        this.needsUpdate = true;

        return true;
    }

    getBlock = (x: number, y: number, z: number) => {
        if (x < 0 || x >= this.size || y < 0 || y >= this.height || z < 0 || z >= this.size) return Blocks.Air;

        return this.data[this.getBlockIndex(x, y, z)];
    }

    update = (world: World) => {
        if (this.needsUpdate) {
            this.updateMesh(world);
            this.needsUpdate = false;
        }
    }

    updateMesh = (world: World) => {
        let vertices = [];
        let uvs = [];
        let indices = [];
        let colors = [];

        let vertexComponentI = 0;
        let vertexI = 0;
        let indexI = 0;

        // Generate the mesh for the chunk's blocks.
        for (let z = 0; z < this.size; z++)
        for (let y = 0; y < this.height; y++)
        for (let x = 0; x < this.size; x++) {
            let worldX = x + this.chunkX * this.size;
            let worldY = y + this.chunkY * this.height;
            let worldZ = z + this.chunkZ * this.size;
            const block = world.getBlock(worldX, worldY, worldZ);

            // Don't render air.
            if (block == Blocks.Air) continue;

            let mesh;
            let cullFaces;

            if (blockAttributes.get(block)!.transparent) {
                mesh = crossMesh;
                cullFaces = false;
            } else {
                mesh = cubeMesh;
                cullFaces = true;
            }

            const faces = mesh.vertices.length;

            for (let face = 0; face < faces; face++) {
                // Only generate faces that will be visible when culling is enabled.
                const dir = directionVecs[face];
                if (!cullFaces || !world.isBlockOccupied(worldX + dir[0], worldY + dir[1], worldZ + dir[2], false)) {
                    for (let ii = 0; ii < 6; ii++) {
                        indices[indexI] = mesh.indices[face][ii] + vertexI;
                        indexI++;
                    }

                    for (let vi = 0; vi < 4; vi++) {
                        // Add vertex x, y, and z for this face.
                        vertices[vertexComponentI] = mesh.vertices[face][vi * 3] + worldX;
                        vertices[vertexComponentI + 1] = mesh.vertices[face][vi * 3 + 1] + worldY;
                        vertices[vertexComponentI + 2] = mesh.vertices[face][vi * 3 + 2] + worldZ;

                        // Add UV x and y for this face.
                        uvs[vertexComponentI] = mesh.uvs[face][vi * 2];
                        uvs[vertexComponentI + 1] = mesh.uvs[face][vi * 2 + 1];
                        // The UV's z is the index of it's texture.
                        uvs[vertexComponentI + 2] = block;

                        // Add color for this face.
                        let faceColor = mesh.colors[face];
                        colors[vertexComponentI] = faceColor;
                        colors[vertexComponentI + 1] = faceColor;
                        colors[vertexComponentI + 2] = faceColor;

                        vertexComponentI += 3;
                        vertexI++;
                    }
                }
            }
        }

        this.mesh.geometry.setIndex(indices);

        this.mesh.geometry.setAttribute("position", new Three.BufferAttribute(new Float32Array(vertices), 3));
        this.mesh.geometry.setAttribute("uv3", new Three.BufferAttribute(new Float32Array(uvs), 3));
        this.mesh.geometry.setAttribute("color", new Three.BufferAttribute(new Float32Array(colors), 3));

        this.mesh.geometry.getAttribute("position").needsUpdate = true;
        this.mesh.geometry.getAttribute("uv3").needsUpdate = true;
        this.mesh.geometry.getAttribute("color").needsUpdate = true;
    }

    updateData = (data: Blocks[]) => {
        this.data = data;
        this.needsUpdate = true;
    }

    destroy = (scene: Three.Scene) => {
        this.mesh.geometry.dispose();
        let material = this.mesh.material as Three.Material;
        material.dispose();
        scene.remove(this.mesh);
    }
}