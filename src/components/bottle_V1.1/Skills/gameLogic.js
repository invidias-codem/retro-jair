import { skillsData, antiSkillsData, mysteryItemsData, eventModifiers } from './gameData';

export const GAME_CONFIG = {
    // Core game settings
    BASE_SKILL_SPAWN_INTERVAL: 2000,
    MAX_ITEMS_ON_SCREEN: 10,
    INITIAL_ITEMS: 5,
    BASE_WINNING_SCORE: 50,
    WINNING_SCORE_DIFFICULTY_MULTIPLIER: 5,

    // Player settings
    PLAYER_SPEED: {
        DESKTOP: 250, // Units per second
        MOBILE: 300   // Units per second
    },
    PLAYER_SIZE: {
        LANDSCAPE: { WIDTH: 30, HEIGHT: 30 },
        PORTRAIT: { WIDTH: 40, HEIGHT: 40 }
    },

    // Item settings
    ITEM_RADIUS: {
        LANDSCAPE: 18,
        PORTRAIT: 24
    },
    BASE_ITEM_SPEED: 100, // Units per second
    ITEM_LIFETIME_DEFAULT: 20000,
    HOMING_STRENGTH: 2.0, 

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
        DIAGONAL_COMPENSATION: 0.707
    },

    // Events & Difficulty
    EVENT_TRIGGER_SCORE_MILESTONE: 25,
    DYNAMIC_DIFFICULTY_TIME_INTERVAL: 10000, // ms
    DYNAMIC_DIFFICULTY_SPEED_INCREMENT: 0.05, 
    DYNAMIC_DIFFICULTY_SPAWN_DECREMENT: 100, // ms
};

function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export class GameState {
    constructor(canvas, difficultyLevel = 1) {
        if (!canvas) {
            console.error('Canvas is required for GameState initialization');
            throw new Error('Canvas is required');
        }

        try {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.isMobile = detectMobile();
            this.isPortrait = window.innerHeight > window.innerWidth;

            this.difficultyLevel = difficultyLevel;
            this.currentWinningScore = GAME_CONFIG.BASE_WINNING_SCORE + (this.difficultyLevel - 1) * GAME_CONFIG.WINNING_SCORE_DIFFICULTY_MULTIPLIER;
            this.score = 0;

            this.items = [];
            this.lastSpawnTime = Date.now();
            this.activeKeys = new Set();
            this.touchState = {}; 

            this.activeEvent = null;
            this.eventTimer = 0;
            this.eventMessage = ""; 
            this.statusMessage = ""; 
            this.statusMessageTimer = 0;
            this.specificBonusSkillName = null;

            this.gameTimeElapsed = 0;
            this.lastDynamicDifficultyUpdateTime = 0;
            this.currentSkillSpawnInterval = GAME_CONFIG.BASE_SKILL_SPAWN_INTERVAL;
            this.currentItemSpeedMultiplier = 1.0; 

            this.nextMilestoneScore = GAME_CONFIG.EVENT_TRIGGER_SCORE_MILESTONE;

            if (!this.ctx) throw new Error('Failed to get 2D context');
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCanvas.width = canvas.width;
            this.offscreenCanvas.height = canvas.height;
            this.offscreenCtx = this.offscreenCanvas.getContext('2d');
            if (!this.offscreenCtx) throw new Error('Failed to get offscreen 2D context');

            this.initializePlayer();
            this.initializeTouchState(); 
            this.initializeItems();
            this.triggerRandomEvent();

        } catch (error) {
            console.error('Error during GameState construction:', error);
            throw error;
        }
    }

    initializePlayer() {
        const canvasWidth = this.canvas?.width || 800;
        const canvasHeight = this.canvas?.height || 600;
        const playerSize = this.isPortrait ? GAME_CONFIG.PLAYER_SIZE.PORTRAIT : GAME_CONFIG.PLAYER_SIZE.LANDSCAPE;
        this.player = {
            x: canvasWidth / 2 - playerSize.WIDTH / 2,
            y: canvasHeight / 2 - playerSize.HEIGHT / 2,
            width: playerSize.WIDTH,
            height: playerSize.HEIGHT,
            speed: this.isMobile ? GAME_CONFIG.PLAYER_SPEED.MOBILE : GAME_CONFIG.PLAYER_SPEED.DESKTOP,
            direction: { x: 0, y: 0 },
            isMoving: false,
            isShielded: false,
            shieldTimer: 0,
            nextItemModifier: null
        };
    }

    initializeTouchState() {
        this.touchState = {
            active: false,
            position: null, 
            lastPosition: null, 
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

        this.touchState.active = true;
        this.touchState.position = {
            x: (touch.clientX - rect.left) * scaleX + offset.X,
            y: (touch.clientY - rect.top) * scaleY + offset.Y
        };
        this.player.isMoving = true; 
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (!this.touchState.active) return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const offset = this.isPortrait ? GAME_CONFIG.TOUCH.OFFSET.PORTRAIT : GAME_CONFIG.TOUCH.OFFSET.LANDSCAPE;

        this.touchState.position = {
            x: (touch.clientX - rect.left) * scaleX + offset.X,
            y: (touch.clientY - rect.top) * scaleY + offset.Y
        };
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        this.touchState.active = false;
        this.player.isMoving = false;
    }


    updatePlayerToTouchPosition(deltaTime) { 
        if (!this.touchState.active || !this.touchState.position) {
            this.player.isMoving = false;
            return;
        }
        this.player.isMoving = true;

        const targetX = this.touchState.position.x - (this.player.width / 2);
        const targetY = this.touchState.position.y - (this.player.height / 2);

        const smoothingFactor = 1.0 - GAME_CONFIG.TOUCH.SMOOTHING; 

        this.player.x = this.player.x * GAME_CONFIG.TOUCH.SMOOTHING + targetX * smoothingFactor;
        this.player.y = this.player.y * GAME_CONFIG.TOUCH.SMOOTHING + targetY * smoothingFactor;

        this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));
        this.player.y = Math.max(0, Math.min(this.player.y, this.canvas.height - this.player.height));
    }


    handleKeyDown(key) {
        if (this.isMobile) return;
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

        if (direction.x !== 0 && direction.y !== 0) {
            direction.x *= GAME_CONFIG.KEYBOARD.DIAGONAL_COMPENSATION;
            direction.y *= GAME_CONFIG.KEYBOARD.DIAGONAL_COMPENSATION;
        }
        this.player.direction = direction;
        this.player.isMoving = direction.x !== 0 || direction.y !== 0;
    }
    
    updatePlayerPosition(deltaTime) { 
        if (this.player.direction.x === 0 && this.player.direction.y === 0) {
             if (!this.isMobile) this.player.isMoving = false; 
            return;
        }
         if (!this.isMobile) this.player.isMoving = true;

        const moveAmount = this.player.speed * deltaTime;
        this.player.x += this.player.direction.x * moveAmount;
        this.player.y += this.player.direction.y * moveAmount;

        this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));
        this.player.y = Math.max(0, Math.min(this.player.y, this.canvas.height - this.player.height));
    }


    handleCanvasResize(canvas) {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isPortrait = window.innerHeight > window.innerWidth;
        const playerSize = this.isPortrait ? GAME_CONFIG.PLAYER_SIZE.PORTRAIT : GAME_CONFIG.PLAYER_SIZE.LANDSCAPE;
        const widthRatio = canvas.width / oldWidth;
        const heightRatio = canvas.height / oldHeight;

        this.player.x *= widthRatio;
        this.player.y *= heightRatio;
        this.player.width = playerSize.WIDTH;
        this.player.height = playerSize.HEIGHT;

        this.items.forEach(item => {
            item.x *= widthRatio;
            item.y *= heightRatio;
            item.radius = this.isPortrait ? GAME_CONFIG.ITEM_RADIUS.PORTRAIT : GAME_CONFIG.ITEM_RADIUS.LANDSCAPE;
        });

        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = canvas.width;
            this.offscreenCanvas.height = canvas.height;
        }
    }

    triggerRandomEvent() {
        if (this.activeEvent && this.activeEvent.type !== 'NONE') {
            this.revertEventEffects();
        }

        const availableEvents = eventModifiers.filter(event => event.type !== (this.activeEvent ? this.activeEvent.type : null));
        this.activeEvent = availableEvents.length > 0 ?
            availableEvents[Math.floor(Math.random() * availableEvents.length)] :
            { type: 'NONE', name: 'Normal', duration: Infinity, description: 'Standard conditions.' };
        
        this.eventTimer = this.activeEvent.duration;
        this.specificBonusSkillName = null; 

        if (this.activeEvent.type === 'SPECIFIC_SKILL_BONUS' && skillsData.length > 0) {
            const randomSkill = skillsData[Math.floor(Math.random() * skillsData.length)];
            this.specificBonusSkillName = randomSkill.name;
            this.eventMessage = `Hunt: ${this.specificBonusSkillName}! (${Math.ceil(this.eventTimer / 1000)}s)`;
        } else {
             this.eventMessage = this.activeEvent.type !== 'NONE' ? `${this.activeEvent.name} (${Math.ceil(this.eventTimer / 1000)}s)` : "";
        }
        this.applyEventEffects();
        console.log("Event triggered:", this.activeEvent.name);
    }

    applyEventEffects() {
        if (!this.activeEvent) return;
        this.updateDynamicDifficulty(0, true); 

        switch (this.activeEvent.type) {
            case 'FRENZY_MODE':
                this.currentSkillSpawnInterval = Math.max(200, this.currentSkillSpawnInterval * 0.5);
                this.currentItemSpeedMultiplier *= 1.5;
                break;
            // HIGH_STAKES, SAFE_ZONE, SPECIFIC_SKILL_BONUS are handled elsewhere
            case 'NONE':
                 // No specific effect for 'NONE' event, bases are already set by updateDynamicDifficulty
                break;
            default:
                console.warn(`Unknown event type in applyEventEffects: ${this.activeEvent.type}`);
                break;
        }
    }

    revertEventEffects() {
        console.log("Event ended:", this.activeEvent ? this.activeEvent.name : "None");
        this.updateDynamicDifficulty(0, true); 
        this.activeEvent = null;
        this.eventMessage = ""; 
        this.specificBonusSkillName = null;
    }

    initializeItems() {
        for (let i = 0; i < GAME_CONFIG.INITIAL_ITEMS; i++) {
            this.spawnItem(Math.random() < 0.7); 
        }
    }

    generateNewItem(isSkillType = true, isMystery = false) {
        try {
            let dataSource, itemData;
            const itemRadius = this.isPortrait ? GAME_CONFIG.ITEM_RADIUS.PORTRAIT : GAME_CONFIG.ITEM_RADIUS.LANDSCAPE;
            const margin = itemRadius * 2.5; 
            const safeDistance = this.player.width * 3;
            let x, y, attempts = 0, maxAttempts = 20; 

            if (isMystery) {
                dataSource = mysteryItemsData;
                if (dataSource.length === 0) return null; 
                itemData = { ...dataSource[Math.floor(Math.random() * dataSource.length)] };
                itemData.isSkill = false; itemData.isMystery = true;
            } else if (isSkillType) {
                dataSource = skillsData;
                if (dataSource.length === 0) return null;
                itemData = { ...dataSource[Math.floor(Math.random() * dataSource.length)] };
                itemData.isSkill = true; itemData.isMystery = false;
            } else {
                dataSource = antiSkillsData;
                if (dataSource.length === 0) return null;
                itemData = { ...dataSource[Math.floor(Math.random() * dataSource.length)] };
                itemData.isSkill = false; itemData.isMystery = false;
            }
            if (!itemData) throw new Error('Failed to get item data.');

            do {
                x = margin + Math.random() * (this.canvas.width - 2 * margin);
                y = margin + Math.random() * (this.canvas.height - 2 * margin);
                attempts++;
            } while (this.isNearPlayer(x, y, safeDistance) && attempts < maxAttempts);

            if (attempts >= maxAttempts) {
                x = (Math.random() < 0.5) ? margin : this.canvas.width - margin; 
                y = margin + Math.random() * (this.canvas.height - 2 * margin);
            }
            
            const baseSpeed = GAME_CONFIG.BASE_ITEM_SPEED;
            let dirX = (Math.random() - 0.5);
            let dirY = (Math.random() - 0.5);
            const mag = Math.sqrt(dirX * dirX + dirY * dirY);
            if (mag > 0) {
                dirX = (dirX / mag); 
                dirY = (dirY / mag);
            } else {
                dirX = 1; dirY = 0; 
            }

            let behavior = 'bounce';
            let lifetime = null;
            const randBehavior = Math.random();
            if (!isMystery && randBehavior < 0.15) { 
                behavior = isSkillType ? 'homing_player_skill' : 'homing_player_anti_skill';
            } else if (!isMystery && randBehavior < 0.25) { 
                behavior = 'timed_explode';
                lifetime = GAME_CONFIG.ITEM_LIFETIME_DEFAULT * (0.75 + Math.random() * 0.5); 
            }

            return {
                x, y,
                name: itemData.name,
                originalPoints: itemData.points,
                isSkill: itemData.isSkill,
                isMystery: itemData.isMystery,
                effect: itemData.effect,
                radius: itemRadius,
                velocity: { x: dirX * baseSpeed, y: dirY * baseSpeed }, 
                behavior: behavior,
                lifeTimer: lifetime,
                creationTime: Date.now()
            };
        } catch (error) {
            console.error('Error in generateNewItem:', error);
            return null;
        }
    }

    isNearPlayer(x, y, distance) {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const dx = x - playerCenterX;
        const dy = y - playerCenterY;
        return Math.sqrt(dx * dx + dy * dy) < distance;
    }

    updateItems(deltaTime) {
        const itemsToRemove = [];
        this.items.forEach((item, index) => {
            let currentVelX = item.velocity.x;
            let currentVelY = item.velocity.y;

            if (item.behavior === 'homing_player_skill' || item.behavior === 'homing_player_anti_skill') {
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                let dxToPlayer = playerCenterX - item.x;
                let dyToPlayer = playerCenterY - item.y;
                const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

                const baseSpeedForItem = GAME_CONFIG.BASE_ITEM_SPEED; 

                if (distToPlayer > 0) {
                    dxToPlayer /= distToPlayer; 
                    dyToPlayer /= distToPlayer;

                    const targetVelX = dxToPlayer * baseSpeedForItem;
                    const targetVelY = dyToPlayer * baseSpeedForItem;
                    
                    const lerpAmount = Math.min(GAME_CONFIG.HOMING_STRENGTH * deltaTime, 1.0);

                    currentVelX = currentVelX * (1 - lerpAmount) + targetVelX * lerpAmount;
                    currentVelY = currentVelY * (1 - lerpAmount) + targetVelY * lerpAmount;
                    
                    const newMag = Math.sqrt(currentVelX * currentVelX + currentVelY * currentVelY);
                    if (newMag > 0) {
                        currentVelX = (currentVelX / newMag) * baseSpeedForItem;
                        currentVelY = (currentVelY / newMag) * baseSpeedForItem;
                    }
                    item.velocity.x = currentVelX;
                    item.velocity.y = currentVelY;
                }
            }
            
            const moveX = currentVelX * this.currentItemSpeedMultiplier * deltaTime;
            const moveY = currentVelY * this.currentItemSpeedMultiplier * deltaTime;
            item.x += moveX;
            item.y += moveY;

            if (item.lifeTimer !== null) {
                item.lifeTimer -= deltaTime * 1000;
                if (item.lifeTimer <= 0) {
                    if (item.behavior === 'timed_explode') {
                        console.log(`${item.name} exploded (removed).`);
                    }
                    itemsToRemove.push(index);
                    return;
                }
            }

            if (item.x <= item.radius || item.x >= this.canvas.width - item.radius) {
                item.velocity.x *= -1;
                item.x = Math.max(item.radius, Math.min(item.x, this.canvas.width - item.radius));
            }
            if (item.y <= item.radius || item.y >= this.canvas.height - item.radius) {
                item.velocity.y *= -1;
                item.y = Math.max(item.radius, Math.min(item.y, this.canvas.height - item.radius));
            }
        });
        for (let i = itemsToRemove.length - 1; i >= 0; i--) {
            this.items.splice(itemsToRemove[i], 1);
        }
    }

    checkCollisions() {
        const itemsToRemove = new Set();
        this.items.forEach((item, index) => {
            const dx = this.player.x + this.player.width / 2 - item.x;
            const dy = this.player.y + this.player.height / 2 - item.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < item.radius + Math.max(this.player.width, this.player.height) / 2) {
                if (item.isMystery) {
                    this.handleMysteryItemCollision(item);
                } else {
                    if (item.isSkill || (!item.isSkill && !this.player.isShielded)) {
                        let pointsEarned = item.originalPoints;
                        if (this.activeEvent?.type === 'HIGH_STAKES') pointsEarned *= 2;
                        if (this.activeEvent?.type === 'SPECIFIC_SKILL_BONUS' && item.name === this.specificBonusSkillName && item.isSkill) {
                            pointsEarned += 5; 
                            this.setStatusMessage(`${this.specificBonusSkillName} Bonus! +5`, 2000);
                        }
                        if (this.player.nextItemModifier === 'double') pointsEarned *= 2;
                        if (this.player.nextItemModifier === 'half') pointsEarned = Math.ceil(pointsEarned / 2);
                        this.player.nextItemModifier = null;
                        this.score += pointsEarned;
                    } else if (!item.isSkill && this.player.isShielded) {
                        this.setStatusMessage(`Blocked ${item.name}!`, 1500);
                    }
                }
                itemsToRemove.add(index);
            }
        });
        this.items = this.items.filter((_, index) => !itemsToRemove.has(index));
    }
    
    setStatusMessage(message, duration) {
        this.statusMessage = message;
        this.statusMessageTimer = duration;
    }

    handleMysteryItemCollision(item) {
        this.setStatusMessage(`Mystery: ${item.name}!`, 2500); 
        switch(item.effect) {
            case 'random_score_change':
                const scoreChange = Math.floor(Math.random() * 11) - 5;
                this.score += scoreChange;
                setTimeout(()=> this.setStatusMessage(`Score ${scoreChange > 0 ? '+' : ''}${scoreChange}pt!`, 2000), 100); 
                break;
            case 'temp_shield':
                this.player.isShielded = true;
                this.player.shieldTimer = 5000;
                break;
            case 'clear_some_antis':
                const antiSkillItems = this.items.filter(i => !i.isSkill && !i.isMystery);
                let clearedCount = 0;
                for(let i=0; i < Math.min(2, antiSkillItems.length); i++) {
                    const idxToRemove = this.items.indexOf(antiSkillItems[i]);
                    if (idxToRemove > -1) {
                        this.items.splice(idxToRemove, 1);
                        clearedCount++;
                    }
                }
                if(clearedCount > 0) setTimeout(()=> this.setStatusMessage(`${clearedCount} Anti-Skill${clearedCount > 1 ? 's' : ''} Cleared!`, 2000), 100);
                break;
            case 'double_or_half_next':
                this.player.nextItemModifier = Math.random() < 0.5 ? 'double' : 'half';
                setTimeout(()=> this.setStatusMessage(`Next item x${this.player.nextItemModifier === 'double' ? 2 : 0.5} points!`, 2500),100);
                break;
            default:
                console.warn(`Unknown mystery item effect: ${item.effect} for item ${item.name}`);
                this.setStatusMessage(`Unusual effect from ${item.name}!`, 2000);
                break;
        }
    }

    spawnNewItems() {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime > this.currentSkillSpawnInterval) {
            if (this.items.length < GAME_CONFIG.MAX_ITEMS_ON_SCREEN) {
                const rand = Math.random();
                if (rand < 0.08 && mysteryItemsData.length > 0) { 
                     this.spawnItem(true, true);
                } else {
                    const isSafeZone = this.activeEvent?.type === 'SAFE_ZONE';
                    this.spawnItem(isSafeZone || (Math.random() < 0.65), false); 
                }
            }
            this.lastSpawnTime = currentTime;
        }
    }
    
    spawnItem(isSkillType, isMystery = false) {
        const newItem = this.generateNewItem(isSkillType, isMystery);
        if (newItem) this.items.push(newItem);
    }

    updateDynamicDifficulty(deltaTime, forceUpdateBase = false) {
        if (!forceUpdateBase) this.gameTimeElapsed += deltaTime * 1000;

        if (forceUpdateBase || this.gameTimeElapsed - this.lastDynamicDifficultyUpdateTime > GAME_CONFIG.DYNAMIC_DIFFICULTY_TIME_INTERVAL) {
            const difficultyFactorTime = Math.floor(this.gameTimeElapsed / GAME_CONFIG.DYNAMIC_DIFFICULTY_TIME_INTERVAL);
            
            let baseSpawnInterval = GAME_CONFIG.BASE_SKILL_SPAWN_INTERVAL - (difficultyFactorTime * GAME_CONFIG.DYNAMIC_DIFFICULTY_SPAWN_DECREMENT);
            this.currentSkillSpawnInterval = Math.max(500, baseSpawnInterval); 

            let baseSpeedMultiplier = 1.0 + (difficultyFactorTime * GAME_CONFIG.DYNAMIC_DIFFICULTY_SPEED_INCREMENT);
            this.currentItemSpeedMultiplier = Math.min(2.5, baseSpeedMultiplier); 
            
            if (!forceUpdateBase) {
                 this.lastDynamicDifficultyUpdateTime = this.gameTimeElapsed;
                 console.log(`Dynamic Difficulty: Speed Multi: ${this.currentItemSpeedMultiplier.toFixed(2)}, Spawn Interval: ${this.currentSkillSpawnInterval}ms`);
            }
        }
    }
    
    update(deltaTime) {
        deltaTime = Math.min(deltaTime, 0.1); 

        this.updateDynamicDifficulty(deltaTime);

        if (this.isMobile) { 
            this.updatePlayerToTouchPosition(deltaTime);
        } else {
            this.updatePlayerPosition(deltaTime); 
        }

        this.updateItems(deltaTime);
        this.checkCollisions();
        this.spawnNewItems();

        if (this.statusMessageTimer > 0) {
            this.statusMessageTimer -= deltaTime * 1000;
            if (this.statusMessageTimer <= 0) {
                this.statusMessage = "";
            }
        }

        if (this.activeEvent && this.activeEvent.type !== 'NONE') {
            this.eventTimer -= deltaTime * 1000;
            if (this.eventTimer <= 0) {
                this.revertEventEffects();
            } else {
                if (this.activeEvent.type === 'SPECIFIC_SKILL_BONUS' && this.specificBonusSkillName) {
                     this.eventMessage = `Hunt: ${this.specificBonusSkillName}! (${Math.ceil(this.eventTimer / 1000)}s)`;
                } else {
                    this.eventMessage = `${this.activeEvent.name} (${Math.ceil(this.eventTimer / 1000)}s)`;
                }
            }
        }
        
        if (this.player.isShielded) {
            this.player.shieldTimer -= deltaTime * 1000;
            if (this.player.shieldTimer <= 0) {
                this.player.isShielded = false;
                this.setStatusMessage("Shield Deactivated!", 1500);
            } else {
                this.statusMessage = `Shield: ${Math.ceil(this.player.shieldTimer / 1000)}s`;
                this.statusMessageTimer = 50; 
            }
        }

        if (this.score >= this.nextMilestoneScore && this.activeEvent?.type === 'NONE') { 
            this.triggerRandomEvent();
            this.nextMilestoneScore += GAME_CONFIG.EVENT_TRIGGER_SCORE_MILESTONE + Math.floor(this.difficultyLevel * 3);
        }
        
        return {
            gameOver: this.score < 0,
            won: this.score >= this.currentWinningScore,
            score: this.score
        };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.offscreenCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.items.forEach(item => {
            let itemColor = item.isMystery ? '#FF00FF' : (item.isSkill ? '#FFFF00' : '#FF0000');
            if (item.behavior === 'homing_player_skill' || item.behavior === 'homing_player_anti_skill') {
                this.offscreenCtx.fillStyle = 'rgba(0, 255, 255, 0.15)'; 
                this.offscreenCtx.beginPath();
                this.offscreenCtx.arc(item.x, item.y, item.radius + 4, 0, Math.PI * 2);
                this.offscreenCtx.fill();
            }
            if (item.behavior === 'timed_explode' && item.lifeTimer !== null && item.lifeTimer < 3000) {
                itemColor = (Math.floor(item.lifeTimer / 200) % 2 === 0) ? '#FFA500' : (item.isSkill ? '#FFFF00' : '#FF0000'); 
            }
            this.offscreenCtx.fillStyle = itemColor;
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            this.offscreenCtx.fill();
            this.offscreenCtx.fillStyle = '#000000';
            const fontSizeItemName = Math.max(9, this.canvas.width / 70);
            this.offscreenCtx.font = `${fontSizeItemName}px Arial`;
            this.offscreenCtx.textAlign = 'center';
            this.offscreenCtx.fillText(item.name, item.x, item.y + (fontSizeItemName / 3));
        });
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);

        let playerColor = this.player.isMoving ? '#00DD66' : '#00FF00'; 
        if (this.player.isShielded) playerColor = '#00FFFF';
        this.ctx.fillStyle = playerColor;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        if (this.isMobile && this.player.isMoving && this.touchState.active && this.touchState.position) {
             this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
             this.ctx.beginPath();
             this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
             this.ctx.lineTo(this.touchState.position.x, this.touchState.position.y);
             this.ctx.stroke();
        }

        const uiFontSize = Math.max(16, this.canvas.width / 35);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${uiFontSize}px VT323`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score} / ${this.currentWinningScore}`, 10, uiFontSize);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Diff: ${this.difficultyLevel}`, this.canvas.width - 10, uiFontSize);

        if (this.eventMessage) {
            this.ctx.fillStyle = 'rgba(200, 200, 50, 0.9)'; 
            this.ctx.font = `${Math.max(14, uiFontSize * 0.8)}px VT323`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.eventMessage, this.canvas.width / 2, uiFontSize);
        }
        if (this.statusMessage) {
            this.ctx.fillStyle = 'rgba(180, 180, 255, 0.9)'; 
            this.ctx.font = `${Math.max(12, uiFontSize * 0.75)}px VT323`;
            this.ctx.textAlign = 'center';
            const statusY = this.eventMessage ? uiFontSize + Math.max(14, uiFontSize * 0.8) * 0.8 : uiFontSize;
            this.ctx.fillText(this.statusMessage, this.canvas.width / 2, statusY);
        }
    }

    cleanup() { }
}