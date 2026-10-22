// ================================
// POMODORO TIMER
// ================================

const timerDisplay = document.getElementById("timerDisplay");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const currentMode = document.getElementById("currentMode");
const sessionCount = document.getElementById("sessionCount");

const modeButtons = document.querySelectorAll(".mode-btn");


// Timer durations in seconds

const durations = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};


// Current state

let currentModeType = "pomodoro";
let timeLeft = durations.pomodoro;
let timerInterval = null;
let isRunning = false;
let completedSessions = 0;


// Format seconds as MM:SS

function formatTime(seconds) {

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}


// Update timer display

function updateDisplay() {

    timerDisplay.textContent = formatTime(timeLeft);
}


// Update mode text

function updateModeText() {

    if (currentModeType === "pomodoro") {

        currentMode.textContent = "Focus Session";

    } else if (currentModeType === "short") {

        currentMode.textContent = "Short Break";

    } else {

        currentMode.textContent = "Long Break";
    }
}


// Start timer

function startTimer() {

    if (isRunning) {
        return;
    }

    isRunning = true;

    startBtn.textContent = "Pause";

    timerInterval = setInterval(function () {

        timeLeft--;

        updateDisplay();

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            timerInterval = null;

            isRunning = false;

            startBtn.textContent = "Start";

            timerFinished();
        }

    }, 1000);
}


// Pause timer

function pauseTimer() {

    clearInterval(timerInterval);

    timerInterval = null;

    isRunning = false;

    startBtn.textContent = "Start";
}


// Start / Pause button

startBtn.addEventListener("click", function () {

    if (isRunning) {

        pauseTimer();

    } else {

        startTimer();
    }

});


// Reset timer

resetBtn.addEventListener("click", function () {

    pauseTimer();

    timeLeft = durations[currentModeType];

    updateDisplay();
});


// Change mode

modeButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        pauseTimer();

        currentModeType = button.dataset.mode;

        timeLeft = durations[currentModeType];

        // Remove active class

        modeButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        // Activate selected mode

        button.classList.add("active");

        updateDisplay();

        updateModeText();

    });

});


// Timer completed

function timerFinished() {

    if (currentModeType === "pomodoro") {

        completedSessions++;

        sessionCount.textContent = completedSessions;

        alert("Pomodoro completed! Time for a break. 🍅");

    } else {

        alert("Break completed! Ready to study again?");

    }

    // Reset current timer

    timeLeft = durations[currentModeType];

    updateDisplay();
}


// Initial setup

updateDisplay();

updateModeText();