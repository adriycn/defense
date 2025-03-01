// points.js
let points = 50;
const maxPoints = 100;
const minPoints = 0;

// Track whether we're in a Game Over state
let gameOverActive = false;

function addPoints(amount) {
  if (gameOverActive) return; // no changes if already game over
  points = Math.min(points + amount, maxPoints);
  updatePointsDisplay();
}

function subtractPoints(amount) {
  if (gameOverActive) return;
  points = Math.max(points - amount, minPoints);
  updatePointsDisplay();
}

function updatePointsDisplay() {
  const pointsEl = document.getElementById("pointsCounter");
  if (pointsEl) {
    pointsEl.textContent = points;
  }
  // When points reach 0, fade out the main UI and show a game-over message.
  if (points <= 0 && !gameOverActive) {
    gameOverActive = true;
    const mainContent = document.getElementById("mainContent");
    mainContent.classList.add("fade-out");
    setTimeout(() => {
      mainContent.style.display = "none";
      // Create and show the Game Over message
      const gameOverDiv = document.createElement("div");
      gameOverDiv.id = "gameOverMessage";
      gameOverDiv.innerHTML = `
        <p>You have run out of points!</p>
        <p>Ma'am Terry has decided to fail you.</p>
        <p>Press SPACE to restart</p>
      `;
      document.body.appendChild(gameOverDiv);
    }, 1000);
  }
}

/**
 * Resets everything for a new game, removing any "Game Over" or "Success" screen
 * and restoring the question arrays, points, skip count, etc.
 */
function restartGame() {
  // Remove Game Over message if it exists
  const gameOverDiv = document.getElementById("gameOverMessage");
  if (gameOverDiv) {
    document.body.removeChild(gameOverDiv);
  }
  // Remove Success message if it exists
  const successDiv = document.getElementById("successMessage");
  if (successDiv) {
    document.body.removeChild(successDiv);
  }

  // Reset points, skip count, and gameOver flag
  points = 50;
  skipCount = 0;
  gameOverActive = false;
  updatePointsDisplay();
  
  // Restore question data from the original copy
  questions = JSON.parse(JSON.stringify(originalQuestions));
  
  // Show main content again
  const mainContent = document.getElementById("mainContent");
  mainContent.style.display = "";
  mainContent.classList.remove("fade-out");
  
  // Load the first question fresh
  loadNewQuestion();
}
