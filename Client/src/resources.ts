import * as Three from "three";

const texComponents = 4; // RGBA

const canvas = new OffscreenCanvas(0, 0);
const ctx2D = canvas.getContext("2d")! as OffscreenCanvasRenderingContext2D;

export const loadTexArray = (image: HTMLImageElement, depth: number, size: number) => {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx2D.clearRect(0, 0, canvas.width, canvas.height);
    ctx2D.drawImage(image, 0, 0);
    const tex = ctx2D.getImageData(0, 0, image.width, image.height);

    const texData = new Uint8Array(texComponents * image.width * image.height);
    const texPerRow = image.width / size;

    // The loaded texture is layed out in rows of the full texture.
    // Convert it to be stored in rows of each individual textured.
    let i = 0;
    for (let z = 0; z < depth; z++) {
        const zHorizontal = (z % texPerRow) * size;
        const zVertical = Math.floor(z / texPerRow) * size;

        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++) {
                const pixelI = ((x + zHorizontal) + (y + zVertical) * image.width) * texComponents;
                texData[i] = tex.data[pixelI];
                texData[i + 1] = tex.data[pixelI + 1];
                texData[i + 2] = tex.data[pixelI + 2];
                texData[i + 3] = tex.data[pixelI + 3];

                i += texComponents;
            }
    }

    const texture = new Three.DataArrayTexture(texData, size, size, depth);
    texture.needsUpdate = true;

    return texture;
}