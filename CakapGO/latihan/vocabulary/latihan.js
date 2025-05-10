
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
    let current = null;

    function levenshtein(a, b) {
      const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
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

    function loadRandomQuestion() {
      current = vocabulary[Math.floor(Math.random() * vocabulary.length)];
      document.getElementById("question").innerText = current.word;
      document.getElementById("result").innerText = "";
      document.getElementById("answer").value = "";
    }

    function checkAnswer() {
      const input = document.getElementById("answer").value.trim();
      const sim = similarity(input, current.target);
      const result = document.getElementById("result");
      if (sim >= 0.75) {
        result.innerText = `✅ Benar! (${(sim * 100).toFixed(0)}% mirip)`;
        result.style.color = "green";
      } else {
        result.innerText = `❌ Coba lagi. Hint: ${current.target} (${(sim * 100).toFixed(0)}%)`;
        result.style.color = "red";
      }
      setTimeout(loadRandomQuestion, 3000);
    }

    loadCSV("vocabulary.csv", data => {
      vocabulary = data;
      loadRandomQuestion();
    });
