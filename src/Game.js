import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Cube } from './Cube.js';
import { Snake } from './Snake.js';
import { Food } from './Food.js';
import { CameraManager } from './CameraManager.js';
import { DIRECTIONS, INITIAL_SPEED, MIN_SPEED, SPEED_INCREMENT, COLORS } from './Constants.js';

export class Game {
    constructor() {
        console.log("Initializing Rubik Snake Game...");
        try {
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                console.error("Critical: Canvas element 'game-canvas' not found.");
                return;
            }
            console.log("Canvas found:", this.canvas);

            this.foodIndicator = document.getElementById('food-face-indicator');
            
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: this.canvas, 
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.toneMapping = THREE.ReinhardToneMapping;
            console.log("Renderer initialized");

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x050508);
            this.scene.fog = new THREE.FogExp2(0x050508, 0.05);

            this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            this.selectedGridSize = 4;
            this.initSizeSelector();

            this.score = 0;
            this.highScore = 0;
            try {
                this.highScore = parseInt(localStorage.getItem('rubik-snake-highscore')) || 0;
            } catch (e) {
                console.warn("LocalStorage access failed. High score will not be saved.");
            }
            
            this.gameSpeed = INITIAL_SPEED;
            this.lastMoveTime = 0;
            this.isPaused = true;
            this.isGameOver = false;
            this.particles = [];

            this.initEvents();
            
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);
            console.log("Game initialized and ready.");
        } catch (error) {
            console.error("CRITICAL: Game initialization failed:", error);
            alert("Game failed to start. Please check the console (F12) for errors. Note: This game requires a local server to run.");
        }
    }

    initSizeSelector() {
        const sizeBtns = document.querySelectorAll('.size-btn');
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedGridSize = parseInt(btn.dataset.size);
            });
        });
    }

    initLights() {
        // Clear existing lights if any (for restart)
        this.scene.children.filter(c => c instanceof THREE.Light).forEach(l => this.scene.remove(l));

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(10, 20, 15);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        const rimLight = new THREE.PointLight(0x00ffcc, 1.5, 100);
        rimLight.position.set(-15, -15, -15);
        this.scene.add(rimLight);

        const accentLight = new THREE.PointLight(0xff00ff, 1.5, 100);
        accentLight.position.set(15, 15, -15);
        this.scene.add(accentLight);
    }

    initPostProcessing() {
        if (!EffectComposer || !RenderPass || !UnrealBloomPass || !OutputPass) {
            throw new Error("Post-processing modules not loaded correctly.");
        }
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6, // strength
            0.4, // radius
            0.85 // threshold
        );
        this.composer.addPass(bloomPass);

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    initBackground() {
        // Clear existing background objects if any
        this.scene.children.filter(c => c instanceof THREE.Points || c instanceof THREE.GridHelper).forEach(o => this.scene.remove(o));

        // Starfield
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const starVertices = [];
        for (let i = 0; i < 15000; i++) {
            const x = (Math.random() - 0.5) * 400;
            const y = (Math.random() - 0.5) * 400;
            const z = (Math.random() - 0.5) * 400;
            starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);

        // Grid
        const gridHelper = new THREE.GridHelper(100, 20, 0x00ffcc, 0x111111);
        gridHelper.position.y = -20;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.2;
        this.scene.add(gridHelper);
    }

    initEvents() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(width, height);
            if (this.composer) this.composer.setSize(width, height);
        });

        window.addEventListener('keydown', (e) => {
            if (this.isGameOver || !this.snake) return;

            switch(e.key) {
                case 'ArrowRight': case 'd': case 'D':
                    this.snake.setDirection(DIRECTIONS.RIGHT);
                    break;
                case 'ArrowLeft': case 'a': case 'A':
                    this.snake.setDirection(DIRECTIONS.LEFT);
                    break;
                case 'ArrowUp': case 'w': case 'W':
                    this.snake.setDirection(DIRECTIONS.UP);
                    break;
                case 'ArrowDown': case 's': case 'S':
                    this.snake.setDirection(DIRECTIONS.DOWN);
                    break;
                case ' ':
                    if (this.cameraManager) this.cameraManager.reset();
                    break;
            }
        });

        // Debug: track all clicks
        window.addEventListener('click', (e) => {
            console.log("Global click target:", e.target.id || e.target.className || e.target.tagName);
        });

        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            console.log("Attaching events to start-button");
            const startHandler = (e) => {
                console.log("Start event triggered:", e.type);
                this.start();
            };
            startBtn.addEventListener('click', startHandler);
            startBtn.addEventListener('mousedown', startHandler);
            startBtn.addEventListener('touchstart', startHandler);
        } else {
            console.error("Start button not found in DOM");
        }

        const restartBtn = document.getElementById('restart-button');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                console.log("Restart button clicked");
                this.restart();
            });
        }

        const menuBtn = document.getElementById('menu-button');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.goToMenu();
            });
        }
    }

    goToMenu() {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        
        // Clear scene
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }
        
        this.isPaused = true;
        this.isGameOver = false;
        this.score = 0;
        this.updateUI();
    }

    start() {
        document.getElementById('start-screen').classList.add('hidden');
        
        // Initialize game components with selected size
        this.cube = new Cube(this.scene, this.selectedGridSize);
        this.snake = new Snake(this.scene, this.cube);
        this.food = new Food(this.scene, this.cube, this.selectedGridSize);
        this.cameraManager = new CameraManager(this.camera, this.cube);

        try {
            if (!this.composer) this.initPostProcessing();
            this.initBackground();
        } catch (vfxError) {
            console.warn("Visual effects failed:", vfxError);
        }

        this.initLights();
        this.updateUI();

        this.isPaused = false;
        this.lastMoveTime = performance.now();
    }

    restart() {
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Clear scene
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }

        this.score = 0;
        this.gameSpeed = INITIAL_SPEED;
        this.isGameOver = false;
        
        this.start();
    }

    gameOver() {
        this.isGameOver = true;
        this.isPaused = true;
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score-value').innerText = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('rubik-snake-highscore', this.highScore);
            this.updateUI();
        }
    }

    updateUI() {
        document.getElementById('score-value').innerText = this.score.toString().padStart(3, '0');
        document.getElementById('high-score-value').innerText = this.highScore.toString().padStart(3, '0');

        if (this.food && this.foodIndicator) {
            const faceColors = [
                COLORS.FRONT, COLORS.BACK, COLORS.TOP, COLORS.BOTTOM, COLORS.RIGHT, COLORS.LEFT
            ];
            const color = faceColors[this.food.position.face];
            const hexColor = `#${color.toString(16).padStart(6, '0')}`;
            this.foodIndicator.style.backgroundColor = hexColor;
            this.foodIndicator.style.boxShadow = `0 0 20px ${hexColor}88`;
        }
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        if (!this.isPaused && !this.isGameOver) {
            if (time - this.lastMoveTime > this.gameSpeed) {
                const moved = this.snake.move();
                
                if (moved) {
                    const head = this.snake.segments[0];
                    this.cameraManager.updateFace(head.face);

                    if (this.food.checkCollision(head.face, head.u, head.v)) {
                        this.score += 10;
                        this.gameSpeed = Math.max(MIN_SPEED, this.gameSpeed - SPEED_INCREMENT);
                        this.food.spawn(this.snake.segments);
                        this.snake.grow();
                        this.updateUI();
                        this.spawnParticles(this.food.mesh.position);
                        this.cameraManager.shake(0.3);
                    } else {
                        this.snake.popTail();
                    }
                } else {
                    this.gameOver();
                    this.cameraManager.shake(1.0);
                }
                
                this.lastMoveTime = time;
            }
        }

        if (this.food) this.food.update(time / 1000);
        if (this.cameraManager) this.cameraManager.update();
        this.updateParticles();
        
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    spawnParticles(pos) {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.IcosahedronGeometry(0.1, 0);
            const mat = new THREE.MeshPhongMaterial({ color: 0xff00ff, emissive: 0xff00ff });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            p.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            p.life = 1.0;
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.position.add(p.velocity);
            p.life -= 0.02;
            p.scale.set(p.life, p.life, p.life);
            if (p.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    }
}
