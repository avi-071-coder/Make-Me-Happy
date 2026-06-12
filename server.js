const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const masterWinsPool = require('./server-data/wins_pool');
const moodsPool = require('./server-data/moods_pool');
const emergencyPool = require('./server-data/emergency_pool');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const USERS_FILE_PATH = path.join(__dirname, 'server-data', 'users.json');

// --- Helper Functions for File DB ---
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
      return JSON.parse(data || '{}');
    }
  } catch (err) {
    console.error("Error loading users database:", err);
  }
  return {};
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving users database:", err);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate 12 deterministic unique wins per day per user
function getDailyWinsForUser(username, dateStr) {
  const seedStr = username.toLowerCase() + dateStr;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const wins = [];
  const pool = [...masterWinsPool];
  let localHash = hash;
  for (let i = 0; i < 12; i++) {
    localHash = (localHash * 1664525 + 1013904223) | 0;
    const idx = Math.abs(localHash) % pool.length;
    wins.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return wins;
}

// Token Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <username>
  if (!token) {
    return res.status(401).json({ error: "Unauthorized access. Please log in." });
  }
  const users = loadUsers();
  const user = users[token.toLowerCase()];
  if (!user) {
    return res.status(403).json({ error: "Invalid session. Please log in again." });
  }
  req.user = user;
  req.token = token;
  next();
}

// --- Auth Endpoints ---
app.post('/api/signup', (req, res) => {
  const { username, password, confirmPassword } = req.body;
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long." });
  }

  const users = loadUsers();
  const usernameKey = username.toLowerCase();
  if (users[usernameKey]) {
    return res.status(400).json({ error: "Username already exists." });
  }

  const defaultState = {
    userName: username,
    pandaName: "Barnaby",
    completedWins: [],
    winsDate: "",
    garden: [],
    reasons: [],
    reasonsDate: "",
    xp: 0,
    level: 1,
    treeStage: "Sapling",
    memories: [],
    adventure: {
      zonesDiscovered: ["Bamboo Forest"],
      itemsInteracted: []
    },
    achievements: [],
    streak: 0,
    lastActiveDate: "",
    moodHistory: []
  };

  users[usernameKey] = {
    username: username,
    passwordHash: hashPassword(password),
    state: defaultState
  };

  saveUsers(users);

  res.json({
    message: "Registration successful!",
    token: usernameKey,
    state: defaultState
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const users = loadUsers();
  const usernameKey = username.toLowerCase();
  const user = users[usernameKey];

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(400).json({ error: "Invalid username or password." });
  }

  res.json({
    message: "Login successful!",
    token: usernameKey,
    state: user.state
  });
});

// --- State Sync Endpoints ---
app.get('/api/user/state', authenticateToken, (req, res) => {
  res.json(req.user.state);
});

app.post('/api/user/state', authenticateToken, (req, res) => {
  const users = loadUsers();
  const usernameKey = req.token.toLowerCase();
  
  if (users[usernameKey]) {
    users[usernameKey].state = {
      ...users[usernameKey].state,
      ...req.body
    };
    saveUsers(users);
    return res.json({ success: true, state: users[usernameKey].state });
  }
  res.status(400).json({ error: "User not found." });
});

// Get personalized daily wins
app.get('/api/user/daily-wins', authenticateToken, (req, res) => {
  const todayStr = new Date().toDateString();
  const wins = getDailyWinsForUser(req.user.username, todayStr);
  res.json({ date: todayStr, wins: wins });
});

// --- Helper to get API keys from env or request headers ---
const getKeys = (req) => {
  const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
  const hfKey = req.headers['x-hf-key'] || process.env.HF_API_KEY;
  const openRouterKey = req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY;
  return { geminiKey, hfKey, openRouterKey };
};

// ===========================
// AI FALLBACK CHAIN SYSTEM
// Gemini -> OpenRouter -> Hardcoded
// ===========================

// 1. Gemini
async function callGemini(prompt, apiKey) {
  if (!apiKey) throw new Error("No Gemini key");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response content from Gemini.");
  return JSON.parse(text);
}

// 2. OpenRouter
async function callOpenRouter(prompt, apiKey) {
  if (!apiKey) throw new Error("No OpenRouter key");

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://pandas-comfort-corner.app',
      'X-Title': "Panda's Comfort Corner"
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: 'You are a wholesome, gentle digital panda. Always respond in valid JSON format only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response from OpenRouter.");
  return JSON.parse(text);
}

// 3. Hugging Face Image Generator
async function callHuggingFace(prompt, hfKey) {
  if (!hfKey) return null;
  
  const modelId = "stabilityai/stable-diffusion-xl-base-1.0";
  const url = `https://api-inference.huggingface.co/models/${modelId}`;
  const basePrompt = `${prompt}, in a 2D cute vector illustration style, round chibi panda, soft pastel colors (pink, lavender, mint green), thick clean outlines, kawaii aesthetic, solid white background`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hfKey}`
      },
      body: JSON.stringify({ inputs: basePrompt })
    });

    if (!response.ok) {
      console.error(`Hugging Face error: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Hugging Face fetch failed:", error);
    return null;
  }
}

// Master AI call: tries Gemini -> OpenRouter -> returns null
async function callAI(prompt, keys) {
  // Try Gemini first
  if (keys.geminiKey) {
    try {
      console.log("[AI] Trying Gemini...");
      return await callGemini(prompt, keys.geminiKey);
    } catch (err) {
      console.error("[AI] Gemini failed:", err.message);
    }
  }

  // Try OpenRouter second
  if (keys.openRouterKey) {
    try {
      console.log("[AI] Trying OpenRouter...");
      return await callOpenRouter(prompt, keys.openRouterKey);
    } catch (err) {
      console.error("[AI] OpenRouter failed:", err.message);
    }
  }

  // All AI failed
  console.log("[AI] All providers failed. Using hardcoded fallback.");
  return null;
}

// Check if keys are set
app.get('/api/check-keys', (req, res) => {
  const hasGemini = !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_');
  const hasHF = !!process.env.HF_API_KEY && !process.env.HF_API_KEY.includes('YOUR_');
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('YOUR_');
  res.json({ gemini: hasGemini, hf: hasHF, openRouter: hasOpenRouter });
});

// ===========================
// 1. MOOD COMFORT MESSAGES
// ===========================
app.post('/api/mood-comfort', async (req, res) => {
  try {
    const { userName, pandaName, mood } = req.body;
    if (!userName || !pandaName || !mood) {
      return res.status(400).json({ error: "userName, pandaName, and mood are required." });
    }

    const keys = getKeys(req);

    const prompt = `You are a wholesome, gentle, and deeply empathetic digital panda named ${pandaName}. Your goal is to comfort the user named ${userName} who is feeling ${mood}. Use soft language, validate their feelings, and never be toxic or overly cheerful if they are sad.
    Generate a JSON object with:
    1. "greeting": A comforting, personalized greeting from the panda (e.g. "Oh, my dear friend ${userName}...").
    2. "comfortMessages": An array of exactly 5 short, gentle, comforting thoughts, tasks, or validation phrases for someone feeling ${mood}.
    3. "imagePrompt": A highly specific image prompt describing a cute chibi panda in a situation matching the mood ${mood} (e.g. "A panda giving a pillow a gentle punch" or "A sleeping panda wrapped in a warm pink blanket"). Do not include style descriptions.`;

    const aiResult = await callAI(prompt, keys);
    
    let greeting, comfortMessages, imageUrl = null;

    if (aiResult && aiResult.comfortMessages) {
      greeting = aiResult.greeting;
      comfortMessages = aiResult.comfortMessages;
      if (aiResult.imagePrompt) {
        imageUrl = await callHuggingFace(aiResult.imagePrompt, keys.hfKey);
      }
    } else {
      // HARDCODED FALLBACK
      const moodKey = moodsPool[mood] ? mood : 'Okay';
      const pool = moodsPool[moodKey];
      greeting = pool.greetings[Math.floor(Math.random() * pool.greetings.length)];
      // Pick 5 random messages
      const shuffled = [...pool.messages].sort(() => Math.random() - 0.5);
      comfortMessages = shuffled.slice(0, 5);
    }

    res.json({ greeting, comfortMessages, imageUrl });
  } catch (error) {
    // Ultimate fallback
    const moodKey = moodsPool[req.body?.mood] ? req.body.mood : 'Okay';
    const pool = moodsPool[moodKey];
    const greeting = pool.greetings[Math.floor(Math.random() * pool.greetings.length)];
    const shuffled = [...pool.messages].sort(() => Math.random() - 0.5);
    res.json({ greeting, comfortMessages: shuffled.slice(0, 5), imageUrl: null });
  }
});

// ===========================
// 2. CONGRATS MESSAGE
// ===========================
app.post('/api/congrats', async (req, res) => {
  try {
    const { userName, pandaName } = req.body;
    const keys = getKeys(req);

    const prompt = `You are a wholesome, gentle, and deeply empathetic digital panda named ${pandaName}. Your user ${userName} has completed all of their daily self-care goals today!
    Write a deeply encouraging, warm, and comforting congratulations letter (3-4 sentences) praising their strength, effort, and reminding them how proud you are of them.
    Response format: JSON object with field "congratsMessage" (string).`;

    const aiResult = await callAI(prompt, keys);
    const congratsMessage = aiResult?.congratsMessage || `${userName}, you absolute legend! You completed all your tiny wins today. Barnaby is doing backflips of joy (well, round fluffy rolls). You should be so proud — every single spark you checked off made your garden bloom a little more. Keep shining, superstar!`;
    res.json({ congratsMessage });
  } catch (error) {
    res.json({ congratsMessage: "You did it! Every tiny win counts and Barnaby is SO proud of you. Keep going, champion!" });
  }
});

// ===========================
// 3. CUSTOM AFFIRMATIONS
// ===========================
app.post('/api/custom-compliment', async (req, res) => {
  try {
    const { userName } = req.body;
    const keys = getKeys(req);

    const prompt = `You are a wholesome, gentle, and deeply empathetic digital panda. Generate exactly 10 entirely unique, deeply affirming reasons why ${userName} is amazing. Mix general affirmations with creative compliments. Keep each reason under 100 characters.
    Response format: JSON object with field "reasons" (array of 10 strings).`;

    const aiResult = await callAI(prompt, keys);
    
    if (aiResult?.reasons) {
      res.json({ reasons: aiResult.reasons });
    } else {
      // Hardcoded fallback
      const fallbackReasons = [
        "You light up every room you walk into.",
        "Your resilience is quietly heroic.",
        "The way you care about others is a superpower.",
        "You make the world softer and kinder just by existing.",
        "Your laugh could heal nations.",
        "You are someone's reason to smile today.",
        "The universe is better because you're in it.",
        "Your strength inspires people you haven't even met.",
        "You carry grace in your heart even on hard days.",
        "Barnaby thinks you're the best human ever. And he's met a lot of bamboo."
      ];
      res.json({ reasons: fallbackReasons });
    }
  } catch (error) {
    res.json({ reasons: ["You are enough.", "You are worthy of love.", "You make a difference."] });
  }
});

// ===========================
// 4. VALIDATE RELEASE (Let It Go)
// ===========================
app.post('/api/validate-release', async (req, res) => {
  try {
    const { releaseText, userName } = req.body;
    if (!releaseText) return res.status(400).json({ error: "Release text is required." });

    const keys = getKeys(req);

    const prompt = `You are a wholesome, gentle, and deeply empathetic digital panda. The user named ${userName || 'Sunshine'} is writing down something heavy to let it go.
    User's heavy thought: "${releaseText}".
    Write one single, incredibly empathetic sentence of validation, comforting them and helping them let it go.
    Response format: JSON object with a single field "validation".`;

    const aiResult = await callAI(prompt, keys);
    const validation = aiResult?.validation || "That was brave of you. Whatever you're carrying, it's okay to set it down. Barnaby is proud of you for letting go.";
    res.json({ validation });
  } catch (error) {
    res.json({ validation: "Letting go takes courage. You did something beautiful just now." });
  }
});

// ===========================
// 5. EMERGENCY HAPPINESS
// ===========================
app.post('/api/emergency-happiness', async (req, res) => {
  try {
    const { userName, pandaName } = req.body;
    const keys = getKeys(req);

    const prompt = `You are a wholesome, gentle digital panda named ${pandaName}. The user ${userName || 'Sunshine'} clicked the Emergency Happiness Button! Determine what type of surprise to deliver.
    Choose one of these types:
    - "joke": A wholesome dad joke.
    - "story": A customized short story (3-4 sentences) about you (${pandaName}) doing something cute for ${userName}.
    - "quote": A newly generated motivational quote.
    
    Response format: JSON object with:
    - "type": the selected type ("joke", "story", or "quote").
    - "content": the text content.`;

    const aiResult = await callAI(prompt, keys);
    
    if (aiResult?.content) {
      res.json({ type: aiResult.type, content: aiResult.content, imageUrl: null });
    } else {
      // HARDCODED FALLBACK: pick random type and content
      const types = ['jokes', 'stories', 'quotes', 'funFacts'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const pool = emergencyPool[chosenType];
      const content = pool[Math.floor(Math.random() * pool.length)];
      const typeMap = { jokes: 'joke', stories: 'story', quotes: 'quote', funFacts: 'funFact' };
      res.json({ type: typeMap[chosenType], content, imageUrl: null });
    }
  } catch (error) {
    const content = emergencyPool.quotes[Math.floor(Math.random() * emergencyPool.quotes.length)];
    res.json({ type: 'quote', content, imageUrl: null });
  }
});

// --- Sanctuary Progression Endpoints ---

// Helper to calculate Tree Stage based on XP
function getTreeStage(xp) {
  if (xp >= 1000) return "Ancient Magical Tree";
  if (xp >= 500) return "Lantern Tree";
  if (xp >= 200) return "Blooming Tree";
  if (xp >= 50) return "Young Tree";
  return "Sapling";
}

app.post('/api/progress/win', authenticateToken, (req, res) => {
  const { winText } = req.body;
  const users = loadUsers();
  const user = users[req.token.toLowerCase()];
  
  if (!user.state.completedWins.includes(winText)) {
    user.state.completedWins.push(winText);
    user.state.xp += 10;
    user.state.treeStage = getTreeStage(user.state.xp);
    // Add a garden flower
    const flowers = ['🌸', '🌺', '🌻', '🌼', '🌷', '🌱', '🌿', '🍄'];
    const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
    user.state.garden.push(randomFlower);
    
    saveUsers(users);
  }
  
  // Return flower bloom status
  const totalWins = user.state.completedWins.length;
  const shouldBloom = totalWins > 0 && totalWins % 5 === 0;
  res.json({ success: true, state: user.state, shouldBloom, totalWins });
});

app.post('/api/progress/memory', authenticateToken, (req, res) => {
  const { memoryText } = req.body;
  const users = loadUsers();
  const user = users[req.token.toLowerCase()];
  
  user.state.memories.push({
    text: memoryText,
    date: new Date().toISOString(),
    timesShown: 0
  });
  user.state.xp += 20;
  user.state.treeStage = getTreeStage(user.state.xp);
  
  saveUsers(users);
  res.json({ success: true, state: user.state });
});

app.post('/api/progress/mood', authenticateToken, (req, res) => {
  const { mood } = req.body;
  const users = loadUsers();
  const user = users[req.token.toLowerCase()];
  
  if (!user.state.moodHistory) user.state.moodHistory = [];
  
  user.state.moodHistory.push({
    mood: mood,
    date: new Date().toISOString()
  });
  user.state.xp += 5;
  user.state.treeStage = getTreeStage(user.state.xp);
  
  saveUsers(users);
  res.json({ success: true, state: user.state });
});

app.post('/api/progress/game', authenticateToken, (req, res) => {
  const { gameId, score } = req.body;
  const users = loadUsers();
  const user = users[req.token.toLowerCase()];
  
  const xpGained = Math.floor(score / 10);
  user.state.xp += xpGained;
  user.state.treeStage = getTreeStage(user.state.xp);
  
  saveUsers(users);
  res.json({ success: true, state: user.state, xpGained });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Panda backend running on http://localhost:${PORT}`);
});

module.exports = app;
