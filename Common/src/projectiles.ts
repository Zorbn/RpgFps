export enum ProjectileTypes {
    Arrow,
    Dagger,
    Laser
}

export const projectileAttributes = new Map([
    [ProjectileTypes.Arrow, {
        spriteIndex: 2,
        speed: 8.0,
        range: 12.0,
    }],
    [ProjectileTypes.Dagger, {
        spriteIndex: 3,
        speed: 4.0,
        range: 3.0,
    }],
    [ProjectileTypes.Laser, {
        spriteIndex: 4,
        speed: 6.0,
        range: 4.0,
    }],
]);