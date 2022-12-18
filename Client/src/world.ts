import * as Three from "three";
import { Chunk } from "./chunk";
import { hashVector } from "../../Common/src/gameMath";
import { blockAttributes, Blocks } from "../../Common/src/blocks";

export class World {
    public readonly mapSizeInChunks: number;
    public readonly mapHeightInChunks: number;
    public readonly mapSize: number;
    public readonly mapHeight: number;
    private chunkSize: number;
    private chunkHeight: number;
    private chunks: Map<number, Chunk>;

    constructor(chunkSize: number, chunkHeight: number, mapSizeInChunks: number, mapHeightInChunks: number) {
        this.chunkSize = chunkSize;
        this.chunkHeight = chunkHeight;
        this.mapSizeInChunks = mapSizeInChunks;
        this.mapHeightInChunks = mapHeightInChunks;
        this.mapSize = chunkSize * mapSizeInChunks;
        this.mapHeight = chunkHeight * mapHeightInChunks;
        this.chunks = new Map();
    }

    getChunk = (x: number, y: number, z: number) => {
        let hash = hashVector(x, y, z);
        return this.chunks.get(hash)!;
    }

    setChunk = (x: number, y: number, z: number, chunk: Chunk) => {
        let hash = hashVector(x, y, z);
        this.chunks.set(hash, chunk);
    }

    updateChunk = (x: number, y: number, z: number) => {
        let chunk = this.getChunk(x, y, z);
        if (chunk == null) return;
        chunk.needsUpdate = true;
    }

    setBlock = (x: number, y: number, z: number, type: Blocks) => {
        let chunkX = Math.floor(x / this.chunkSize);
        let chunkY = Math.floor(y / this.chunkHeight);
        let chunkZ = Math.floor(z / this.chunkSize);
        let localX = x % this.chunkSize;
        let localY = y % this.chunkHeight;
        let localZ = z % this.chunkSize;
        let chunk = this.getChunk(chunkX, chunkY, chunkZ);
        if (chunk == null) return;
        if (!chunk.setBlock(localX, localY, localZ, type)) return;

        let maxXZ = this.chunkSize - 1;
        let maxY = this.chunkHeight - 1;

        if (localX == 0)     this.updateChunk(chunkX - 1, chunkY, chunkZ);
        if (localX == maxXZ) this.updateChunk(chunkX + 1, chunkY, chunkZ);
        if (localY == 0)     this.updateChunk(chunkX, chunkY - 1, chunkZ);
        if (localY == maxY)  this.updateChunk(chunkX, chunkY + 1, chunkZ);
        if (localZ == 0)     this.updateChunk(chunkX, chunkY, chunkZ - 1);
        if (localZ == maxXZ) this.updateChunk(chunkX, chunkY, chunkZ + 1);
    }

    getBlock = (x: number, y: number, z: number) => {
        let chunkX = Math.floor(x / this.chunkSize);
        let chunkY = Math.floor(y / this.chunkHeight);
        let chunkZ = Math.floor(z / this.chunkSize);
        let localX = x % this.chunkSize;
        let localY = y % this.chunkHeight;
        let localZ = z % this.chunkSize;
        let chunk = this.getChunk(chunkX, chunkY, chunkZ);
        if (chunk == null) return Blocks.Grass;
        return chunk.getBlock(localX, localY, localZ);
    }

    // Check if a block is occupied (ie: not air). Optionally, consider transparent blocks to be occupied.
    isBlockOccupied = (x: number, y: number, z: number, includeTransparent: boolean) => {
        let id = this.getBlock(x, y, z);
        return id != Blocks.Air && (includeTransparent || !blockAttributes.get(id)!.transparent);
    }

    generate = (scene: Three.Scene, texture: Three.Texture) => {
        for (let x = 0; x < this.mapSizeInChunks; x++)
        for (let y = 0; y < this.mapHeightInChunks; y++)
        for (let z = 0; z < this.mapSizeInChunks; z++) {
            let newChunk = new Chunk(this.chunkSize, this.chunkHeight, x, y, z, scene, texture);
            this.setChunk(x, y, z, newChunk);
        }
    }

    update = () => {
        for (let [_hash, chunk] of this.chunks) {
            chunk.update(this);
        }
    }

    destroy = (scene: Three.Scene) => {
        for (let [_hash, chunk] of this.chunks) {
            chunk.destroy(scene);
        }
    }
}