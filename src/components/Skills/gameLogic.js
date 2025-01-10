import { skillsData, antiSkillsData } from './gameData';

export const GAME_CONFIG = {
    // Core game settings
    SKILL_SPAWN_INTERVAL: 2000,
    MAX_SKILLS_ON_SCREEN: 8,
    WINNING_SCORE: 50,
    INITIAL_SKILLS: 4,

    // Player settings
    PLAYER_SPEED: {
        DESKTOP: 50,
        MOBILE: 60    // Slightly faster on mobile for better responsiveness
    },
    PLAYER_SIZE: {
        LANDSCAPE: { WIDTH: 30, HEIGHT: 30 },
        PORTRAIT: { WIDTH: 40, HEIGHT: 40 }  // Larger in portrait for better touch targets
    },

    // Skill settings
    SKILL_RADIUS: {
        LANDSCAPE: 18,
        PORTRAIT: 24  // Larger in portrait mode
    },
    SKILL_SPEED: 3,

    // Touch controls
    TOUCH: {
        SENSITIVITY: 1.2,
        DEAD_ZONE: 0,
        SMOOTHING: 0.9,
        OFFSET: {
            PORTRAIT: { X: -40, Y: -40 },
            LANDSCAPE: { X: -30, Y: -30 }
        }
    },

    // Keyboard controls
    KEYBOARD: {
        SPEED_MULTIPLIER: 1.0,
        DIAGONAL_COMPENSATION: 0.707  // 1/√2 for diagonal movement
    }
};

function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export class GameState {
    constructor(canvas) {
        if (!canvas) {
            console.error('Canvas is required for GameState initialization');
            throw new Error('Canvas is required');
        }

        try {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            // Add device detection
            this.isMobile = detectMobile();
            console.log('Device type:', this.isMobile ? 'Mobile' : 'Desktop');

            // Add orientation detection
            this.isPortrait = window.innerHeight > window.innerWidth;
            console.log('Orientation:', this.isPortrait ? 'Portrait' : 'Landscape');

            // Initialize controls based on device type (moved outside try block)
            this.controls = this.isMobile ? {
                left: 'touchstart',
                right: 'touchend',
                up: 'touchstart',
                down: 'touchend'
            } : {
                left: 'keydown',
                right: 'keydown',
                up: 'keydown',
                down: 'keydown'
            };

            if (!this.ctx) {
                throw new Error('Failed to get 2D context');
            }

            // Create and setup offscreen canvas
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = canvas.width;
            this.offscreenCanvas.height = canvas.height;
            this.offscreenCtx = this.offscreenCanvas.getContext('2d');

            if (!this.offscreenCtx) {
                throw new Error('Failed to get offscreen 2D context');
            }

            // Initialize basic state
            this.items = [];
            this.score = 0;
            this.lastSpawnTime = Date.now();
            this.activeKeys = new Set();
            this.touchPositions = [];
            this.lastTouchPosition = null;

            // Initialize player 
            this.initializePlayer();

            // Initialize touch state
            this.initializeTouchState();

            // Initialize items
            this.initializeItems();

        } catch (error) {
            console.error('Error during GameState construction:', error);
            throw error; 
        }
    }

    // Initialize player with safe defaults
    initializePlayer() {
        const canvasWidth = this.canvas?.width || 800; 
        const canvasHeight = this.canvas?.height || 600;
        const playerSize = this.isPortrait ?
            GAME_CONFIG.PLAYER_SIZE.PORTRAIT :
            GAME_CONFIG.PLAYER_SIZE.LANDSCAPE;

        this.player = {
            x: canvasWidth / 2 - playerSize.WIDTH / 2,
            y: canvasHeight / 2 - playerSize.HEIGHT / 2,
            width: playerSize.WIDTH,
            height: playerSize.HEIGHT,
            speed: this.isMobile ?
                GAME_CONFIG.PLAYER_SPEED.MOBILE :
                GAME_CONFIG.PLAYER_SPEED.DESKTOP,
            direction: { x: 0, y: 0 },
            isMoving: false
        };
    }

    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        if (!touch) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const offset = this.isPortrait ? 
            GAME_CONFIG.TOUCH.OFFSET.PORTRAIT : 
            GAME_CONFIG.TOUCH.OFFSET.LANDSCAPE;

        this.touchState = {
            active: true,
            position: {
                x: (touch.clientX - rect.left) * scaleX + offset.X,
                y: (touch.clientY - rect.top) * scaleY + offset.Y
            },
            lastPosition: null,
            lastFrameTime: performance.now()
        };

        this.updatePlayerToTouchPosition();
    }

    initializeTouchState() {
        this.touchState = {
            active: false,
            lastPosition: null,
            currentPosition: null,
            velocity: { x: 0, y: 0 },
            smoothing: GAME_CONFIG.TOUCH_SMOOTHING || 0.9,
            lastFrameTime: performance.now()
        };
    }

    initializeItems() {
        const initialCount = GAME_CONFIG.INITIAL_SKILLS || 4;
        
        for (let i = 0; i < initialCount; i++) {
            try {
                const newSkill = this.generateNewSkill(true);
                if (newSkill) {
                    this.items.push(newSkill);
                }
                
                if (Math.random() < 0.3) {
                    const antiSkill = this.generateNewSkill(false);
                    if (antiSkill) {
                        this.items.push(antiSkill);
                    }
                }
            } catch (error) {
                console.error('Error generating initial item:', error);
                // Continue with loop even if one item fails
            }
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (!this.touchState.active) return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const offset = this.isPortrait ? 
            GAME_CONFIG.TOUCH.OFFSET.PORTRAIT : 
            GAME_CONFIG.TOUCH.OFFSET.LANDSCAPE;

        this.touchState.position = {
            x: (touch.clientX - rect.left) * scaleX + offset.X,
            y: (touch.clientY - rect.top) * scaleY + offset.Y
        };

        this.updatePlayerToTouchPosition();
    }

    updatePlayerToTouchPosition() {
        if (!this.touchState.active || !this.touchState.position) return;

        const targetX = this.touchState.position.x - (this.player.width / 2);
        const targetY = this.touchState.position.y - (this.player.height / 2);

        // Use different smoothing based on device type
        const smoothing = this.isMobile ? 
            GAME_CONFIG.TOUCH.SMOOTHING : 
            GAME_CONFIG.TOUCH.SMOOTHING * 0.8;

        this.player.x = this.player.x * (1 - smoothing) + targetX * smoothing;
        this.player.y = this.player.y * (1 - smoothing) + targetY * smoothing;

        // Boundary checks
        this.player.x = Math.max(0, Math.min(this.player.x, 
            this.canvas.width - this.player.width));
        this.player.y = Math.max(0, Math.min(this.player.y, 
            this.canvas.height - this.player.height));

        this.player.isMoving = true;
    }

    handleKeyDown(key) {
        if (this.isMobile) return; // Ignore keyboard on mobile devices
        this.activeKeys.add(key);
        this.updatePlayerDirection();
    }

    handleKeyUp(key) {
        if (this.isMobile) return;
        this.activeKeys.delete(key);
        this.updatePlayerDirection();
    }

    updatePlayerDirection() {
        const direction = { x: 0, y: 0 };
        
        if (this.activeKeys.has('ArrowLeft')) direction.x -= 1;
        if (this.activeKeys.has('ArrowRight')) direction.x += 1;
        if (this.activeKeys.has('ArrowUp')) direction.y -= 1;
        if (this.activeKeys.has('ArrowDown')) direction.y += 1;

        // Normalize diagonal movement
        if (direction.x !== 0 && direction.y !== 0) {
            direction.x *= GAME_CONFIG.KEYBOARD.DIAGONAL_COMPENSATION;
            direction.y *= GAME_CONFIG.KEYBOARD.DIAGONAL_COMPENSATION;
        }

        this.player.direction = direction;
        this.player.isMoving = direction.x !== 0 || direction.y !== 0;
    }

    handleCanvasResize(canvas) {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Update orientation state
        this.isPortrait = window.innerHeight > window.innerWidth;
        
        // Recalculate sizes based on new orientation
        const playerSize = this.isPortrait ? 
            GAME_CONFIG.PLAYER_SIZE.PORTRAIT : 
            GAME_CONFIG.PLAYER_SIZE.LANDSCAPE;
        
        // Scale positions
        const widthRatio = canvas.width / oldWidth;
        const heightRatio = canvas.height / oldHeight;
        
        this.player.x *= widthRatio;
        this.player.y *= heightRatio;
        this.player.width = playerSize.WIDTH;
        this.player.height = playerSize.HEIGHT;
        
        // Update items for new orientation
        this.items.forEach(item => {
            item.x *= widthRatio;
            item.y *= heightRatio;
            item.radius = this.isPortrait ? 
                GAME_CONFIG.SKILL_RADIUS.PORTRAIT : 
                GAME_CONFIG.SKILL_RADIUS.LANDSCAPE;
        });
    }

    generateNewSkill(isSkill = true) {
        try {
            const dataSource = isSkill ? skillsData : antiSkillsData;
            if (!dataSource || !Array.isArray(dataSource) || dataSource.length === 0) {
                throw new Error('Invalid data source for skill generation');
            }

            const itemData = dataSource[Math.floor(Math.random() * dataSource.length)];
            const skillRadius = this.isPortrait ? 
                GAME_CONFIG.SKILL_RADIUS.PORTRAIT : 
                GAME_CONFIG.SKILL_RADIUS.LANDSCAPE;
            const margin = skillRadius * 2;
            const safeDistance = this.player.width * 2;

            let x, y;
            let attempts = 0;
            const maxAttempts = 10;

            do {
                x = margin + Math.random() * (this.canvas.width - 2 * margin);
                y = margin + Math.random() * (this.canvas.height - 2 * margin);
                attempts++;
            } while (this.isNearPlayer(x, y, safeDistance) && attempts < maxAttempts);

            return {
                x,
                y,
                name: itemData.name,
                points: itemData.points,
                isSkill,
                radius: skillRadius,
                velocity: {
                    x: (Math.random() - 0.5) * GAME_CONFIG.SKILL_SPEED,
                    y: (Math.random() - 0.5) * GAME_CONFIG.SKILL_SPEED
                }
            };
        } catch (error) {
            console.error('Error in generateNewSkill:', error);
            return null;
        }
    }
    
    isNearPlayer(x, y, distance) {
        const dx = x - (this.player.x + this.player.width / 2);
        const dy = y - (this.player.y + this.player.height / 2);
        return Math.sqrt(dx * dx + dy * dy) < distance;
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
    
    update(deltaTime) {
        if (this.isMobile && this.touchState.active) {
            this.updatePlayerToTouchPosition();
        } else if (!this.isMobile) {
            this.updatePlayerPosition(deltaTime);
        }

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
    
        // Draw player with touch feedback
        this.ctx.fillStyle = this.player.isMoving ? '#00FF77' : '#00FF00';
        this.ctx.fillRect(
            this.player.x, 
            this.player.y, 
            this.player.width, 
            this.player.height
        );
    
        // Draw touch indicator when moving
        if (this.player.isMoving && this.touchState.active) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.moveTo(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2
            );
            this.ctx.lineTo(
                this.touchState.position.x,
                this.touchState.position.y
            );
            this.ctx.stroke();
        }
    
        // Draw score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${this.canvas.width / 20}px VT323`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score} / ${GAME_CONFIG.WINNING_SCORE}`, 10, 30);
    }
    
    cleanup() {
        // Cancel any pending animations or intervals
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Clear any event listeners if needed
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }

    handleTouchEnd(event) {
        if (!this.isMobile) return;
        
        event.preventDefault();
        this.touchState.active = false;
        this.player.isMoving = false;
        this.touchState.position = null;
    }
}