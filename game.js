const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 450;
const HIT_X = 150;
const NOTE_SPEED = 0.4;
const PERFECT_WINDOW = 50;

let gameState = "START";

// Assets
const bgImage = new Image();
bgImage.src = "background.png";

const startImage = new Image();
startImage.src = "start_cover.png";

let backgroundAudio = null;

// Direct embedded chart data (No loading errors)
let chart = {
    audio_file: "Breaking Hell.ogg",
    notes: [3280,
5750,
8175,
8800,
9110,
9685,
10010,
10312,
10609,
10960,
11890,
12210,
13119,
13700,
14007,
14310,
14613,
15055,
15518,
15842,
16150,
17972,
20555,
23082,
25687,
26308,
26650,
27250,
27570,
27882,
28187,
28530,
29481,
29785,
30715,
31344,
31660,
31957,
32281,
32736,
33218,
33520,
33828,
35710,
38195,
38797,
39113,
39676,
39980,
40566,
41160] // Replace or add your full 51 notes here
};

let notes = [];
let startTime = 0;
let p = 0, g = 0, m = 0, total = 0;

let feedbackText = "";
let feedbackColor = "#FFFFFF";
let feedbackTimer = 0;

const startButtonRect = { x: WIDTH / 2 - 100, y: HEIGHT / 2 + 50, width: 200, height: 50 };
const restartButtonRect = { x: WIDTH / 2 - 80, y: 300, width: 160, height: 45 };

let mousePos = { x: 0, y: 0 };

window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
});

window.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (gameState === "START") {
        if (isInside(mousePos, startButtonRect)) startGame();
    } else if (gameState === "GAMEOVER") {
        if (isInside(mousePos, restartButtonRect)) gameState = "START";
    }
});

window.addEventListener("keydown", (e) => {
    if (gameState === "START") {
        if (e.code === "Space" || e.code === "Enter") {
            e.preventDefault();
            startGame();
        }
    } else if (gameState === "PLAYING") {
        if (e.code === "Space") {
            e.preventDefault();
            handleSpaceHit();
        }
    }
});

function isInside(pos, rect) {
    return pos.x >= rect.x && pos.x <= rect.x + rect.width &&
           pos.y >= rect.y && pos.y <= rect.y + rect.height;
}

function startGame() {
    notes = [...chart.notes];
    p = 0; g = 0; m = 0;
    feedbackText = "";
    feedbackTimer = 0;

    if (backgroundAudio) backgroundAudio.pause();
    
    if (chart.audio_file) {
        backgroundAudio = new Audio(chart.audio_file);
        backgroundAudio.play().catch(err => console.log("Audio play blocked or file missing:", err));
    }

    startTime = performance.now();
    gameState = "PLAYING";
}

function handleSpaceHit() {
    if (notes.length > 0) {
        let currentTime = performance.now() - startTime;
        let target = notes[0];
        let diff = Math.abs(currentTime - target);

        if (diff <= PERFECT_WINDOW) {
            notes.shift();
            p++;
            setFeedback("PERFECT!", "#00FF00");
        } else if (diff <= PERFECT_WINDOW * 2) {
            notes.shift();
            g++;
            setFeedback("GOOD!", "#FFFF00");
        } else {
            notes.shift();
            m++;
            setFeedback("MISS", "#FF0000");
        }
    }
}

function setFeedback(text, color) {
    feedbackText = text;
    feedbackColor = color;
    feedbackTimer = 30;
}

function mainLoop() {
    update();
    draw();
    requestAnimationFrame(mainLoop);
}

function update() {
    if (gameState === "PLAYING") {
        let currentTime = performance.now() - startTime;

        for (let i = notes.length - 1; i >= 0; i--) {
            let timeUntilHit = notes[i] - currentTime;
            let xPos = HIT_X + (timeUntilHit * NOTE_SPEED);

            if (xPos < -50) {
                notes.splice(i, 1);
                m++;
                setFeedback("MISS", "#FF0000");
            }
        }

        let musicEnded = backgroundAudio && backgroundAudio.ended;
        
        // Find the timestamp of the last note in the chart (or fallback if empty)
        let lastNoteTime = chart.notes.length > 0 ? chart.notes[chart.notes.length - 1] : 0;
        
        // End game if music finished OR if all notes are gone AND 3 seconds (3000ms) have passed since the last note
        if (musicEnded || (notes.length === 0 && currentTime > lastNoteTime + 3000)) {
            if (backgroundAudio) backgroundAudio.pause();
            total = p * 2 + g;
            gameState = "GAMEOVER";
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (gameState === "START") {
        if (startImage.complete && startImage.naturalHeight !== 0) {
            ctx.drawImage(startImage, 0, 0, WIDTH, HEIGHT);
        } else {
            ctx.fillStyle = "#333";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        let hovering = isInside(mousePos, startButtonRect);
        ctx.fillStyle = hovering ? "#A0A0A0" : "#646464";
        roundRect(ctx, startButtonRect.x, startButtonRect.y, startButtonRect.width, startButtonRect.height, 8, true);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Start Game", startButtonRect.x + startButtonRect.width / 2, startButtonRect.y + startButtonRect.height / 2);

    } else if (gameState === "PLAYING") {
        let currentTime = performance.now() - startTime;

        // Safe background draw (won't stay pitch black if image is missing)
        if (bgImage.complete && bgImage.naturalHeight !== 0) {
            ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
        } else {
            ctx.fillStyle = "#222";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }


        for (let note of notes) {
            let timeUntilHit = note - currentTime;
            let xPos = HIT_X + (timeUntilHit * NOTE_SPEED);

            if (xPos >= -50 && xPos <= WIDTH + 50) {
                ctx.fillStyle = "#E63232";
                ctx.beginPath();
                ctx.arc(xPos, HEIGHT / 2, 25, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (feedbackTimer > 0) {
            ctx.fillStyle = feedbackColor;
            ctx.font = "bold 32px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(feedbackText, HIT_X, HEIGHT / 2 - 80);
            feedbackTimer--;
        }

    } else if (gameState === "GAMEOVER") {
        ctx.fillStyle = "#1E1E1E";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("GAME OVER", WIDTH / 2, 50);

        ctx.font = "24px sans-serif";
        ctx.fillText(`PERFECT: ${p}`, WIDTH / 2, 110);
        ctx.fillText(`GOOD: ${g}`, WIDTH / 2, 150);
        ctx.fillText(`MISS: ${m}`, WIDTH / 2, 190);
        ctx.fillText(`SCORE: ${total}`, WIDTH / 2, 240);

        let hovering = isInside(mousePos, restartButtonRect);
        ctx.fillStyle = hovering ? "#00B400" : "#007800";
        roundRect(ctx, restartButtonRect.x, restartButtonRect.y, restartButtonRect.width, restartButtonRect.height, 8, true);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "20px sans-serif";
        ctx.fillText("Play Again", restartButtonRect.x + restartButtonRect.width / 2, restartButtonRect.y + restartButtonRect.height / 2);
    }
}

function roundRect(ctx, x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
}

mainLoop();