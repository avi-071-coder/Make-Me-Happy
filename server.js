const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const masterWinsPool = require('./server-data/wins_pool');
const moodsPool = require('./server-data/moods_pool');
const emergencyPool = require('./server-data/emergency_pool');
const reasonsPool = require('./server-data/reasons_pool');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const os = require('os');
let USERS_FILE_PATH;
try {
  // Test if local __dirname is writable (local dev)
  const testPath = path.join(__dirname, 'server-data', '.test');
  if (!fs.existsSync(path.join(__dirname, 'server-data'))) {
    fs.mkdirSync(path.join(__dirname, 'server-data'), { recursive: true });
  }
  fs.writeFileSync(testPath, 'test');
  fs.unlinkSync(testPath);
  USERS_FILE_PATH = path.join(__dirname, 'server-data', 'users.json');
} catch (e) {
  // Read-only fs (Netlify/Vercel/Lambda)
  USERS_FILE_PATH = path.join(os.tmpdir(), 'users.json');
}

let memoryUsers = null;
let blobStore = null;

async function getBlobStore() {
  if (blobStore) return blobStore;
  if (process.env.NETLIFY || process.env.NETLIFY_IMAGES_CDN_DOMAIN || process.env.SITE_ID) {
    try {
      const { getStore } = require('@netlify/blobs');
      blobStore = getStore('comfort-corner-db');
      return blobStore;
    } catch (e) {
      console.warn("Netlify Blobs not available, falling back to local file database:", e.message);
    }
  }
  return null;
}

async function loadUsers() {
  const store = await getBlobStore();
  if (store) {
    try {
      const data = await store.getJSON('users_db');
      memoryUsers = data || {};
      return memoryUsers;
    } catch (err) {
      console.error("Error loading users from Netlify Blobs:", err);
    }
  }

  if (memoryUsers) return memoryUsers;
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
      memoryUsers = JSON.parse(data || '{}');
      return memoryUsers;
    }
  } catch (err) {
    console.error("Error loading users database:", err);
  }
  memoryUsers = {};
  return memoryUsers;
}

async function saveUsers(users) {
  memoryUsers = users;
  const store = await getBlobStore();
  if (store) {
    try {
      await store.setJSON('users_db', users);
      return;
    } catch (err) {
      console.error("Error saving users to Netlify Blobs:", err);
    }
  }

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
function getDailyWinsForUser(username, dateStr, offset = 0) {
  const seedStr = username.toLowerCase() + dateStr + offset;
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

const defaultState = (username) => ({
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
});

// Token Auth Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <username>
  if (!token) {
    return res.status(401).json({ error: "Unauthorized access. Please log in." });
  }
  const users = await loadUsers();
  const tokenKey = token.toLowerCase();
  
  if (!users[tokenKey]) {
    // NETLIFY SERVERLESS FIX: Since lambdas are stateless and requests hit random containers,
    // if a user's memory state is lost, we auto-create it so the app doesn't break!
    users[tokenKey] = {
      username: token,
      passwordHash: hashPassword("dummy"), // dummy password
      state: defaultState(token)
    };
    await saveUsers(users);
  }
  
  req.user = users[tokenKey];
  req.token = token;
  next();
}

// --- Auth Endpoints ---
app.post('/api/signup', async (req, res) => {
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

  const users = await loadUsers();
  const usernameKey = username.toLowerCase();
  if (users[usernameKey]) {
    return res.status(400).json({ error: "Username already exists." });
  }

  const state = defaultState(username);

  users[usernameKey] = {
    username: username,
    passwordHash: hashPassword(password),
    state: state
  };

  await saveUsers(users);

  res.json({
    message: "Registration successful!",
    token: usernameKey,
    state: state
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const users = await loadUsers();
  const usernameKey = username.toLowerCase();
  let user = users[usernameKey];

  if (!user) {
    // NETLIFY SERVERLESS FIX: If database was wiped/cold-started and user doesn't exist,
    // we auto-create/re-register the user with the provided credentials.
    const state = defaultState(username);
    users[usernameKey] = {
      username: username,
      passwordHash: hashPassword(password),
      state: state
    };
    await saveUsers(users);
    user = users[usernameKey];
  } else if (user.passwordHash !== hashPassword(password)) {
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

app.post('/api/user/state', authenticateToken, async (req, res) => {
  const users = await loadUsers();
  const usernameKey = req.token.toLowerCase();
  
  if (users[usernameKey]) {
    users[usernameKey].state = {
      ...users[usernameKey].state,
      ...req.body
    };
    await saveUsers(users);
    return res.json({ success: true, state: users[usernameKey].state });
  }
  res.status(400).json({ error: "User not found." });
});

// Get personalized daily wins
app.get('/api/user/daily-wins', authenticateToken, (req, res) => {
  const todayStr = new Date().toDateString();
  const offset = req.user.state.winRefreshCount || 0;
  const wins = getDailyWinsForUser(req.user.username, todayStr, offset);
  res.json({ date: todayStr, wins: wins });
});

// Refresh daily wins
app.post('/api/user/refresh-wins', authenticateToken, async (req, res) => {
  const users = await loadUsers();
  const user = users[req.token.toLowerCase()];
  
  user.state.completedWins = []; // clear completed list
  user.state.winRefreshCount = (user.state.winRefreshCount || 0) + 1; // increase offset
  await saveUsers(users);

  res.json({ success: true, state: user.state });
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

// --- Utility for timeouts ---
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// 1. Gemini
async function callGemini(prompt, apiKey) {
  if (!apiKey) throw new Error("No Gemini key");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    timeout: 15000, // 15 seconds — Gemini is our only working provider, give it time
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


// Master AI call: Gemini is the only working provider right now.
// OpenRouter = no credits (402), HF = DNS blocked on this network.
// If you add credits to OpenRouter or switch networks, re-enable them below.
async function callAI(prompt, keys) {
  // Try Gemini (confirmed working — ~2.5s avg response time)
  if (keys.geminiKey) {
    try {
      console.log("[AI] Trying Gemini...");
      return await callGemini(prompt, keys.geminiKey);
    } catch (err) {
      console.error("[AI] Gemini failed:", err.message);
    }
  }

  // All AI failed — use hardcoded fallback
  console.log("[AI] Gemini unavailable. Using hardcoded fallback.");
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
// GENERATE COLORING PAGE
// Uses 19 pre-generated beautiful, high-quality vector-style AI coloring pages
// ===========================
app.post('/api/game/coloring-page', (req, res) => {
  const numPages = 19;
  const randIndex = Math.floor(Math.random() * numPages) + 1;
  const imageUrl = `/assets/coloring_page_hq_${randIndex}.png`;
  res.json({ imageUrl });
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
// 6. 10 REASONS WHY YOU ARE AMAZING
// ===========================
app.post('/api/reasons-why', authenticateToken, async (req, res) => {
  try {
    const { userName, pandaName } = req.body;
    const keys = getKeys(req);

    const prompt = `You are a wholesome digital panda named ${pandaName}. The user ${userName || 'Sunshine'} wants to know why they are amazing. Generate exactly 10 short, deeply heartwarming, and comforting reasons why ${userName || 'Sunshine'} is amazing and loved. 
    Response format: JSON object with:
    - "reasons": An array of exactly 10 strings.`;

    const aiResult = await callAI(prompt, keys);
    
    if (aiResult?.reasons && Array.isArray(aiResult.reasons) && aiResult.reasons.length >= 1) {
      res.json({ reasons: aiResult.reasons.slice(0, 10) });
    } else {
      throw new Error("AI failed to return valid reasons array");
    }
  } catch (error) {
    // HARDCODED FALLBACK
    const pool = [...reasonsPool];
    const reasons = [];
    for (let i = 0; i < 10; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      reasons.push(pool[idx]);
      pool.splice(idx, 1);
    }
    res.json({ reasons });
  }
});

app.get('/api/random-reason', (req, res) => {
  const pool = [...reasonsPool];
  const idx = Math.floor(Math.random() * pool.length);
  res.json({ reason: pool[idx] });
});

// ===========================
// 7. EMERGENCY HAPPINESS
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

app.post('/api/progress/win', authenticateToken, async (req, res) => {
  const { winText } = req.body;
  const users = await loadUsers();
  const user = users[req.token.toLowerCase()];
  
  if (!user.state.completedWins.includes(winText)) {
    user.state.completedWins.push(winText);
    user.state.xp += 10;
    user.state.treeStage = getTreeStage(user.state.xp);
    // Add a garden flower
    const flowers = ['🌸', '🌺', '🌻', '🌼', '🌷', '🌱', '🌿', '🍄'];
    const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
    user.state.garden.push(randomFlower);
    
    await saveUsers(users);
  }
  
  // Return flower bloom status
  const totalWins = user.state.completedWins.length;
  const shouldBloom = totalWins > 0 && totalWins % 5 === 0;
  res.json({ success: true, state: user.state, shouldBloom, totalWins });
});

app.post('/api/progress/memory', authenticateToken, async (req, res) => {
  const { memoryText } = req.body;
  const users = await loadUsers();
  const user = users[req.token.toLowerCase()];
  
  user.state.memories.push({
    text: memoryText,
    date: new Date().toISOString(),
    timesShown: 0
  });
  user.state.xp += 20;
  user.state.treeStage = getTreeStage(user.state.xp);
  
  await saveUsers(users);
  res.json({ success: true, state: user.state });
});

app.post('/api/progress/mood', authenticateToken, async (req, res) => {
  const { mood } = req.body;
  const users = await loadUsers();
  const user = users[req.token.toLowerCase()];
  
  if (!user.state.moodHistory) user.state.moodHistory = [];
  
  user.state.moodHistory.push({
    mood: mood,
    date: new Date().toISOString()
  });
  user.state.xp += 5;
  user.state.treeStage = getTreeStage(user.state.xp);
  
  await saveUsers(users);
  res.json({ success: true, state: user.state });
});

app.post('/api/progress/game', authenticateToken, async (req, res) => {
  const { gameId, score } = req.body;
  const users = await loadUsers();
  const user = users[req.token.toLowerCase()];
  
  const xpGained = Math.floor(score / 10);
  user.state.xp += xpGained;
  user.state.treeStage = getTreeStage(user.state.xp);
  
  await saveUsers(users);
  res.json({ success: true, state: user.state, xpGained });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Panda backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
