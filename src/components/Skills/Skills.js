import React, { useEffect, useRef, useState, useCallback } from 'react';
import './Skills.css';

const skillsData = [
  { name: 'React', points: 3 },
  { name: 'Node.js', points: 3 },
  { name: 'Python', points: 2 },
  { name: 'SQL', points: 2 },
  { name: 'JavaScript', points: 2 },
  { name: 'HTML/CSS', points: 1 },
  { name: 'Git', points: 1 },
  { name: 'REST API', points: 2 },
  { name: 'MongoDB', points: 2 },
  { name: 'AWS', points: 2 }
];

const antiSkillsData = [
  { name: 'Procrastination', points: -3 },
  { name: 'Bugs', points: -2 },
  { name: 'Coffee Spills', points: -1 },
  { name: 'Meetings', points: -2 },
  { name: 'Slow Internet', points: -2 },
  { name: 'Distractions', points: -2 },
  { name: 'Burnout', points: -3 },
  { name: 'Scope Creep', points: -2 },
  { name: 'Legacy Code', points: -2 },
  { name: 'Deadlines', points: -2 },
  { name: 'Multitasking', points: -1 },
  { name: 'Tech Debt', points: -2 },
  { name: 'Feature Creep', points: -2 },
  { name: 'Overtime', points: -1 },
  { name: 'Imposter Syndrome', points: -2 }
];

const SkillGame = () => {
  const canvasRef = useRef(null);
  const itemsRef = useRef([]);
  const scoreRef = useRef(0);
  const playerRef = useRef(null);
  const [gameState, setGameState] = useState('playing');
  const [countdown, setCountdown] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  const resetGameAndPopulateItems = useCallback(() => {
    scoreRef.current = 0;
    const canvas = canvasRef.current;
    playerRef.current = {
      x: canvas.width / 2,
      y: canvas.height - 50,
      width: 50,
      height: 50,
      speed: canvas.width / 100
    };

    const skillRadius = canvas.width / 30;
    const safeZoneRadius = 100;

    const isInSafeZone = (x, y) => {
      const dx = x - playerRef.current.x;
      const dy = y - playerRef.current.y;
      return Math.sqrt(dx * dx + dy * dy) < safeZoneRadius;
    };

    const generateItems = (items, isSkill) => {
      return items.map(item => {
        let x, y;
        do {
          x = Math.random() * (canvas.width - 2 * skillRadius) + skillRadius;
          y = Math.random() * (canvas.height - 2 * skillRadius) + skillRadius;
        } while (isInSafeZone(x, y));

        return { x, y, name: item.name, points: item.points, isSkill: isSkill };
      });
    };

    itemsRef.current = [
      ...generateItems(skillsData, true),
      ...generateItems(antiSkillsData, false)
    ];

    setGameState('playing');
    setCountdown(10);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      const containerWidth = canvas.parentElement.clientWidth;
      const containerHeight = window.innerHeight * 0.6;
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      setIsMobile(window.innerWidth <= 768);
      resetGameAndPopulateItems();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const skillRadius = canvas.width / 30;
    const collisionRadius = skillRadius * 0.7;

    function drawPlayer() {
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    }

    function drawItems() {
      itemsRef.current.forEach(item => {
        ctx.fillStyle = item.isSkill ? '#FFFF00' : '#FF0000';
        ctx.beginPath();
        ctx.arc(item.x, item.y, skillRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = `${canvas.width / 50}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(item.name, item.x, item.y + 5);
      });
    }

    function drawScore() {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${canvas.width / 20}px VT323`;
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${scoreRef.current} / 20`, 10, 30);
    }

    function update() {
      if (gameState !== 'playing') return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPlayer();
      drawItems();
      drawScore();

      let allSkillsCollected = true;

      itemsRef.current = itemsRef.current.filter(item => {
        const dx = playerRef.current.x + playerRef.current.width / 2 - item.x;
        const dy = playerRef.current.y + playerRef.current.height / 2 - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < collisionRadius + playerRef.current.width / 2) {
          scoreRef.current += item.points;
          return false;
        }
        if (item.isSkill) {
          allSkillsCollected = false;
        }
        return true;
      });

      if (allSkillsCollected) {
        setTimeout(() => {
          if (gameState === 'playing') {
            resetGameAndPopulateItems();
          }
        }, 500);
      }

      if (scoreRef.current >= 20) {
        setGameState('won');
      } else if (scoreRef.current < 0) {
        setGameState('lost');
      }

      requestAnimationFrame(update);
    }

    function handleKeyDown(e) {
      if (gameState !== 'playing') return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    
      switch(e.key) {
        case 'ArrowLeft':
          playerRef.current.x = Math.max(playerRef.current.x - playerRef.current.speed, 0);
          break;
        case 'ArrowRight':
          playerRef.current.x = Math.min(playerRef.current.x + playerRef.current.speed, canvas.width - playerRef.current.width);
          break;
        case 'ArrowUp':
          playerRef.current.y = Math.max(playerRef.current.y - playerRef.current.speed, 0);
          break;
        case 'ArrowDown':
          playerRef.current.y = Math.min(playerRef.current.y + playerRef.current.speed, canvas.height - playerRef.current.height);
          break;
        default:
          break;
      }
    }

    function handleTouchMove(e) {
      if (gameState !== 'playing') return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      playerRef.current.x = Math.min(Math.max(touch.clientX - rect.left - playerRef.current.width / 2, 0), canvas.width - playerRef.current.width);
      playerRef.current.y = Math.min(Math.max(touch.clientY - rect.top - playerRef.current.height / 2, 0), canvas.height - playerRef.current.height);
    }

    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchmove', handleTouchMove);
    update();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState, resetGameAndPopulateItems]);

  useEffect(() => {
    let timer;
    if (gameState === 'lost' || gameState === 'won') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            resetGameAndPopulateItems();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, resetGameAndPopulateItems]);

  return (
    <div className="skill-game">
      <h2>Skill Collector</h2>
      <p>{isMobile ? "Drag to move" : "Use arrow keys to move"}. Collect skills (yellow) and avoid anti-skills (red)!</p>
      <p>Goal: Reach 20 points</p>
      <div className="canvas-container">
        <canvas ref={canvasRef} tabIndex="0"></canvas>
        {gameState === 'won' && (
          <div className="win-message">
            Congratulations! You've mastered the skills!
            <br />
            Restarting in {countdown} seconds...
          </div>
        )}
        {gameState === 'lost' && (
          <div className="lose-message">
            Game Over! Too many anti-skills collected.
            <br />
            Restarting in {countdown} seconds...
          </div>
        )}
      </div>
    </div>
  );
}

export default SkillGame;