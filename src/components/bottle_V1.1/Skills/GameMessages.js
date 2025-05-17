export const GameMessages = ({ gameState, countdown, isMobile, currentWinningScore, score }) => {
    return (
        <>
            <h2>Skill Collector</h2>
            <p>{isMobile ? "Drag to move" : "Use arrow keys to move"}. 
               Collect skills (yellow) and avoid anti-skills (red)!</p>
            {/* Display current winning score, updated by difficulty */}
            <p>Goal: Reach {currentWinningScore} points</p>
            
            {gameState === 'won' && (
                <div className="win-message">
                    Congratulations! You've mastered the skills with a score of {score}!
                    <br />
                    Next game will be harder. Restarting in {countdown} seconds...
                </div>
            )}
            {gameState === 'lost' && (
                <div className="lose-message">
                    Game Over! Your score was {score}.
                    <br />
                    Restarting in {countdown} seconds...
                </div>
            )}
        </>
    );
};