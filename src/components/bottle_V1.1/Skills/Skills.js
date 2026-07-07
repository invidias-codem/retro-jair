// Skills.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameMessages } from './GameMessages';
import { GameControls } from './GameControls';
import MinigameCanvas from './minigame/MinigameCanvas';
import RPGViewport from './rpg/RPGViewport';
import './Skills.css';
import { GAME_CONFIG } from './gameLogic';

const SKILLS_CONTENT = [
  { group: 'frontend', items: ['React', 'JavaScript', 'TypeScript', 'Vue.js', 'HTML/CSS'] },
  { group: 'backend', items: ['Node.js', 'Python', 'REST API', 'GraphQL'] },
  { group: 'data', items: ['SQL', 'MongoDB'] },
  { group: 'cloud', items: ['AWS', 'Docker'] },
  { group: 'methodology', items: ['Testing', 'Git'] }
];

const SkillGame = () => {
    const [mode, setMode] = useState('content'); // 'content' | 'minigame' | 'rpg'
    const [isMobile, setIsMobile] = useState(false);
    const [gameState, setGameState] = useState('idle');
    const [score, setScore] = useState(0);
    const [difficultyLevel, setDifficultyLevel] = useState(1);
    const [currentWinningScore, setCurrentWinningScore] = useState(
        GAME_CONFIG.BASE_WINNING_SCORE + (difficultyLevel - 1) * GAME_CONFIG.WINNING_SCORE_DIFFICULTY_MULTIPLIER
    );

    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef(null);
    const minigameRef = useRef(null);

    // Keep existing countdown/replay logic for minigame mode
    const initialCountdownForLogRef = useRef(10);

    useEffect(() => {
        setCurrentWinningScore(GAME_CONFIG.BASE_WINNING_SCORE + (difficultyLevel - 1) * GAME_CONFIG.WINNING_SCORE_DIFFICULTY_MULTIPLIER);
    }, [difficultyLevel]);

    const handleMinigameEnd = useCallback(({ kind, score: endScore = 0 }) => {
        setScore(endScore);
        if (kind === 'won') {
            setGameState('won');
            setDifficultyLevel(prev => prev + 1);
        } else if (kind === 'lost' || kind === 'errored') {
            setGameState('lost');
        }
    }, []);

    const handleStart = useCallback(() => {
        console.log("Skills.js: handleStart called");
        setGameState('playing');
    }, []);

    const handleReplay = useCallback(() => {
        if (minigameRef.current?.reset) {
            minigameRef.current.reset(difficultyLevel);
            setGameState('playing');
        } else {
            setGameState('idle');
            setTimeout(() => setGameState('playing'), 0);
        }
    }, [difficultyLevel]);

    useEffect(() => {
        const handleResize = () => {
            const isMobileView = window.innerWidth <= 768;
            setIsMobile(isMobileView);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let timerId = null;
        if (gameState === 'won' || gameState === 'lost') {
            console.log(`Skills.js: Game ended (${gameState}). Starting countdown from ${initialCountdownForLogRef.current}.`);
            timerId = setInterval(() => {
                setCountdown(prevCountdown => {
                    if (prevCountdown <= 1) {
                        clearInterval(timerId);
                        console.log("Skills.js: Countdown finished. Calling handleReplay.");
                        handleReplay();
                        return 0;
                    }
                    return prevCountdown - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerId) {
                clearInterval(timerId);
            }
        };
    }, [gameState, handleReplay]);

    return (
        <div className={`skill-game ${mode === 'minigame' ? 'minigame-mode' : ''}`}>
            <audio ref={audioRef} src="/retro.wav" loop preload="auto" />
            <button onClick={() => setIsMuted(m => !m)} className="mute-button" aria-label="Toggle Mute">
                {isMuted ? 'Unmute' : 'Mute'}
            </button>

            <div className="mode-bar">
                <button className="mode-button active" onClick={() => setMode('content')}>Skills</button>
                <button className="mode-button" onClick={() => setMode('minigame')}>Skill Game</button>
                <button className="mode-button" onClick={() => setMode('rpg')}>RPG Explorer</button>
            </div>

            {mode === 'content' && (
                <div className="skills-content">
                    <h2>Skills</h2>
                    <p>These are the skills powering my work.</p>
                    <div className="skills-grid">
                        {SKILLS_CONTENT.map(group => (
                            <div className="skills-group" key={group.group}>
                                <h3>{group.group}</h3>
                                <ul>
                                    {group.items.map(item => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {mode === 'minigame' && (
                <>
                    <GameMessages
                        gameState={gameState}
                        countdown={10}
                        isMobile={isMobile}
                        currentWinningScore={currentWinningScore}
                        score={score}
                    />
                    <div className="canvas-container">
                        {gameState !== 'idle' && (
                            <MinigameCanvas
                                ref={minigameRef}
                                difficultyLevel={difficultyLevel}
                                onEnd={handleMinigameEnd}
                                onScore={setScore}
                                muted={isMuted}
                            />
                        )}
                    </div>
                    <GameControls
                        onReplay={handleReplay}
                        onStart={handleStart}
                        gameState={gameState}
                        difficultyLevel={difficultyLevel}
                    />
                </>
            )}

            {mode === 'rpg' && <RPGViewport />}
        </div>
    );
};

export default SkillGame;
