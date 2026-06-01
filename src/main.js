import { Game } from './Game.js';

console.log("main.js loaded");

window.onerror = function(message, source, lineno, colno, error) {
    console.error("Global Error:", message, "at", source, ":", lineno);
};

try {
    const game = new Game();
    window.gameLoaded = true;
} catch (e) {
    console.error("Failed to create Game instance:", e);
}
