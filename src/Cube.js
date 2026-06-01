import * as THREE from 'three';
import { TILE_SIZE, COLORS, DIRECTIONS } from './Constants.js';

export class Cube {
    constructor(scene, gridSize = 4) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.cubeDimension = this.gridSize * TILE_SIZE;
        this.group = new THREE.Group();
        this.tiles = []; // 6 faces, each gridSize x gridSize
        
        this.init();
        this.scene.add(this.group);
    }

    init() {
        const faceConfigs = [
            { name: 'FRONT', color: COLORS.FRONT, normal: [0, 0, 1], uDir: [1, 0, 0], vDir: [0, 1, 0] },
            { name: 'BACK', color: COLORS.BACK, normal: [0, 0, -1], uDir: [-1, 0, 0], vDir: [0, 1, 0] },
            { name: 'TOP', color: COLORS.TOP, normal: [0, 1, 0], uDir: [1, 0, 0], vDir: [0, 0, -1] },
            { name: 'BOTTOM', color: COLORS.BOTTOM, normal: [0, -1, 0], uDir: [1, 0, 0], vDir: [0, 0, 1] },
            { name: 'RIGHT', color: COLORS.RIGHT, normal: [1, 0, 0], uDir: [0, 0, -1], vDir: [0, 1, 0] },
            { name: 'LEFT', color: COLORS.LEFT, normal: [-1, 0, 0], uDir: [0, 0, 1], vDir: [0, 1, 0] }
        ];

        faceConfigs.forEach((config, faceIndex) => {
            const faceTiles = [];
            for (let v = 0; v < this.gridSize; v++) {
                for (let u = 0; u < this.gridSize; u++) {
                    const tile = this.createTile(config, u, v);
                    this.group.add(tile);
                    faceTiles.push(tile);
                }
            }
            this.tiles.push(faceTiles);
        });

        // Add a core cube for depth
        const coreGeo = new THREE.BoxGeometry(this.cubeDimension - 0.1, this.cubeDimension - 0.1, this.cubeDimension - 0.1);
        const coreMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(core);
    }

    createTile(config, u, v) {
        const geometry = new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 100,
            specular: 0x555555,
            side: THREE.DoubleSide
        });
        const tile = new THREE.Mesh(geometry, material);

        // Position calculation
        // Center of the face is at normal * (cubeDimension / 2)
        // Tiles are offset from center by (u - offset) * uDir and (v - offset) * vDir
        const offset = (this.gridSize - 1) / 2;
        const pos = new THREE.Vector3()
            .set(...config.normal).multiplyScalar(this.cubeDimension / 2)
            .add(new THREE.Vector3(...config.uDir).multiplyScalar((u - offset) * TILE_SIZE))
            .add(new THREE.Vector3(...config.vDir).multiplyScalar((v - offset) * TILE_SIZE));

        tile.position.copy(pos);
        
        // Orient tile to face normal
        const lookAtPos = pos.clone().add(new THREE.Vector3(...config.normal));
        tile.lookAt(lookAtPos);

        return tile;
    }

    /**
     * Handles the complex logic of moving a snake across the edges of a 3D cube.
     * Each face has a local (u, v) coordinate system from 0 to gridSize-1.
     * When a coordinate exceeds these bounds, we calculate:
     * 1. The new face the snake is entering.
     * 2. The new (u, v) coordinates on that face.
     * 3. The new direction the snake will be facing relative to the new face's grid.
     * 
     * Face Indices: 0:FRONT (+Z), 1:BACK (-Z), 2:TOP (+Y), 3:BOTTOM (-Y), 4:RIGHT (+X), 5:LEFT (-X)
     * Directions: 0:RIGHT, 1:UP, 2:LEFT, 3:DOWN
     */
    getTransition(face, u, v, dir) {
        const last = this.gridSize - 1;

        // Transition logic for moving off the RIGHT edge of a face
        if (dir === DIRECTIONS.RIGHT && u > last) {
            switch(face) {
                case 0: return { face: 4, u: 0, v: v, dir: 0 }; // FRONT -> RIGHT: v stays same, entering from left (u=0)
                case 4: return { face: 1, u: 0, v: v, dir: 0 }; // RIGHT -> BACK: v stays same, entering from left
                case 1: return { face: 5, u: 0, v: v, dir: 0 }; // BACK -> LEFT: v stays same, entering from left
                case 5: return { face: 0, u: 0, v: v, dir: 0 }; // LEFT -> FRONT: v stays same, entering from left
                case 2: return { face: 4, u: last - v, v: last, dir: 3 }; // TOP -> RIGHT: u becomes reversed v, entering from top (v=last)
                case 3: return { face: 4, u: v, v: 0, dir: 1 }; // BOTTOM -> RIGHT: u becomes v, entering from bottom (v=0)
            }
        }
        // Transition logic for moving off the LEFT edge of a face
        if (dir === DIRECTIONS.LEFT && u < 0) {
            switch(face) {
                case 0: return { face: 5, u: last, v: v, dir: 2 }; // FRONT -> LEFT: v stays same, entering from right (u=last)
                case 5: return { face: 1, u: last, v: v, dir: 2 }; // LEFT -> BACK
                case 1: return { face: 4, u: last, v: v, dir: 2 }; // BACK -> RIGHT
                case 4: return { face: 0, u: last, v: v, dir: 2 }; // RIGHT -> FRONT
                case 2: return { face: 5, u: v, v: last, dir: 3 }; // TOP -> LEFT
                case 3: return { face: 5, u: last - v, v: 0, dir: 1 }; // BOTTOM -> LEFT
            }
        }
        // Transition logic for moving off the TOP edge of a face
        if (dir === DIRECTIONS.UP && v > last) {
            switch(face) {
                case 0: return { face: 2, u: u, v: 0, dir: 1 }; // FRONT -> TOP: u stays same, entering from bottom (v=0)
                case 2: return { face: 1, u: last - u, v: last, dir: 3 }; // TOP -> BACK: u reverses, entering from top (v=last), heading down
                case 1: return { face: 3, u: last - u, v: last, dir: 3 }; // BACK -> BOTTOM: u reverses, entering from bottom (v=last)
                case 3: return { face: 0, u: u, v: 0, dir: 1 }; // BOTTOM -> FRONT
                case 4: return { face: 2, u: last, v: last - u, dir: 2 }; // RIGHT -> TOP
                case 5: return { face: 2, u: 0, v: u, dir: 0 }; // LEFT -> TOP
            }
        }
        // Transition logic for moving off the BOTTOM edge of a face
        if (dir === DIRECTIONS.DOWN && v < 0) {
            switch(face) {
                case 0: return { face: 3, u: u, v: last, dir: 3 }; // FRONT -> BOTTOM
                case 3: return { face: 1, u: last - u, v: 0, dir: 1 }; // BOTTOM -> BACK
                case 1: return { face: 2, u: last - u, v: 0, dir: 1 }; // BACK -> TOP
                case 2: return { face: 0, u: u, v: last, dir: 3 }; // TOP -> FRONT
                case 4: return { face: 3, u: last, v: u, dir: 2 }; // RIGHT -> BOTTOM
                case 5: return { face: 3, u: 0, v: last - u, dir: 0 }; // LEFT -> BOTTOM
            }
        }

        return { face, u, v, dir };
    }

    getTilePosition(face, u, v) {
        const offset = (this.gridSize - 1) / 2;
        const faceConfigs = [
            { normal: [0, 0, 1], uDir: [1, 0, 0], vDir: [0, 1, 0] },
            { normal: [0, 0, -1], uDir: [-1, 0, 0], vDir: [0, 1, 0] },
            { normal: [0, 1, 0], uDir: [1, 0, 0], vDir: [0, 0, -1] },
            { normal: [0, -1, 0], uDir: [1, 0, 0], vDir: [0, 0, 1] },
            { normal: [1, 0, 0], uDir: [0, 0, -1], vDir: [0, 1, 0] },
            { normal: [-1, 0, 0], uDir: [0, 0, 1], vDir: [0, 1, 0] }
        ];
        const config = faceConfigs[face];
        return new THREE.Vector3()
            .set(...config.normal).multiplyScalar(this.cubeDimension / 2 + 0.1) // Slightly above surface
            .add(new THREE.Vector3(...config.uDir).multiplyScalar((u - offset) * TILE_SIZE))
            .add(new THREE.Vector3(...config.vDir).multiplyScalar((v - offset) * TILE_SIZE));
    }

    getFaceNormal(face) {
        const normals = [
            [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]
        ];
        return new THREE.Vector3(...normals[face]);
    }
}
