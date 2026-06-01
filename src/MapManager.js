import { COLORS } from './Constants.js';

export class MapManager {
    constructor(canvas, gridSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        
        // Face layout in 4x3 grid
        // . 2 . .
        // 5 0 4 1
        // . 3 . .
        this.faceOffsets = [
            { x: 1, y: 1 }, // 0: FRONT
            { x: 3, y: 1 }, // 1: BACK
            { x: 1, y: 0 }, // 2: TOP
            { x: 1, y: 2 }, // 3: BOTTOM
            { x: 2, y: 1 }, // 4: RIGHT
            { x: 0, y: 1 }  // 5: LEFT
        ];

        this.resize();
    }

    setGridSize(size) {
        this.gridSize = size;
        this.resize();
    }

    resize() {
        // Adjust canvas size to fit the container while maintaining aspect ratio
        const parent = this.canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        
        // We want a 4x3 aspect ratio for the unfolded cube
        const size = Math.min(rect.width / 4, rect.height / 3);
        this.cellSize = size / this.gridSize;
        
        this.canvas.width = size * 4;
        this.canvas.height = size * 3;
    }

    draw(snake, food) {
        const ctx = this.ctx;
        const s = this.cellSize;
        const g = this.gridSize;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw faces
        this.faceOffsets.forEach((offset, faceIndex) => {
            const fx = offset.x * g * s;
            const fy = offset.y * g * s;

            // Face background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(fx, fy, g * s, g * s);
            
            // Face border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(fx, fy, g * s, g * s);

            // Optional: Face color indicator (small dot in corner)
            const colors = [
                COLORS.FRONT, COLORS.BACK, COLORS.TOP, COLORS.BOTTOM, COLORS.RIGHT, COLORS.LEFT
            ];
            ctx.fillStyle = `#${colors[faceIndex].toString(16).padStart(6, '0')}`;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(fx + 2, fy + 2, 4, 4);
            ctx.globalAlpha = 1.0;
        });

        // Draw food
        if (food && food.position) {
            const { face, u, v } = food.position;
            const offset = this.faceOffsets[face];
            const x = (offset.x * g + u) * s + s / 2;
            const y = (offset.y * g + (g - 1 - v)) * s + s / 2; // Invert V for canvas Y

            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff00ff';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Draw snake
        if (snake && snake.segments) {
            snake.segments.forEach((seg, index) => {
                const offset = this.faceOffsets[seg.face];
                const x = (offset.x * g + seg.u) * s;
                const y = (offset.y * g + (g - 1 - seg.v)) * s;

                ctx.fillStyle = index === 0 ? '#00ffcc' : '#00aa88';
                ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
            });
        }
    }
}
