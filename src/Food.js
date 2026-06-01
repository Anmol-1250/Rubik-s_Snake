import * as THREE from 'three';
import { COLORS, TILE_SIZE } from './Constants.js';

export class Food {
    constructor(scene, cube, gridSize = 4) {
        this.scene = scene;
        this.cube = cube;
        this.gridSize = gridSize;
        this.mesh = null;
        this.position = { face: 0, u: 0, v: 0 };
        
        this.init();
    }

    init() {
        const geometry = new THREE.SphereGeometry(TILE_SIZE * 0.3, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: COLORS.FOOD,
            emissive: COLORS.FOOD,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Add a point light to the food
        const light = new THREE.PointLight(COLORS.FOOD, 2, 3);
        this.mesh.add(light);
        
        this.scene.add(this.mesh);
        this.spawn([]);
    }

    spawn(snakeSegments) {
        let valid = false;
        let face, u, v;

        while (!valid) {
            face = Math.floor(Math.random() * 6);
            u = Math.floor(Math.random() * this.gridSize);
            v = Math.floor(Math.random() * this.gridSize);

            valid = !snakeSegments.some(seg => seg.face === face && seg.u === u && seg.v === v);
        }

        this.position = { face, u, v };
        const pos = this.cube.getTilePosition(face, u, v);
        this.mesh.position.copy(pos);
        
        // Pulse animation state
        this.mesh.scale.set(1, 1, 1);
    }

    update(time) {
        if (this.mesh) {
            const pulse = 1 + Math.sin(time * 5) * 0.2;
            this.mesh.scale.set(pulse, pulse, pulse);
        }
    }

    checkCollision(headFace, headU, headV) {
        return this.position.face === headFace && 
               this.position.u === headU && 
               this.position.v === headV;
    }
}
