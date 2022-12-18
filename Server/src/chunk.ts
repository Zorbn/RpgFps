import { Blocks } from "../../Common/src/blocks";
import { World } from "./world";
import { MessageType, sendMsg } from "./net";
import { User } from "./user";

export class Chunk {
    public needsUpdate: boolean;
    private chunkX: number;
    private chunkY: number;
    private chunkZ: number;
    private size: number;
    private height: number;
    private data: Blocks[];

    constructor(size: number, height: number, x: number, y: number, z: number) {
        this.chunkX = x;
        this.chunkY = y;
        this.chunkZ = z;
        this.size = size;
        this.height = height;
        this.data = new Array(size * height * size);

        this.needsUpdate = true;
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

    update = (world: World, users: Map<number, User>, force: boolean) => {
        if (force || this.needsUpdate) {
            for (let [_id, user] of users) {
                sendMsg(user.socket, MessageType.UpdateChunk, {
                    x: this.chunkX,
                    y: this.chunkY,
                    z: this.chunkZ,
                    data: this.data,
                });
            }

            this.needsUpdate = false;
        }
    }

    generate = (_mapSize: number) => {
        for (let z = 0; z < this.size; z++) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.size; x++) {
                    if (Math.random() > 0.5) {
                        this.setBlock(x, y, z, Blocks.Tree);
                        continue;
                    }

                    this.setBlock(x, y, z, Blocks.Air);
                }
            }
        }
    }
}