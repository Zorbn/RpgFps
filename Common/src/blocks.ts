export enum Blocks {
    Air,
    Grass,
    Tree,
}

export const blockAttributes = new Map([
    [Blocks.Air, {
        transparent: false,
    }],
    [Blocks.Grass, {
        transparent: false,
    }],
    [Blocks.Tree, {
        transparent: true,
    }],
]);