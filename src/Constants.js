export const TILE_SIZE = 1.0;

export const DIRECTIONS = {
    RIGHT: 0,
    UP: 1,
    LEFT: 2,
    DOWN: 3
};

export const COLORS = {
    FRONT: 0xffffff, // White
    BACK: 0xffff00,  // Yellow
    TOP: 0xffa500,   // Orange
    BOTTOM: 0xff0000, // Red
    RIGHT: 0x0000ff, // Blue
    LEFT: 0x00ff00,  // Green
    SNAKE_HEAD: 0x00ffcc,
    SNAKE_BODY: 0x00aa88,
    FOOD: 0xff00ff
};

export const INITIAL_SPEED = 250; // ms per move
export const MIN_SPEED = 80;
export const SPEED_INCREMENT = 2;
