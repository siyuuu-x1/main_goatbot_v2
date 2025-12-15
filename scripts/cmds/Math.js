// mathgame.js
// Math game command for a messenger bot.
// Usage: user types: "mathgame" or "mathgame easy" / "mathgame hard"
// The command will send a math question and store the expected answer in usersData.
// When the user replies, call mathgame.handleReply(event, api, usersData)
// to validate the answer and update score.

// Exported module with config and onStart (command entry) + handleReply (to check user replies).

module.exports = {
  config: {
    name: "math",
    version: "1.0",
    author: "siyuuu",
    role: 0,
    shortDescription: "Simple math quiz game",
    longDescription: "Generates math problems (add/sub/mul/div) and tracks score per user.",
    category: "game",
    guide: {
      en: "{p}mathgame [easy|medium|hard]"
    }
  },

  // command entry
  onStart: async function ({ api, args, message, event, usersData }) {
    try {
      const uid = event.senderID || event.sender; // adjust depending on framework
      const difficulty = (args[0] || "easy").toLowerCase();

      // Generate question
      const { text: questionText, answer, choices } = generateQuestion(difficulty);

      // Build message (show choices for easier UX)
      let body = `🧠 *Math Game*\n\nপ্রশ্ন: ${questionText}\n\n`;
      if (choices && choices.length) {
        choices.forEach((c, i) => body += `${i + 1}. ${c}\n`);
        body += `\nউত্তর পাঠাও (সংখ্যা বা অপশন নম্বর)।\n`;
      } else {
        body += `উত্তর পাঠাও (সংখ্যা)।\n`;
      }
      body += `\nDifficulty: ${difficulty.toUpperCase()}`;

      // Save current question for this user in usersData with a short TTL
      // usersData assumed to have get and set or similar. Adjust as needed.
      const userKey = `mathgame_${uid}`;
      const now = Date.now();
      const payload = {
        question: questionText,
        answer: answer,           // canonical numeric answer
        choices: choices || null, // optional
        createdAt: now,
        expiresAt: now + 1000 * 60 * 2 // 2 minutes to answer
      };

      // read existing user data (if any)
      let udata = await usersData.get(uid) .catch(()=>null);
      if (!udata) udata = {};
      // store under our namespace
      udata.mathgame = payload;
      // initialize score if missing
      if (typeof udata.mathgameScore !== "number") udata.mathgameScore = 0;
      // save back
      await usersData.set(uid, udata);

      // send message
      await api.sendMessage(body, event.threadID || event.messageReply ? event.threadID : uid);
    } catch (err) {
      console.error("mathgame onStart error:", err);
      try { await api.sendMessage("⚠️ Mathgame চালানোর সময় ত্রুটি হয়েছে।", event.threadID); } catch(e) {}
    }
  },

  // This function should be called when a user replies with their answer.
  // Example integration: in your global onMessage, check if udata.mathgame exists and then call:
  // await require('./mathgame').handleReply(event, api, usersData)
  handleReply: async function(event, api, usersData) {
    try {
      const uid = event.senderID || event.sender;
      const threadID = event.threadID || event.thread || uid;
      const text = (event.body || event.message || "").toString().trim();

      if (!text) return; // nothing to check

      const udata = await usersData.get(uid).catch(()=>null);
      if (!udata || !udata.mathgame) {
        // nothing pending
        return;
      }

      const q = udata.mathgame;
      const now = Date.now();
      if (now > q.expiresAt) {
        // expired
        delete udata.mathgame;
        await usersData.set(uid, udata);
        return api.sendMessage("⏱️ সময় চলে গেছে। নতুন প্রশ্ন পেতে আবার `mathgame` চালাও।", threadID);
      }

      // parse user's answer (allow number, or option index)
      let userAnswer = text;
      // if user sent option number like "1" and choices exist, map it
      if (q.choices && /^\d+$/.test(userAnswer)) {
        const idx = parseInt(userAnswer, 10) - 1;
        if (idx >= 0 && idx < q.choices.length) {
          userAnswer = q.choices[idx].toString();
        }
      }

      // try numeric compare with tolerance for floats
      const expected = Number(q.answer);
      const provided = Number(userAnswer);

      const correct = !isNaN(expected) && !isNaN(provided) ?
        Math.abs(expected - provided) < 1e-6 : // exact numeric match
        String(userAnswer).toLowerCase() === String(q.answer).toLowerCase();

      if (correct) {
        // award points based on difficulty inference (question text contains operator/diff?)
        let points = 1;
        if (q.question && q.question.match(/×|×|x|\*/)) points = 2;
        // if difficulty was stored we could use it; fallback 1.
        udata.mathgameScore = (udata.mathgameScore || 0) + points;
        delete udata.mathgame;
        await usersData.set(uid, udata);
        return api.sendMessage(`✅ ঠিক — তুমি ${points} পয়েন্ট পেলো!\nমোট স্কোর: ${udata.mathgameScore}`, threadID);
      } else {
        // wrong answer
        // optionally penalize or tell correct
        const correctText = q.answer;
        delete udata.mathgame;
        await usersData.set(uid, udata);
        return api.sendMessage(`❌ দুঃখিত, ভুল উত্তর। সঠিক উত্তর ছিল: ${correctText}\nআবার চেষ্টা করতে লিখো: mathgame`, threadID);
      }
    } catch (err) {
      console.error("mathgame handleReply error:", err);
      try { await api.sendMessage("⚠️ উত্তর পরীক্ষা করার সময় ত্রুটি হয়েছে।", event.threadID); } catch(e) {}
    }
  }
};


// ---------------------- Helper functions ----------------------

function generateQuestion(difficulty = "easy") {
  // generate arithmetic problems
  // returns { text, answer, choices? }
  difficulty = difficulty.toLowerCase();
  let min = 1, max = 10, ops = ["+" , "-"];
  if (difficulty === "medium") { min = 2; max = 20; ops = ["+", "-", "*"]; }
  if (difficulty === "hard") { min = 2; max = 50; ops = ["+", "-", "*", "/"]; }

  const a = randInt(min, max);
  const b = randInt(min, max);

  const op = ops[randInt(0, ops.length - 1)];

  let text = `${a} ${op} ${b}`;
  let answer;

  switch(op) {
    case "+":
      answer = a + b;
      break;
    case "-":
      answer = a - b;
      break;
    case "*":
      answer = a * b;
      break;
    case "/":
      // make nicer division (round to 2 decimals) or ensure divisible
      if (b === 0) { answer = null; } else {
        // prefer integer if divisible, else round to 2 decimals
        if (a % b === 0) answer = a / b;
        else answer = Number((a / b).toFixed(2));
      }
      break;
    default:
      answer = a + b;
  }

  // build multiple-choice options for easier UX
  const choices = generateChoices(answer);

  return {
    text,
    answer,
    choices
  };
}

function generateChoices(correct, n = 4) {
  // if correct is not a number, skip choices
  if (correct === null || correct === undefined || isNaN(Number(correct))) return null;
  correct = Number(correct);
  const set = new Set();
  set.add(correct);
  const span = Math.max(1, Math.abs(correct) || 5);

  while (set.size < n) {
    // generate some plausible wrong answers
    const offset = randInt(1, Math.max(2, Math.round(span * 0.6)));
    const sign = Math.random() < 0.5 ? -1 : 1;
    let candidate = correct + sign * offset;

    // occasionally include small float variants if correct is float
    if (!Number.isInteger(correct) && Math.random() < 0.4) {
      candidate = Number((candidate + (Math.random() - 0.5)).toFixed(2));
    }

    set.add(candidate);
  }

  // shuffle
  const arr = Array.from(set);
  shuffle(arr);
  return arr;
}

// tiny util helpers
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
      }
