export const GameMessages = ({ gameState, countdown, isMobile }) => {
    return (
        <>
            <h2>Skill Collector</h2>
            <p>{isMobile ? "Drag to move" : "Use arrow keys to move"}. 
               Collect skills (yellow) and avoid anti-skills (red)!</p>
            <p>Goal: Reach 50 points</p>
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
        </>
    );
};