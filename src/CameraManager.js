import * as THREE from 'three';

export class CameraManager {
    constructor(camera, cube) {
        this.camera = camera;
        this.cube = cube;
        this.targetFace = 0;
        this.distance = this.cube.cubeDimension * 2.5;
        this.smoothness = 0.05;
        
        this.currentPos = new THREE.Vector3(0, 0, this.distance);
        this.targetPos = new THREE.Vector3(0, 0, this.distance);
        this.shakeVector = new THREE.Vector3();
        this.shakeIntensity = 0;
        
        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(0, 0, 0);
    }

    shake(intensity = 0.5) {
        this.shakeIntensity = intensity;
    }

    updateFace(face) {
        this.targetFace = face;
        const normal = this.cube.getFaceNormal(face);
        
        // Add a slight tilted offset to make the view more 3D
        // Instead of looking directly at the face, we shift the camera slightly
        const offset = new THREE.Vector3(0.3, 0.3, 0.3);
        if (normal.x !== 0) offset.x = 0;
        if (normal.y !== 0) offset.y = 0;
        if (normal.z !== 0) offset.z = 0;

        this.targetPos.copy(normal).add(offset).normalize().multiplyScalar(this.distance);
        
        // Adjust "up" vector for camera to keep it oriented correctly
        // Top and Bottom faces need special care
        if (face === 2) { // TOP
            this.camera.up.set(0, 0, -1);
        } else if (face === 3) { // BOTTOM
            this.camera.up.set(0, 0, 1);
        } else {
            this.camera.up.set(0, 1, 0);
        }
    }

    update() {
        this.currentPos.lerp(this.targetPos, this.smoothness);
        
        if (this.shakeIntensity > 0.01) {
            this.shakeVector.set(
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity
            );
            this.shakeIntensity *= 0.9;
        } else {
            this.shakeVector.set(0, 0, 0);
        }

        this.camera.position.copy(this.currentPos).add(this.shakeVector);
        this.camera.lookAt(0, 0, 0);
    }

    reset() {
        this.updateFace(0);
    }
}
