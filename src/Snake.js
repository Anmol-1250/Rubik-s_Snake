import * as THREE from 'three';
import { DIRECTIONS, COLORS, TILE_SIZE } from './Constants.js';

export class Snake {
    constructor(scene, cube) {
        this.scene = scene;
        this.cube = cube;
        this.segments = []; // Array of { face, u, v, mesh }
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.isAlive = true;
        
        this.init();
    }

    init() {
        // Start near the center of the FRONT face
        const startFace = 0;
        const startV = Math.floor(this.cube.gridSize / 2);
        const startU = Math.floor(this.cube.gridSize / 2);

        for (let i = 0; i < 3; i++) {
            const u = startU - i;
            const v = startV;
            const mesh = this.createSegmentMesh(i === 0);
            const pos = this.cube.getTilePosition(startFace, u, v);
            mesh.position.copy(pos);
            this.scene.add(mesh);
            this.segments.push({ face: startFace, u, v, mesh });
        }
    }

    createSegmentMesh(isHead) {
        const size = isHead ? TILE_SIZE * 0.8 : TILE_SIZE * 0.7;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhongMaterial({
            color: isHead ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY,
            emissive: isHead ? COLORS.SNAKE_HEAD : 0x000000,
            emissiveIntensity: 0.5
        });
        return new THREE.Mesh(geometry, material);
    }

    setDirection(newDir) {
        // Prevent 180 degree turns
        const isOpposite = (
            (this.direction === DIRECTIONS.RIGHT && newDir === DIRECTIONS.LEFT) ||
            (this.direction === DIRECTIONS.LEFT && newDir === DIRECTIONS.RIGHT) ||
            (this.direction === DIRECTIONS.UP && newDir === DIRECTIONS.DOWN) ||
            (this.direction === DIRECTIONS.DOWN && newDir === DIRECTIONS.UP)
        );

        if (!isOpposite) {
            this.nextDirection = newDir;
        }
    }

    move() {
        if (!this.isAlive) return false;

        this.direction = this.nextDirection;
        const head = this.segments[0];
        let nextU = head.u;
        let nextV = head.v;
        let nextDir = this.direction;

        if (this.direction === DIRECTIONS.RIGHT) nextU++;
        else if (this.direction === DIRECTIONS.LEFT) nextU--;
        else if (this.direction === DIRECTIONS.UP) nextV++;
        else if (this.direction === DIRECTIONS.DOWN) nextV--;

        // Handle transitions
        const transition = this.cube.getTransition(head.face, nextU, nextV, nextDir);
        const nextFace = transition.face;
        nextU = transition.u;
        nextV = transition.v;
        this.nextDirection = transition.dir; // Update for next turn if we crossed an edge

        // Check self-collision
        if (this.checkCollision(nextFace, nextU, nextV)) {
            this.isAlive = false;
            return false;
        }

        // New head
        const newHeadMesh = this.createSegmentMesh(true);
        const newHeadPos = this.cube.getTilePosition(nextFace, nextU, nextV);
        newHeadMesh.position.copy(newHeadPos);
        newHeadMesh.lookAt(newHeadPos.clone().add(this.cube.getFaceNormal(nextFace)));
        this.scene.add(newHeadMesh);

        // Update old head mesh to body mesh
        const oldHead = this.segments[0];
        oldHead.mesh.material.color.setHex(COLORS.SNAKE_BODY);
        oldHead.mesh.material.emissive.setHex(0x000000);
        oldHead.mesh.scale.set(0.875, 0.875, 0.875); // 0.7 / 0.8

        this.segments.unshift({ face: nextFace, u: nextU, v: nextV, mesh: newHeadMesh });

        return true; // Moved successfully
    }

    grow() {
        // We don't pop the tail when growing
    }

    popTail() {
        const tail = this.segments.pop();
        this.scene.remove(tail.mesh);
    }

    checkCollision(face, u, v) {
        return this.segments.some(seg => seg.face === face && seg.u === u && seg.v === v);
    }

    reset(scene) {
        this.segments.forEach(seg => this.scene.remove(seg.mesh));
        this.segments = [];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.isAlive = true;
        this.init();
    }
}
