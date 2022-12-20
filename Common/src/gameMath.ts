export const hashVector = (x: number, y: number, z: number) => {
    return x * 73856093 ^ y * 19349663 ^ z * 83492791;
}

export const indexTo3D = (i: number, size: number) => {
    return {
        x: i % size,
        y: Math.floor(i / size) % size,
        z: Math.floor(i / (size * size)),
    }
}

export const distance = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
    const distX = x0 - x1;
    const distY = y0 - y1;
    const distZ = z0 - z1;

    return Math.sqrt(distX * distX + distY * distY + distZ * distZ);
}

export const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(value, max));
}