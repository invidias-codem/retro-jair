import { skillsData, antiSkillsData } from './gameData';

// --- GAME_CONFIG for Skill Flyer ---
export const GAME_CONFIG = {
    // --- Physics ---
    GRAVITY: 980, // pixels per second squared
    PLAYER_FLAP_STRENGTH: 350, // upward velocity on tap
    PLAYER_MAX_FALL_SPEED: 600, // Terminal velocity
    
    // --- Game Speed ---
    SCROLL_SPEED: 150, // pixels per second (how fast items move left)
    ITEM_SPAWN_INTERVAL: 2.0, // seconds between spawns
    
    // --- Entity Stats ---
    PLAYER_SIZE: {
        WIDTH: 32,
        HEIGHT: 32
    },
    PLAYER_FIXED_X: 100, // Player's fixed horizontal position
    
    // --- Scoring ---
    BASE_WINNING_SCORE: 50,
    WINNING_SCORE_DIFFICULTY_MULTIPLIER: 25
};

// --- Main GameState Class ---
export class GameState {
    constructor(canvas, difficultyLevel = 1) {
        if (!canvas) throw new Error('Canvas is required');
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        if (!this.ctx) throw new Error('Failed to get 2D context');

        this.difficultyLevel = difficultyLevel;
        
        // Adjust difficulty
        this.scrollSpeed = GAME_CONFIG.SCROLL_SPEED + (difficultyLevel - 1) * 20;
        this.spawnInterval = Math.max(0.8, GAME_CONFIG.ITEM_SPAWN_INTERVAL - (difficultyLevel - 1) * 0.2);
        
        // Game State
        this.score = 0;
        this.gameTimeElapsed = 0;
        this.isPaused = false;
        
        // Collections
        this.skills = [];
        this.enemies = [];
        
        // Player State
        this.player = {
            x: GAME_CONFIG.PLAYER_FIXED_X,
            y: canvas.height / 2,
            vy: 0,
            width: GAME_CONFIG.PLAYER_SIZE.WIDTH,
            height: GAME_CONFIG.PLAYER_SIZE.HEIGHT
        };
        
        // Spawning
        this.spawnTimer = this.spawnInterval;
        
        // Status Messages
        this.statusMessage = "";
        this.statusMessageTimer = 0;
        
        // Input State
        this.activeKeys = new Set();
        
        // --- NEW: Refactored Boundaries ---
        // Moved from local vars to class properties
        this.deathZoneTop = 30;
        this.deathZoneBottom = this.canvas.height - 30;
        // --- END NEW ---
    }
    
    // --- Input Handler ---
    handlePlayerFlap() {
        if (!this.isPaused) {
            this.player.vy = -GAME_CONFIG.PLAYER_FLAP_STRENGTH;
        }
    }
    
    handleKeyDown(key) {
        this.activeKeys.add(key);
        
        // Handle pause
        if (key === 'p' || key === 'P' || key === 'Escape') {
            this.isPaused = !this.isPaused;
            return;
        }
        
        // Handle flap
        if (key === ' ' || key === 'ArrowUp') {
            this.handlePlayerFlap();
        }
    }
    
    handleKeyUp(key) {
        this.activeKeys.delete(key);
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        // Any touch triggers a flap
        this.handlePlayerFlap();
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        // Not needed for this simple mechanic
    }
    
    // --- Physics & Updates ---
    updatePlayer(deltaTime) {
        // Apply gravity
        this.player.vy += GAME_CONFIG.GRAVITY * deltaTime;
        
        // Cap fall speed
        if (this.player.vy > GAME_CONFIG.PLAYER_MAX_FALL_SPEED) {
            this.player.vy = GAME_CONFIG.PLAYER_MAX_FALL_SPEED;
        }
        
        // Update vertical position
        this.player.y += this.player.vy * deltaTime;
        
        // Check for deadly boundaries (instant death if hit)
        // --- MODIFIED: Use class properties ---
        if (this.player.y < this.deathZoneTop || this.player.y + this.player.height > this.deathZoneBottom) {
        // --- END MODIFIED ---
            // Player hit the boundary - game over!
            return true; // Signal death
        }
        
        return false; // Player is safe
    }
    
    updateSpawning(deltaTime) {
        this.spawnTimer -= deltaTime;
        
        if (this.spawnTimer <= 0) {
            this.spawnTimer = this.spawnInterval;
            
            // Increase difficulty with level - more complex patterns
            const pattern = Math.random();
            const safeZoneTop = 60;
            const safeZoneBottom = this.canvas.height - 60;
            const spawnRange = safeZoneBottom - safeZoneTop;
            
            // --- MODIFIED: Spawn Ratios (More Obstacles) ---
            if (pattern < 0.2) { // 20% chance for skill (was 0.3)
                // Single skill
                const skill = skillsData[Math.floor(Math.random() * skillsData.length)];
                this.skills.push({
                    x: this.canvas.width,
                    y: safeZoneTop + Math.random() * spawnRange,
                    width: 40,
                    height: 40,
                    ...skill,
                    id: Date.now() + Math.random()
                });
            } else if (pattern < 0.4) { // 20% chance for enemy (was 0.5)
                // Single enemy
                const antiSkill = antiSkillsData[Math.floor(Math.random() * antiSkillsData.length)];
                this.enemies.push({
                    x: this.canvas.width,
                    y: safeZoneTop + Math.random() * spawnRange,
                    width: 40,
                    height: 40,
                    ...antiSkill,
                    id: Date.now() + Math.random()
                });
            } else if (pattern < 0.6 && this.difficultyLevel >= 2) { // 20% chance for wall (was 0.7)
                // Wall of enemies with a gap (harder pattern)
                const gapY = safeZoneTop + Math.random() * (spawnRange - 100);
                const gapSize = Math.max(80, 120 - this.difficultyLevel * 10); // Gap gets smaller with difficulty
                
                // Top wall
                for (let y = safeZoneTop; y < gapY; y += 45) {
                    const antiSkill = antiSkillsData[Math.floor(Math.random() * antiSkillsData.length)];
                    this.enemies.push({
                        x: this.canvas.width,
                        y: y,
                        width: 40,
                        height: 40,
                        ...antiSkill,
                        id: Date.now() + Math.random() + y
                    });
                }
                
                // Bottom wall
                for (let y = gapY + gapSize; y < safeZoneBottom; y += 45) {
                    const antiSkill = antiSkillsData[Math.floor(Math.random() * antiSkillsData.length)];
                    this.enemies.push({
                        x: this.canvas.width,
                        y: y,
                        width: 40,
                        height: 40,
                        ...antiSkill,
                        id: Date.now() + Math.random() + y
                    });
                }
                
                // Place a skill in the gap as reward
                const skill = skillsData[Math.floor(Math.random() * skillsData.length)];
                this.skills.push({
                    x: this.canvas.width + 20,
                    y: gapY + gapSize / 2 - 20,
                    width: 40,
                    height: 40,
                    points: skill.points * 2, // Double points for navigating the gap
                    ...skill,
                    id: Date.now() + Math.random()
                });
            } else if (pattern < 0.8 && this.difficultyLevel >= 3) { // 20% chance for sine (was 0.85)
                // Moving obstacle pattern (sine wave)
                const baseY = this.canvas.height / 2;
                for (let i = 0; i < 3; i++) {
                    const antiSkill = antiSkillsData[Math.floor(Math.random() * antiSkillsData.length)];
                    this.enemies.push({
                        x: this.canvas.width + i * 50,
                        y: baseY + Math.sin(i) * 100,
                        width: 40,
                        height: 40,
                        vx: 0,
                        vy: 100 * (Math.random() > 0.5 ? 1 : -1), // Vertical movement
                        ...antiSkill,
                        id: Date.now() + Math.random() + i
                    });
                }
            // --- NEW: Crossing Pattern ---
            } else if (pattern < 0.9 && this.difficultyLevel >= 4) { // 10% chance
                // Two enemies that cross paths
                const antiSkill1 = antiSkillsData[Math.floor(Math.random() * antiSkillsData.length)];
                const antiSkill2 = antiSkillsData[Math.floor(Math.random() * antiSkillsData.length)];
                
                this.enemies.push({
                    x: this.canvas.width,
                    y: safeZoneTop + 50,
                    width: 40, height: 40,
                    vy: 75, // Moves down
                    ...antiSkill1,
                    id: Date.now() + Math.random() + 1
                });
                
                this.enemies.push({
                    x: this.canvas.width + 10, // Slightly offset
                    y: safeZoneBottom - 50,
                    width: 40, height: 40,
                    vy: -75, // Moves up
                    ...antiSkill2,
                    id: Date.now() + Math.random() + 2
                });
            // --- END NEW ---
            } else { // 10% chance
                // Mixed pattern - skill with enemies above and below
                const centerY = safeZoneTop + spawnRange / 2;
                
                // Skill in center
                const skill = skillsData[Math.floor(Math.random() * skillsData.length)];
                this.skills.push({
                    x: this.canvas.width,
                    y: centerY,
                    width: 40,
                    height: 40,
                    ...skill,
                    id: Date.now() + Math.random()
                });
                
                // Enemies above and below
                if (this.difficultyLevel >= 2) {
                    const antiSkill1 = antiSkillsData[Math.floor(Math.random() * antiSkillsData.length)];
                    const antiSkill2 = antiSkillsData[Math.floor(Math.random() * antiSkillsData.length)];
                    
                    this.enemies.push({
                        x: this.canvas.width,
                        y: centerY - 80,
                        width: 40,
                        height: 40,
                        ...antiSkill1,
                        id: Date.now() + Math.random() + 1
                    });
                    
                    this.enemies.push({
                        x: this.canvas.width,
                        y: centerY + 80,
                        width: 40,
                        height: 40,
                        ...antiSkill2,
                        id: Date.now() + Math.random() + 2
                    });
                }
            }
            // --- END MODIFIED ---
        }
    }
    
    updateItems(deltaTime) {
        // Update skills
        this.skills = this.skills.filter(skill => {
            skill.x -= this.scrollSpeed * deltaTime;
            return skill.x > -skill.width; // Keep if still on screen
        });
        
        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.x -= this.scrollSpeed * deltaTime;
            
            // --- NEW: Update vertical velocity for moving enemies ---
            if (enemy.vy) {
                enemy.y += enemy.vy * deltaTime;
                // Bounce off the *death zones*
                if (enemy.y < this.deathZoneTop || enemy.y + enemy.height > this.deathZoneBottom) {
                    enemy.vy *= -1; // Invert velocity
                }
            }
            // --- END NEW ---
            
            return enemy.x > -enemy.width;
        });
    }
    
    // --- Collision Detection ---
    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
    
    checkGameCollisions() {
        let gameOver = false;
        
        // Check player vs skills
        this.skills = this.skills.filter(skill => {
            if (this.checkCollision(this.player, skill)) {
                this.score += skill.points;
                this.setStatusMessage(`+${skill.points} ${skill.name}!`, 1000);
                return false; // Remove the skill
            }
            return true; // Keep the skill
        });
        
        // Check player vs enemies
        this.enemies.forEach(enemy => {
            if (this.checkCollision(this.player, enemy)) {
                gameOver = true;
                this.setStatusMessage(`Hit by ${enemy.name}!`, 2000);
            }
        });
        
        return gameOver;
    }
    
    // --- Status Message ---
    setStatusMessage(message, duration) {
        this.statusMessage = message;
        this.statusMessageTimer = duration;
    }
    
    updateStatusMessage(deltaTime) {
        if (this.statusMessageTimer > 0) {
            this.statusMessageTimer -= deltaTime * 1000;
            if (this.statusMessageTimer <= 0) {
                this.statusMessage = "";
            }
        }
    }
    
    // --- Main Update Loop ---
    update(deltaTime) {
        if (this.isPaused) {
            return { gameOver: false, won: false, score: this.score };
        }
        
        deltaTime = Math.min(deltaTime, 0.1);
        this.gameTimeElapsed += deltaTime;
        
        // Check if player hit boundaries
        const hitBoundary = this.updatePlayer(deltaTime);
        if (hitBoundary) {
            this.setStatusMessage("Hit the boundary!", 2000);
            return { gameOver: true, won: false, score: this.score };
        }
        
        this.updateItems(deltaTime);
        this.updateSpawning(deltaTime);
        this.updateStatusMessage(deltaTime);
        
        const gameOver = this.checkGameCollisions();
        
        // Win condition: survive for 60 seconds or reach target score
        const targetScore = GAME_CONFIG.BASE_WINNING_SCORE + (this.difficultyLevel - 1) * GAME_CONFIG.WINNING_SCORE_DIFFICULTY_MULTIPLIER;
        const won = this.score >= targetScore;
        
        return {
            gameOver: gameOver,
            won: won,
            score: this.score
        };
    }
    
    // --- Drawing Methods ---
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw danger zones (death boundaries)
        // --- MODIFIED: Use class properties ---
        // Top danger zone
        const topGradient = this.ctx.createLinearGradient(0, 0, 0, this.deathZoneTop);
        topGradient.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
        topGradient.addColorStop(1, 'rgba(255, 0, 0, 0.1)');
        this.ctx.fillStyle = topGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.deathZoneTop);
        
        // Bottom danger zone
        const bottomGradient = this.ctx.createLinearGradient(0, this.deathZoneBottom, 0, this.canvas.height);
        bottomGradient.addColorStop(0, 'rgba(255, 0, 0, 0.1)');
        bottomGradient.addColorStop(1, 'rgba(255, 0, 0, 0.6)');
        this.ctx.fillStyle = bottomGradient;
        this.ctx.fillRect(0, this.deathZoneBottom, this.canvas.width, this.canvas.height - this.deathZoneBottom);
        
        // Draw danger zone boundaries
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        
        // Top boundary
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.deathZoneTop);
        this.ctx.lineTo(this.canvas.width, this.deathZoneTop);
        this.ctx.stroke();
        
        // Bottom boundary
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.deathZoneBottom);
        this.ctx.lineTo(this.canvas.width, this.deathZoneBottom);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]); // Reset line dash
        // --- END MODIFIED ---
        
        // Draw skills
        this.ctx.fillStyle = '#4fbf26';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.skills.forEach(skill => {
            // Draw skill box
            this.ctx.fillStyle = '#4fbf26';
            this.ctx.fillRect(skill.x, skill.y, skill.width, skill.height);
            
            // Draw skill border
            this.ctx.strokeStyle = '#7fff00';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(skill.x, skill.y, skill.width, skill.height);
            
            // Draw skill initial
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px monospace';
            this.ctx.fillText(skill.name[0], skill.x + skill.width/2, skill.y + skill.height/2);
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            // Draw enemy box
            this.ctx.fillStyle = '#e94560';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Draw enemy border
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Draw X symbol
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(enemy.x + 10, enemy.y + 10);
            this.ctx.lineTo(enemy.x + enemy.width - 10, enemy.y + enemy.height - 10);
            this.ctx.moveTo(enemy.x + enemy.width - 10, enemy.y + 10);
            this.ctx.lineTo(enemy.x + 10, enemy.y + enemy.height - 10);
            this.ctx.stroke();
        });
        
        // Draw player
        this.ctx.fillStyle = '#00d9ff';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw player border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw UI
        this.drawUI();
        
        // Draw pause overlay
        if (this.isPaused) {
            this.drawPauseMenu();
        }
    }
    
    drawUI() {
        const uiFontSize = Math.max(20, this.canvas.width / 30);
        
        // Draw score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${uiFontSize}px monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Score: ${this.score}`, 20, 20);
        
        // Draw level
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Level: ${this.difficultyLevel}`, this.canvas.width - 20, 20);
        
        // Draw status message
        if (this.statusMessage && !this.isPaused) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.font = `${Math.max(16, uiFontSize * 0.8)}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.statusMessage, this.canvas.width / 2, 60);
        }
        
        // Draw instructions (mobile)
        if (this.canvas.width <= 768) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Tap anywhere to fly', this.canvas.width / 2, this.canvas.height - 30);
        }
    }
    
    drawPauseMenu() {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause text
        const fontSize = Math.max(32, this.canvas.width / 20);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${fontSize}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - fontSize);
        
        this.ctx.font = `${fontSize * 0.5}px monospace`;
        this.ctx.fillText('Press P or ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + fontSize);
    }
    
    // --- Resize Handler ---
    handleCanvasResize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // --- MODIFIED: Update boundary on resize ---
        this.deathZoneBottom = this.canvas.height - 30;
        // --- END MODIFIED ---
        
        // Adjust player position if needed
        if (this.player.y > canvas.height - this.player.height - 10) {
            this.player.y = canvas.height / 2;
        }
    }
    
    cleanup() {
        // Clean up any resources if needed
    }
}