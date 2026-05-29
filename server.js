const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper to get API keys from env or request headers
const getKeys = (req) => {
  const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
  const hfKey = req.headers['x-hf-key'] || process.env.HF_API_KEY;
  return { geminiKey, hfKey };
};

// Generic Gemini Request Helper
async function callGemini(prompt, apiKey) {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Set it in .env or the Settings panel.");
  }
  
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
  if (!text) {
    throw new Error("No response content from Gemini.");
  }
  return JSON.parse(text);
}

// Generic Hugging Face Request Helper (Generates Chibi Panda and Plants)
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

// Check if keys are set in the backend environment
app.get('/api/check-keys', (req, res) => {
  const hasGemini = !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_');
  const hasHF = !!process.env.HF_API_KEY && !process.env.HF_API_KEY.includes('YOUR_');
  res.json({ gemini: hasGemini, hf: hasHF });
});

// 1. Mood Comfort Messages Generator
app.post('/api/mood-comfort', async (req, res) => {
  try {
    const { userName, pandaName, mood } = req.body;
    if (!userName || !pandaName || !mood) {
      return res.status(400).json({ error: "userName, pandaName, and mood are required." });
    }

    const { geminiKey, hfKey } = getKeys(req);

    const prompt = `You are a wholesome, gentle, and deeply empathetic digital panda named ${pandaName}. Your goal is to comfort the user named ${userName} who is feeling ${mood}. Use soft language, validate their feelings, and never be toxic or overly cheerful if they are sad.
Generate a JSON object with:
1. "greeting": A comforting, personalized greeting from the panda (e.g. "Oh, my dear friend ${userName}...").
2. "comfortMessages": An array of exactly 5 short, gentle, comforting thoughts, tasks, or validation phrases for someone feeling ${mood}.
3. "imagePrompt": A highly specific image prompt describing a cute chibi panda in a situation matching the mood ${mood} (e.g. "A panda giving a pillow a gentle punch" or "A sleeping panda wrapped in a warm pink blanket"). Do not include style descriptions.`;

    const geminiRes = await callGemini(prompt, geminiKey);
    
    // Attempt Hugging Face image generation for mood
    let imageUrl = null;
    if (geminiRes.imagePrompt) {
      imageUrl = await callHuggingFace(geminiRes.imagePrompt, hfKey);
    }

    res.json({
      greeting: geminiRes.greeting,
      comfortMessages: geminiRes.comfortMessages,
      imageUrl: imageUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Congrats message when all Wins are checked
app.post('/api/congrats', async (req, res) => {
  try {
    const { userName, pandaName } = req.body;
    const { geminiKey } = getKeys(req);

    const prompt = `You are a wholesome, gentle, and deeply empathetic digital panda named ${pandaName}. Your user ${userName} has completed all of their daily self-care goals today!
Write a deeply encouraging, warm, and comforting congratulations letter (3-4 sentences) praising their strength, effort, and reminding them how proud you are of them.
Response format: JSON object with field "congratsMessage" (string).`;

    const geminiRes = await callGemini(prompt, geminiKey);
    res.json({ congratsMessage: geminiRes.congratsMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Custom affirmations / Compliments grid refresh
app.post('/api/custom-compliment', async (req, res) => {
  try {
    const { userName } = req.body;
    const { geminiKey } = getKeys(req);

    const prompt = `You are a wholesome, gentle, and deeply empathetic digital panda. Generate exactly 10 entirely unique, deeply affirming reasons why ${userName} is amazing. Mix general affirmations with creative compliments. Keep each reason under 100 characters.
Response format: JSON object with field "reasons" (array of 10 strings).`;

    const geminiRes = await callGemini(prompt, geminiKey);
    res.json({ reasons: geminiRes.reasons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Validate Release API
app.post('/api/validate-release', async (req, res) => {
  try {
    const { releaseText, userName } = req.body;
    if (!releaseText) return res.status(400).json({ error: "Release text is required." });

    const { geminiKey } = getKeys(req);

    const prompt = `You are a wholesome, gentle, and deeply empathetic digital panda. The user named ${userName || 'Sunshine'} is writing down something heavy to let it go.
User's heavy thought: "${releaseText}".
Write one single, incredibly empathetic sentence of validation, comforting them and helping them let it go.
Response format: JSON object with a single field "validation".`;

    const geminiRes = await callGemini(prompt, geminiKey);
    res.json({ validation: geminiRes.validation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Emergency Happiness API
app.post('/api/emergency-happiness', async (req, res) => {
  try {
    const { userName, pandaName } = req.body;
    const { geminiKey, hfKey } = getKeys(req);

    const prompt = `You are a wholesome, gentle digital panda named ${pandaName}. The user ${userName || 'Sunshine'} clicked the Emergency Happiness Button! Determine what type of surprise to deliver.
Choose one of these types:
- "joke": A wholesome dad joke.
- "story": A customized short story (3-4 sentences) about you (${pandaName}) doing something cute for ${userName}.
- "quote": A newly generated motivational quote.
- "image": A cute customized image description of you doing something silly (e.g. "A happy panda sliding down a rainbow").
- "animation": An instruction for the frontend to trigger a specific CSS animation ("confetti", "warmth-pulse", "screen-shake", "bubble-burst").

Generate a JSON object with:
- "type": the selected type ("joke", "story", "quote", "image", "animation").
- "content": the text content (for joke, story, or quote) or the animation type (for animation) or the image prompt description (for image).`;

    const geminiRes = await callGemini(prompt, geminiKey);
    
    let imageUrl = null;
    if (geminiRes.type === 'image') {
      imageUrl = await callHuggingFace(geminiRes.content, hfKey);
    }

    res.json({
      type: geminiRes.type,
      content: geminiRes.content,
      imageUrl: imageUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Panda backend running on http://localhost:${PORT}`);
});

module.exports = app;
