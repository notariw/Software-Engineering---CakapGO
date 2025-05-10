function speech() {
    const promptText = "The quick brown fox jumps over the lazy dog";
    const startBtn = document.getElementById("startBtn");
    const timerDisplay = document.getElementById("timer");
    const resultDiv = document.getElementById("result");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support Speech Recognition.");
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let countdown;
      let timeLeft = 10;

      function startTimer() {
        timerDisplay.textContent = `Time left: ${timeLeft}s`;
        countdown = setInterval(() => {
          timeLeft--;
          timerDisplay.textContent = `Time left: ${timeLeft}s`;
          if (timeLeft <= 0) {
            clearInterval(countdown);
            recognition.stop();
            timerDisplay.textContent = "Time's up!";
          }
        }, 1000);
      }

      recognition.onstart = () => {
        startBtn.disabled = true;
        resultDiv.textContent = "Listening...";
        timeLeft = 10;
        startTimer();
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resultDiv.textContent = `Transcript: ${transcript}`;

        // Optional: score by comparing with prompt
        const similarity = levenshteinScore(promptText.toLowerCase(), transcript.toLowerCase());
        resultDiv.textContent += `\nScore: ${similarity}%`;
      };

      recognition.onerror = (event) => {
        resultDiv.textContent = "Error: " + event.error;
        startBtn.disabled = false;
        clearInterval(countdown);
      };

      recognition.onend = () => {
        startBtn.disabled = false;
        clearInterval(countdown);
      };

      startBtn.onclick = () => {
        recognition.start();
      };

      // Levenshtein percentage similarity (custom scoring)
      function levenshteinScore(a, b) {
        const distance = levenshtein(a, b);
        const maxLength = Math.max(a.length, b.length);
        const score = ((1 - distance / maxLength) * 100).toFixed(2);
        return score;
      }

      // Levenshtein distance function
      function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
              dp[i - 1][j] + 1,
              dp[i][j - 1] + 1,
              dp[i - 1][j - 1] + cost
            );
          }
        }
        return dp[m][n];
      }
    }
}