import { Chunk } from "./chunk";
import { hashVector } from "../../Common/src/gameMath";
import { blockAttributes, Blocks } from "../../Common/src/blocks";
import { User } from "./user";

export class World {
    public mapSizeInChunks: number;
    public mapHeightInChunks: number;
    public mapSize: number;
    public mapHeight: number;
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
        if (chunk == null) return Blocks.Air;
        return chunk.getBlock(localX, localY, localZ);
    }

    // Check if a block is occupied (ie: not air). Optionally, consider transparent blocks to be occupied.
    isBlockOccupied = (x: number, y: number, z: number, includeTransparent: boolean) => {
        let id = this.getBlock(x, y, z);
        return id != Blocks.Air && (includeTransparent || !blockAttributes.get(id)!.transparent);
    }

    isBlockSupported = (x: number, y: number, z: number) => {
        return this.getBlock(x + 1, y, z) != Blocks.Air ||
            this.getBlock(x - 1, y, z) != Blocks.Air ||
            this.getBlock(x, y + 1, z) != Blocks.Air ||
            this.getBlock(x, y - 1, z) != Blocks.Air ||
            this.getBlock(x, y, z + 1) != Blocks.Air ||
            this.getBlock(x, y, z - 1) != Blocks.Air;
    }

    getSpawnPos = (spawnChunkX: number, spawnChunkY: number, spawnChunkZ: number, force: boolean) => {
        const spawnChunkWorldX = spawnChunkX * this.chunkSize;
        const spawnChunkWorldY = spawnChunkY * this.chunkHeight;
        const spawnChunkWorldZ = spawnChunkZ * this.chunkSize;

        const spawnChunk = this.getChunk(spawnChunkX, spawnChunkY, spawnChunkZ);

        for (let z = 0; z < this.chunkSize; z++)
        for (let y = 0; y < this.chunkHeight; y++)
        for (let x = 0; x < this.chunkSize; x++) {
            if (spawnChunk.getBlock(x, y, z) != Blocks.Air) continue;

            return {
                succeeded: true,
                x: spawnChunkWorldX + x + 0.5,
                y: spawnChunkWorldY + y + 0.5,
                z: spawnChunkWorldZ + z + 0.5,
            }
        }

        if (force) {
            let x = Math.floor(this.chunkSize * 0.5);
            let y = Math.floor(this.chunkHeight * 0.5);
            let z = Math.floor(this.chunkSize * 0.5);
            spawnChunk.setBlock(x, y, z, Blocks.Air);

            return {
                succeeded: true,
                x: spawnChunkWorldX + x + 0.5,
                y: spawnChunkWorldY + y + 0.5,
                z: spawnChunkWorldZ + z + 0.5,
            }
        }

        return {
            succeeded: false,
            x: 0,
            y: 0,
            z: 0,
        }
    }

    update = (world: World, users: Map<number, User>, force: boolean) => {
        for (let [_hash, chunk] of this.chunks) {
            chunk.update(world, users, force);
        }
    }

    generate = () => {
        for (let x = 0; x < this.mapSizeInChunks; x++)
        for (let y = 0; y < this.mapHeightInChunks; y++)
        for (let z = 0; z < this.mapSizeInChunks; z++) {
            let newChunk = new Chunk(this.chunkSize, this.chunkHeight, x, y, z);
            newChunk.generate(this.mapSize);
            this.setChunk(x, y, z, newChunk);
        }
    }
}