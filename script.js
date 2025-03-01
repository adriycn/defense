// script.js

// Global variables for question sets
let questions = { easy: [], medium: [], hard: [] };
let originalQuestions = null; // We'll store an original copy for restarts

const participantNames = ["Miguel", "Josh", "Randi", "Mark", "Willow", "Irish"];
const difficulties = ["easy", "medium", "hard"];
const countdownOptions = [10, 30, 60];
let timerInterval = null;

// Counter for skipped questions
let skipCount = 0;

// Variables to hold the current question’s difficulty and its point value
let currentDifficulty = "";
let currentPointValue = 0;

// Initialize participant stats (how many times each has been picked)
const participantStats = {};
participantNames.forEach(name => {
  participantStats[name] = 0;
});

// --- Wallpaper lists ---
const generalWallpapers = [
  "random.jpg",
  "random5.jpg",
  "random4.jpg",
  "random3.jpg",
  "random.png"
];
const specialWallpapers = {
  "Josh": ["josh.jpg", "josh2.jpg"],
  "Miguel": ["miguel.jpeg"],
  "Randi": ["randi.png", "randi2.gif"]
};
window.lastWallpaper = ""; // Store last wallpaper globally

/**
 * Weighted random logic for participant selection
 */
function getWeight(count) {
  if (count < 2) return 3 - count;  // 0 picks → weight 3; 1 pick → weight 2
  else if (count === 2) return 1;   // 2 picks → weight 1
  else return 0.5;                  // >2 picks → weight 0.5
}

function weightedSelectParticipant() {
  let totalWeight = 0;
  const weights = [];
  participantNames.forEach(name => {
    const weight = getWeight(participantStats[name]);
    weights.push(weight);
    totalWeight += weight;
  });
  
  let random = Math.random() * totalWeight;
  let selected = null;
  for (let i = 0; i < participantNames.length; i++) {
    random -= weights[i];
    if (random < 0) {
      selected = participantNames[i];
      break;
    }
  }
  participantStats[selected] += 1;
  return selected;
}

/**
 * Updates the debug panel:
 * - Participant Chances
 * - Remaining question counts for Easy, Medium, and Hard
 */
function updateDebugPanel() {
  // 1) Participant Chances
  let totalWeight = 0;
  const weights = {};
  participantNames.forEach(name => {
    const w = getWeight(participantStats[name]);
    weights[name] = w;
    totalWeight += w;
  });
  
  const debugList = document.getElementById("debugList");
  const frag = document.createDocumentFragment();
  participantNames.forEach(name => {
    const chance = (weights[name] / totalWeight) * 100;
    const li = document.createElement("li");
    li.textContent = `${name}: ${chance.toFixed(2)}%`;
    frag.appendChild(li);
  });
  debugList.innerHTML = "";
  debugList.appendChild(frag);

  // 2) Remaining Question Counts
  const questionCountDebug = document.getElementById("questionCountDebug");
  if (!questionCountDebug) return;
  questionCountDebug.innerHTML = "";
  
  const header = document.createElement("p");
  header.innerHTML = "<strong>Remaining Questions</strong>";
  questionCountDebug.appendChild(header);

  const countList = document.createElement("ul");
  
  const easyItem = document.createElement("li");
  easyItem.textContent = `Easy: ${questions.easy?.length || 0}`;
  countList.appendChild(easyItem);
  
  const medItem = document.createElement("li");
  medItem.textContent = `Medium: ${questions.medium?.length || 0}`;
  countList.appendChild(medItem);
  
  const hardItem = document.createElement("li");
  hardItem.textContent = `Hard: ${questions.hard?.length || 0}`;
  countList.appendChild(hardItem);
  
  questionCountDebug.appendChild(countList);
}

/**
 * Update the wallpaper based on the chosen participant
 */
function updateWallpaper(selectedParticipant) {
  let chosenWallpaper = "";
  if (["Josh", "Miguel", "Randi"].includes(selectedParticipant)) {
    if (Math.random() < 0.3) {
      const specials = specialWallpapers[selectedParticipant];
      chosenWallpaper = specials[Math.floor(Math.random() * specials.length)];
    }
  }
  if (!chosenWallpaper) {
    chosenWallpaper = generalWallpapers[Math.floor(Math.random() * generalWallpapers.length)];
  }
  if (window.lastWallpaper === chosenWallpaper) {
    let candidates;
    if (["Josh", "Miguel", "Randi"].includes(selectedParticipant) && Math.random() < 0.3) {
      candidates = specialWallpapers[selectedParticipant];
    } else {
      candidates = generalWallpapers;
    }
    if (candidates.length > 1) {
      let newWallpaper;
      do {
        newWallpaper = candidates[Math.floor(Math.random() * candidates.length)];
      } while (newWallpaper === window.lastWallpaper);
      chosenWallpaper = newWallpaper;
    }
  }
  window.lastWallpaper = chosenWallpaper;
  document.body.style.backgroundImage = `url('img/${chosenWallpaper}')`;
}

/**
 * On DOM load, fetch questions and store an original copy for restarts
 */
document.addEventListener("DOMContentLoaded", () => {
  fetch('questions.json')
    .then(response => response.json())
    .then(data => {
      questions = data;
      // Keep a deep copy for restarts
      originalQuestions = JSON.parse(JSON.stringify(data));
    })
    .catch(err => console.error("Error loading questions:", err));
});

// Intro screen dismissal
function dismissIntro() {
  const introScreen = document.getElementById("introScreen");
  const mainContent = document.getElementById("mainContent");
  if (!introScreen.classList.contains("hidden")) {
    introScreen.classList.add("fade-out");
    setTimeout(() => {
      introScreen.style.display = "none";
      mainContent.classList.remove("hidden");
      loadNewQuestion();
    }, 1000);
  }
}

// Keydown: handle intro, game over, success, or next/skip
document.addEventListener("keydown", function(e) {
  const introScreen = document.getElementById("introScreen");
  if (introScreen.style.display !== "none") {
    // If intro is visible, dismiss it
    dismissIntro();
  } else {
    // If game over or success message is visible, SPACE restarts
    if ((gameOverActive || document.getElementById("successMessage")) && e.code === "Space") {
      restartGame();
    }
    // Otherwise handle Next/Skip
    else if (!gameOverActive) {
      if (e.code === "Space" && !nextBtn.disabled) {
        nextQuestion();
      } else if (e.code === "Enter" && !skipBtn.disabled) {
        skipQuestion();
      }
    }
  }
});

// Also allow clicking the intro screen to dismiss it
document.getElementById("introScreen").addEventListener("click", dismissIntro);

// Main game elements
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const questionText = document.getElementById('questionText');
const participantInfo = document.getElementById('participantInfo');
const difficultyInfo = document.getElementById('difficultyInfo');
const timeRemainingEl = document.getElementById('timeRemaining');
const skipCounterEl = document.getElementById('skipCounter');
const questionPointValueEl = document.getElementById('questionPointValue');

/**
 * Lock/unlock Next and Skip for a 2-second cooldown
 */
function disableControlButtons() {
  nextBtn.disabled = true;
  skipBtn.disabled = true;
}
function enableControlButtons() {
  nextBtn.disabled = false;
  skipBtn.disabled = false;
}

/**
 * Start the main countdown for the chosen question
 */
function startCountdown(duration) {
  let currentTime = duration;
  timeRemainingEl.textContent = currentTime;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    currentTime--;
    if (currentTime <= 0) {
      clearInterval(timerInterval);
      timeRemainingEl.textContent = "Time's up!";
    } else {
      timeRemainingEl.textContent = currentTime;
    }
  }, 1000);
}

/**
 * 5-second pre-countdown
 */
function startPreCountdown(callback) {
  let preTime = 8;
  timeRemainingEl.textContent = `Starting in ${preTime}`;
  const preInterval = setInterval(() => {
    preTime--;
    if (preTime <= 0) {
      clearInterval(preInterval);
      callback();
    } else {
      timeRemainingEl.textContent = `Starting in ${preTime}`;
    }
  }, 1000);
}

/**
 * Get a random question from the difficulty array, removing it to avoid repeats.
 * Returns null if the array is empty.
 */
function getRandomQuestion(difficulty) {
  const arr = questions[difficulty];
  if (!arr || arr.length === 0) return null;
  const randIdx = Math.floor(Math.random() * arr.length);
  const q = arr[randIdx];
  arr.splice(randIdx, 1);
  return q;
}

/**
 * Load a new question:
 * - Remove leftover success message if present
 * - Check if all question arrays are empty => success
 * - Otherwise pick a random difficulty, question, participant, etc.
 */
function loadNewQuestion() {
  // 1) Remove leftover success message if it exists
  const leftoverSuccess = document.getElementById("successMessage");
  if (leftoverSuccess) {
    leftoverSuccess.remove();
  }

  // 2) Lock the buttons for 2s
  disableControlButtons();
  setTimeout(() => {
    if (!gameOverActive) enableControlButtons();
  }, 7000);
  
  // 3) Clear any existing timer
  if (timerInterval) clearInterval(timerInterval);
  timeRemainingEl.textContent = '';
  
  // 4) Check if there are no questions left in ANY difficulty
  if (
    !questions.easy.length &&
    !questions.medium.length &&
    !questions.hard.length
  ) {
    const mainContent = document.getElementById("mainContent");
    mainContent.classList.add("fade-out");
    setTimeout(() => {
      mainContent.style.display = "none";
      const successDiv = document.createElement("div");
      successDiv.id = "successMessage";
      successDiv.innerHTML = `
        <p>Congratulations!</p>
        <p>You have successfully defended your research!</p>
        <p>Press SPACE to restart.</p>
      `;
      document.body.appendChild(successDiv);
    }, 1000);
    return;
  }
  
  // 5) Pick a random difficulty
  const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  difficultyInfo.textContent = `Difficulty: ${randomDifficulty}`;
  
  // 6) Assign point value
  currentDifficulty = randomDifficulty;
  if (randomDifficulty === "easy") {
    currentPointValue = 5;
  } else if (randomDifficulty === "medium") {
    currentPointValue = 10;
  } else {
    currentPointValue = 15;
  }
  
  if (questionPointValueEl) {
    questionPointValueEl.textContent = `+${currentPointValue}`;
  }
  
  // 7) Get a question from the chosen difficulty
  const question = getRandomQuestion(randomDifficulty);
  if (!question) {
    // If none for this difficulty, try again
    loadNewQuestion();
    return;
  }
  
  // 8) Select participant, set wallpaper
  const selectedParticipant = weightedSelectParticipant();
  updateWallpaper(selectedParticipant);
  
  // 9) Random countdown from the set
  const randomCountdown = countdownOptions[Math.floor(Math.random() * countdownOptions.length)];
  
  // 10) Fade in the question text
  questionText.classList.remove("fade-in");
  void questionText.offsetWidth; // Force reflow
  questionText.textContent = question;
  questionText.classList.add("fade-in");
  
  participantInfo.textContent = `Participant: ${selectedParticipant}`;
  
  // 11) Update debug panel, then start pre-countdown
  updateDebugPanel();
  startPreCountdown(() => {
    if (!gameOverActive) startCountdown(randomCountdown);
  });
}

/**
 * Next question: add points, then load new question
 */
function nextQuestion() {
  if (!gameOverActive && typeof currentPointValue !== "undefined") {
    addPoints(currentPointValue);
  }
  loadNewQuestion();
}

/**
 * Skip question: subtract points, increment skip count, load new question
 */
function skipQuestion() {
  if (!gameOverActive && typeof currentPointValue !== "undefined") {
    subtractPoints(currentPointValue);
  }
  skipCount++;
  skipCounterEl.textContent = skipCount;
  loadNewQuestion();
}

// Event listeners for the Next and Skip buttons
nextBtn.addEventListener('click', nextQuestion);
skipBtn.addEventListener('click', skipQuestion);
