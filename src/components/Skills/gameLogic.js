import { skillsData, antiSkillsData } from './gameData';

export const GAME_CONFIG = {
    SKILL_SPAWN_INTERVAL: 2000,
    MAX_SKILLS_ON_SCREEN: 8,
    PLAYER_SPEED: 10,
    WINNING_SCORE: 50,
    SKILL_RADIUS: 18,
    SKILL_SPEED: 3,
    PLAYER_WIDTH: 30,
    PLAYER_HEIGHT: 30,
    INITIAL_SKILLS: 4
};

export class GameState {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        this.offscreenCanvas.width = canvas.width;
        this.offscreenCanvas.height = canvas.height;
        
        this.player = {
            x: canvas.width / 2 - GAME_CONFIG.PLAYER_WIDTH / 2,
            y: canvas.height / 2 - GAME_CONFIG.PLAYER_HEIGHT / 2,
            width: GAME_CONFIG.PLAYER_WIDTH,
            height: GAME_CONFIG.PLAYER_HEIGHT,
            speed: GAME_CONFIG.PLAYER_SPEED,
            direction: { x: 0, y: 0 }
        };
        
        this.items = [];
        this.score = 0;
        this.lastSpawnTime = Date.now();
        this.activeKeys = new Set();
        
        // Initialize with some skills
        this.initializeItems();
    }

    initializeItems() {
        for (let i = 0; i < GAME_CONFIG.INITIAL_SKILLS; i++) {
            this.items.push(this.generateNewSkill(true));
            if (Math.random() < 0.3) {
                this.items.push(this.generateNewSkill(false));
            }
        }
    }

    generateNewSkill(isSkill = true) {
        const dataSource = isSkill ? skillsData : antiSkillsData;
        const itemData = dataSource[Math.floor(Math.random() * dataSource.length)];
        
        let x, y;
        const margin = GAME_CONFIG.SKILL_RADIUS * 2;
        const safeDistance = GAME_CONFIG.PLAYER_WIDTH * 2;
        
        do {
            x = margin + Math.random() * (this.canvas.width - 2 * margin);
            y = margin + Math.random() * (this.canvas.height - 2 * margin);
        } while (this.isNearPlayer(x, y, safeDistance));

        return {
            x,
            y,
            name: itemData.name,
            points: itemData.points,
            isSkill,
            radius: GAME_CONFIG.SKILL_RADIUS,
            velocity: {
                x: (Math.random() - 0.5) * GAME_CONFIG.SKILL_SPEED,
                y: (Math.random() - 0.5) * GAME_CONFIG.SKILL_SPEED
            }
        };
    }

    isNearPlayer(x, y, distance) {
        const dx = x - (this.player.x + this.player.width / 2);
        const dy = y - (this.player.y + this.player.height / 2);
        return Math.sqrt(dx * dx + dy * dy) < distance;
    }

    updatePlayerPosition(deltaTime) {
        if (this.player.direction.x !== 0 || this.player.direction.y !== 0) {
            const normalizedSpeed = this.player.speed * deltaTime;
            
            this.player.x += this.player.direction.x * normalizedSpeed;
            this.player.y += this.player.direction.y * normalizedSpeed;

            // Boundary checking
            this.player.x = Math.max(0, Math.min(this.player.x, 
                this.canvas.width - this.player.width));
            this.player.y = Math.max(0, Math.min(this.player.y, 
                this.canvas.height - this.player.height));
        }
    }

    updateItems(deltaTime) {
        this.items.forEach(item => {
            item.x += item.velocity.x;
            item.y += item.velocity.y;

            // Bounce off canvas boundaries
            if (item.x <= item.radius || item.x >= this.canvas.width - item.radius) {
                item.velocity.x *= -1;
                item.x = Math.max(item.radius, Math.min(item.x, this.canvas.width - item.radius));
            }
            if (item.y <= item.radius || item.y >= this.canvas.height - item.radius) {
                item.velocity.y *= -1;
                item.y = Math.max(item.radius, Math.min(item.y, this.canvas.height - item.radius));
            }
        });
    }

    checkCollisions() {
        const itemsToRemove = new Set();
        
        this.items.forEach((item, index) => {
            const dx = this.player.x + this.player.width / 2 - item.x;
            const dy = this.player.y + this.player.height / 2 - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < item.radius + Math.max(this.player.width, this.player.height) / 2) {
                this.score += item.points;
                itemsToRemove.add(index);
            }
        });

        this.items = this.items.filter((_, index) => !itemsToRemove.has(index));
    }

    spawnNewSkills() {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime > GAME_CONFIG.SKILL_SPAWN_INTERVAL) {
            const skillCount = this.items.filter(item => item.isSkill).length;
            
            if (skillCount < GAME_CONFIG.MAX_SKILLS_ON_SCREEN) {
                this.items.push(this.generateNewSkill(true));
                if (Math.random() < 0.3) {
                    this.items.push(this.generateNewSkill(false));
                }
            }
            
            this.lastSpawnTime = currentTime;
        }
    }

    update(deltaTime) {
        this.updatePlayerPosition(deltaTime);
        this.updateItems(deltaTime);
        this.checkCollisions();
        this.spawnNewSkills();

        return {
            gameOver: this.score < 0,
            won: this.score >= GAME_CONFIG.WINNING_SCORE
        };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.offscreenCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw items
        this.items.forEach(item => {
            this.offscreenCtx.fillStyle = item.isSkill ? '#FFFF00' : '#FF0000';
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            this.offscreenCtx.fill();

            this.offscreenCtx.fillStyle = '#000000';
            this.offscreenCtx.font = `${this.canvas.width / 50}px Arial`;
            this.offscreenCtx.textAlign = 'center';
            this.offscreenCtx.fillText(item.name, item.x, item.y + 5);
        });

        // Copy offscreen canvas
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);

        // Draw player
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(
            this.player.x, 
            this.player.y, 
            this.player.width, 
            this.player.height
        );

        // Draw score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${this.canvas.width / 20}px VT323`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score} / ${GAME_CONFIG.WINNING_SCORE}`, 10, 30);
    }

    handleKeyDown(key) {
        this.activeKeys.add(key);
        this.updatePlayerDirection();
    }

    handleKeyUp(key) {
        this.activeKeys.delete(key);
        this.updatePlayerDirection();
    }

    updatePlayerDirection() {
        const direction = { x: 0, y: 0 };
        
        if (this.activeKeys.has('ArrowLeft')) direction.x -= 10;
        if (this.activeKeys.has('ArrowRight')) direction.x += 10;
        if (this.activeKeys.has('ArrowUp')) direction.y -= 10;
        if (this.activeKeys.has('ArrowDown')) direction.y += 10;

        // Normalize diagonal movement
        if (direction.x !== 0 && direction.y !== 0) {
            const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= magnitude;
            direction.y /= magnitude;
        }

        this.player.direction = direction;
    }
    handleCanvasResize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Update player position to maintain relative position
        const widthRatio = canvas.width / this.canvas.width;
        const heightRatio = canvas.height / this.canvas.height;
        
        this.player.x *= widthRatio;
        this.player.y *= heightRatio;
        this.player.speed = canvas.width / 100; // Recalculate speed based on new dimensions
        
        // Update items positions
        this.items.forEach(item => {
            item.x *= widthRatio;
            item.y *= heightRatio;
            item.radius = canvas.width / 30; // Recalculate radius based on new dimensions
        });
    }

    handleTouchStart(event) {
        const touch = event.touches[0];
        this.updateDirectionFromTouch(touch);
    }
    
    handleTouchMove(event) {
        const touch = event.touches[0];
        this.updateDirectionFromTouch(touch);
    }
    
    handleTouchEnd(event) {
        this.player.direction = { x: 0, y: 0 }; // Stop movement
    }
    
    updateDirectionFromTouch(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left - this.player.width / 2;
        const touchY = touch.clientY - rect.top - this.player.height / 2;
    
        const deadZone = 50; // Adjust as needed
    
        let xDirection = 0;
        let yDirection = 0;
    
        if (touchX < this.player.x - deadZone) xDirection = -1;
        else if (touchX > this.player.x + deadZone) xDirection = 1;
    
        if (touchY < this.player.y - deadZone) yDirection = -1;
        else if (touchY > this.player.y + deadZone) yDirection = 1;
    
        this.player.direction = { x: xDirection, y: yDirection };
    }
}