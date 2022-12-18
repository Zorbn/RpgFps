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