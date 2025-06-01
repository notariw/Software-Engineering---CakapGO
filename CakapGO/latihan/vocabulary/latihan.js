function loadCSV(path, callback) {
  fetch(path)
    .then(response => response.text())
    .then(data => {
      const lines = data.trim().split("\n").slice(1);
      const items = lines.map(line => {
        const [word, target] = line.split(",");
        return { word: word.trim(), target: target.trim() };
      });
      callback(items);
    });
}

let vocabulary = [];
let remaining = [];
let current = null;
let correctCount = 0;
let answered = new Set();

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => Array(a.length + 1).fill(0));
  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function similarity(a, b) {
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

function updateProgress() {
  const total = vocabulary.length;
  const percent = (correctCount / total) * 100;
  const progressBar = document.getElementById("progress-bar");
  const progressLabel = document.getElementById("progress-label");
  progressBar.style.width = `${percent}%`;
  progressLabel.innerText = `Progress: ${percent.toFixed(2)}%`;

  // Simpan progress ke sessionStorage
  sessionStorage.setItem("progress", JSON.stringify({
    correctCount,
    answered: Array.from(answered),
    remaining,
    current
  }));
}

function loadRandomQuestion() {
  const result = document.getElementById("result");
  const input = document.getElementById("answer");

  if (remaining.length === 0) {
    result.innerText = "🎉 Semua soal telah selesai!";
    result.style.color = "blue";
    document.getElementById("question").innerText = "-";
    input.value = "";
    input.disabled = true;
    updateProgress();
    return;
  }

  const idx = Math.floor(Math.random() * remaining.length);
  current = remaining[idx];
  document.getElementById("question").innerText = current.word;
  result.innerText = "";
  input.value = "";
  input.disabled = false;
  input.focus();
}

function checkAnswer() {
  const input = document.getElementById("answer");
  const feedback = document.getElementById("result");

  if (!current) return;

  const userAnswer = input.value.trim();
  const correctAnswer = current.target;
  const score = similarity(userAnswer, correctAnswer);

  if (score >= 0.75) {
    feedback.textContent = `✅ Benar! Jawaban: "${correctAnswer}"`;
    feedback.style.color = "green";

    if (!answered.has(current.word)) {
      answered.add(current.word);
      correctCount++;
    }

    remaining = remaining.filter(item => item.word !== current.word);
    current = null;
  } else {
    feedback.textContent = `❌ Salah. Jawaban yang benar: "${correctAnswer}"`;
    feedback.style.color = "red";
  }

  input.disabled = true;
  updateProgress();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("answer").addEventListener("keydown", e => {
    if (e.key === "Enter") checkAnswer();
  });

  loadCSV("intermediate_words.csv", data => {
    vocabulary = data;

    const saved = sessionStorage.getItem("progress");

    if (saved) {
      const parsed = JSON.parse(saved);
      correctCount = parsed.correctCount;
      answered = new Set(parsed.answered);
      remaining = parsed.remaining;
      current = parsed.current;
      document.getElementById("question").innerText = current ? current.word : "-";
    } else {
      remaining = [...vocabulary];
      correctCount = 0;
      answered.clear();
      loadRandomQuestion();
    }

    updateProgress();
  });
});
