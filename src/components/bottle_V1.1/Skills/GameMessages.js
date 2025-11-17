// Skills/GameMessages.js

export const GameMessages = ({ gameState, countdown, isMobile, currentWinningScore, score }) => {
    // Mobile-first flyer game instructions
    const instructions = isMobile 
        ? "Tap anywhere to fly up!"
        : "Press Spacebar or Up Arrow to fly!";
    
    const objective = "Collect skills and avoid the anti-skills!";

    return (
        <>
            <h2>Skill Collector</h2>
            <p>{instructions}</p>
            <p>{objective}</p>
            
            {/* The win/loss messages are still perfectly valid! */}
            {/* The 'gameState' prop from Skills.js handles this */}
            {gameState === 'won' && (
                <div className="win-message">
                    Level Complete! You're fixing the program!
                    <br />
                    Next level loading in {countdown} seconds...
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