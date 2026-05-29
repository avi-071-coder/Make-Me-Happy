// --- State Management ---
let appState = {
  userName: localStorage.getItem('panda_user_name') || '',
  pandaName: localStorage.getItem('panda_companion_name') || '',
  soundEnabled: localStorage.getItem('panda_sound_enabled') !== 'false', // default to true for synthesized SFX
  completedWins: JSON.parse(localStorage.getItem('panda_completed_wins') || '[]'),
  winsDate: localStorage.getItem('panda_wins_date') || '',
  garden: JSON.parse(localStorage.getItem('panda_garden_list') || '[]'),
  reasons: JSON.parse(localStorage.getItem('panda_reasons_cache') || '[]'),
  reasonsDate: localStorage.getItem('panda_reasons_date') || ''
};

// Local storage API keys (if user sets them)
let keys = {
  gemini: localStorage.getItem('panda_gemini_key') || '',
  hf: localStorage.getItem('panda_hf_key') || ''
};

// Backend environment keys availability check
let backendKeys = {
  gemini: false,
  hf: false
};

// --- Emojis and Efx Data ---
const gardenPlants = ['🌻', '🌷', '🍄', '🌱', '🌿', '🪴', '🌸', '🌼', '🌲', '🌳', '🌺'];

// 22 Specific Checklist items
const masterWins = [
  "Got out of bed",
  "Drank a glass of water",
  "Took my medicine / vitamins",
  "Ate a comforting meal or snack",
  "Washed my face or brushed my teeth",
  "Changed into fresh, cozy clothes",
  "Took a deep breath",
  "Unclenched my jaw & dropped my shoulders",
  "Opened a window for fresh air",
  "Listened to a favorite song",
  "Smiled at least once today",
  "Forgave myself for something",
  "Stepped outside for a moment",
  "Decluttered my immediate workspace",
  "Saved my progress and stepped away from the screen",
  "Stretched my wrists, neck, and back",
  "Rested my eyes from the blue light for a few minutes",
  "Closed unnecessary browser tabs to declutter my mind",
  "Put my phone on 'Do Not Disturb' for 15 minutes",
  "Made my bed (even just pulling the covers up)",
  "Celebrated a small learning moment or troubleshooting win",
  "Rested without feeling guilty"
];

// 75 Affirmations Master Array
const masterReasons = [
  "You keep going even when things are difficult.",
  "You make people smile.",
  "You care deeply about others.",
  "You're stronger than you realize.",
  "You have survived every difficult day so far.",
  "You bring kindness into the world.",
  "You have the patience to figure out incredibly complex problems.",
  "The things you build and create bring real value to the world.",
  "You don't give up when things are broken; you find a way to fix them.",
  "You are uniquely you.",
  "You make life brighter for others.",
  "You deserve happiness and rest.",
  "You matter more than you know.",
  "Your mind is beautifully creative.",
  "You are capable of learning and mastering hard things.",
  "You are allowed to take up space.",
  "Your best is always enough.",
  "You are allowed to rest without feeling guilty.",
  "You bring a unique perspective that no one else has.",
  "You are growing and evolving every single day.",
  "It is okay if all you did today was survive.",
  "You have a beautiful heart.",
  "You are worthy of the same compassion you give to others.",
  "Your feelings are completely valid.",
  "You are making progress, even if it feels slow.",
  "You are a safe space for the people who love you.",
  "Your presence makes a difference.",
  "You are so much more than your productivity.",
  "You have overcome obstacles that nobody else knows about.",
  "You are allowed to ask for help.",
  "You are doing a great job figuring out this messy thing called life.",
  "You are allowed to change your mind.",
  "Your capacity to logic through tough situations is admirable.",
  "You are an intricate, wonderful human being.",
  "You have a knack for turning complex ideas into reality.",
  "You bring a calming energy to chaotic situations.",
  "You are inherently valuable, just by existing.",
  "You are allowed to set boundaries to protect your peace.",
  "Your dreams and goals are worth pursuing.",
  "You are strong enough to start over as many times as you need.",
  "You light up the room just by being in it.",
  "You are allowed to be a work in progress.",
  "You have a wonderful sense of humor.",
  "You are resilient, even when you feel fragile.",
  "You are capable of creating robust, beautiful solutions.",
  "You are a good friend.",
  "You are allowed to prioritize yourself.",
  "You have a kind and gentle soul.",
  "You are so brave for facing each new day.",
  "You are more resilient than any bug or error life throws at you.",
  "You are allowed to celebrate your tiny victories.",
  "You are enough, exactly as you are.",
  "You have a brilliant mind that is constantly expanding.",
  "You are a beacon of hope for someone else.",
  "You are allowed to log off and recharge.",
  "You are making the world better just by being in it.",
  "You are capable of navigating the unknown.",
  "You are allowed to feel proud of yourself.",
  "You are a masterpiece and a work in progress simultaneously.",
  "You are loved more than you can comprehend.",
  "You have the power to create your own joy.",
  "You are allowed to take things one step at a time.",
  "You have an incredible ability to adapt and overcome.",
  "You are deserving of endless gentle moments.",
  "You are not defined by your mistakes.",
  "You are a wonderful listener.",
  "You are capable of debugging your own thoughts and finding peace.",
  "You are allowed to take the scenic route in life.",
  "You are a gift to those who know you.",
  "You are allowed to be softly, gently happy.",
  "You are building a beautiful future for yourself.",
  "You are seen, heard, and appreciated.",
  "You are doing better than you think you are.",
  "You are entirely whole, even if you feel broken.",
  "You are the sunshine in someone's day."
];

// 75 Emergency Surprises Master Array
const masterEmergencyActions = [
  "Panda does a joyful backflip.",
  "A gentle rain of pastel hearts falls down the screen.",
  'Joke: "What do you call a bear with no teeth? A gummy bear! 🐻"',
  "Panda hands you a virtual cup of hot cocoa with marshmallows.",
  "A burst of rainbow confetti fills the screen.",
  'Motivational quote: "You are doing great, sweetie."',
  "Panda tries to hula hoop and adorably fails.",
  "A flock of glowing blue butterflies flies across the screen.",
  'Joke: "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾"',
  "Panda puts on tiny sunglasses and strikes a cool pose.",
  "A soothing lo-fi chime plays with a sparkle animation.",
  'Panda holds up a sign that says "I believe in you!"',
  "Cute meme card pops up: A kitten wrapped in a purrito.",
  'Joke: "Why do programmers prefer dark mode? Because light attracts bugs! 🐛"',
  "Panda blows a giant bubblegum bubble that pops and covers its nose.",
  "A screen-shaking virtual hug from the Panda.",
  'Motivational quote: "Take a deep breath. You\'ve got this."',
  "Panda does a little happy tap dance.",
  "A wave of shooting stars crosses the background.",
  'Joke: "What do you call fake noodle? An impasta! 🍝"',
  "Panda pulls out a guitar and strums a happy chord.",
  "Cute meme card: A dog wearing a tiny hat.",
  'A shower of golden stars accompanied by a soft "DING!" sound.',
  "Panda playfully chases its own tail.",
  'Motivational quote: "Everything will be okay in the end. If it\'s not okay, it\'s not the end."',
  "Panda gets a sudden idea and a glowing lightbulb appears over its head.",
  'Joke: "Why did the math book look sad? Because of all of its problems! 📖"',
  "Panda rolls across the screen like a fluffy bowling ball.",
  "A soft, glowing aurora borealis appears at the top of the page.",
  "Cute meme card: A capybara relaxing in a hot spring.",
  "Panda pulls out a magnifying glass, inspects the screen, and smiles at you.",
  'Motivational quote: "One day at a time. One step at a time."',
  "Panda juggles three shiny apples.",
  "A cascade of pastel-colored bubbles floats upward.",
  'Joke: "What do you call a sleeping dinosaur? A dino-snore! 🦖"',
  "Panda builds a tiny, perfect block tower.",
  "Cute meme card: A hedgehog getting a belly rub.",
  "Panda magically pulls a bouquet of flowers out of nowhere and offers it to you.",
  'Motivational quote: "You are a sky full of stars."',
  "Panda does a dramatic, superhero landing.",
  "A gentle breeze sound plays while the on-screen clouds move faster.",
  'Joke: "How does a penguin build its house? Igloos it together! 🐧"',
  "Panda sneezes, and a cloud of sparkles comes out.",
  "Cute meme card: Two otters holding hands.",
  "Panda takes a big, exaggerated, relaxing stretch.",
  'Motivational quote: "Breathe in peace, exhale stress."',
  "Panda puts on a chef's hat and flips a virtual pancake perfectly.",
  "A trail of glowing fireflies follows the user's cursor for 10 seconds.",
  'Joke: "What did the ocean say to the shore? Nothing, it just waved! 🌊"',
  "Panda magically resolves a complex maze on a tiny whiteboard.",
  "Cute meme card: A red panda getting surprised.",
  "Panda paints a beautiful, messy rainbow on a canvas.",
  'Motivational quote: "Your potential is endless."',
  "Panda wraps itself in a burrito blanket and rolls away.",
  "A gentle wave of warmth (visual screen tint change to soft yellow) pulses once.",
  'Joke: "Why don\'t skeletons fight each other? They don\'t have the guts! 💀"',
  "Panda boops the screen (putting its nose right up to the camera lens).",
  "Cute meme card: A frog sitting perfectly on a lily pad.",
  "Panda does a flawless pirouette.",
  'Motivational quote: "You matter more than you know."',
  "Panda winks and gives a big, enthusiastic thumbs up.",
  "Panda types furiously on a tiny laptop, then hits 'enter' and confetti explodes.",
  "A shower of tiny bamboo leaves gently falls across the page.",
  'Joke: "What do you call cheese that isn\'t yours? Nacho cheese! 🧀"',
  "Panda tries to catch a butterfly and it lands perfectly on its nose.",
  "Cute meme card: A baby elephant taking a bath in a tub.",
  'Motivational quote: "Small steps are still progress."',
  "Panda pulls a comically large, plush heart out of its pocket.",
  "A soothing ripple effect goes across the entire webpage like a calm pond.",
  'Joke: "Why couldn\'t the bicycle stand up by itself? It was two tired! 🚲"',
  "Panda reads a tiny book, nods approvingly, and closes it.",
  "Cute meme card: A very round, fluffy bird sitting on a snowy branch.",
  "Panda meditates, and little 'Zzz' clouds float up gently.",
  'Motivational quote: "It’s okay to pause and reset."',
  "Panda joyfully jumps into a pile of autumn leaves."
];

// Local 10 comforting messages mapping per mood (Fallback)
const localMoodComforts = {
  sad: [
    "It is completely okay to feel sad. Your feelings are valuable.",
    "Give yourself permission to cry or rest today. You don't have to be strong.",
    "I am sending you the warmest panda hug right now.",
    "Even when everything feels dark, this rain will eventually pass.",
    "You are not a burden. Your feelings matter.",
    "Let's take things one very tiny step at a time.",
    "I am sitting right beside you. You are safe here.",
    "Allow yourself to feel whatever comes. No judgment.",
    "You survived today. That is already a huge victory.",
    "I believe in your strength, even when you cannot see it."
  ],
  stressed: [
    "Take a slow breath. Drop your shoulders and relax your jaw.",
    "You don't have to finish everything today. Rest is productive.",
    "Focus on this single present moment. Just one thing at a time.",
    "It is okay to close your tabs and step away from the screen.",
    "You are doing the best you can, and that is more than enough.",
    "Let's breathe together: in for 4, hold for 7, out for 8.",
    "You are capable, but you are also allowed to rest.",
    "The noise of the world can wait. Protect your peace.",
    "Drink a warm cup of water and sit quietly for a minute.",
    "One day at a time, friend. We will figure it out together."
  ],
  sick: [
    "I've wrapped you in a cozy, soft blanket. Wrap yourself up too.",
    "Rest is your body's way of healing. Don't rush it.",
    "Warm soup and soft tea are waiting for you.",
    "You don't need to be productive today. Just focus on feeling better.",
    "Sip some water. Keep warm and comfortable.",
    "It is okay if all you did today was rest and heal.",
    "I am watching over you while you sleep.",
    "Your health is the most important thing. Let everything else go.",
    "Sleep as much as you need. There is no rush.",
    "Sending healing thoughts and gentle warmth your way."
  ],
  angry: [
    "It is okay to feel angry. Anger is just a sign that you care.",
    "Punch a soft pillow or scream into it if you need to release it.",
    "Take a step away from whatever is frustrating you.",
    "Let's blow off some steam together. Take a long, slow exhale.",
    "Your anger is valid, but let's release it safely so it doesn't hurt you.",
    "It is okay to set boundaries and protect your space.",
    "Breathe out the heat, breathe in cool, calming air.",
    "You don't have to fix this situation right this second.",
    "Let's write down the anger, then shred it to pieces.",
    "I am here to listen. I won't judge your frustration."
  ],
  motivation: [
    "You are capable of doing amazing things!",
    "Look at how far you've come already. I am so proud of you.",
    "Every small step gets you closer to your goal.",
    "You are a star. Go shine at your own pace.",
    "You have the power to solve this. I believe in you!",
    "Celebrate this moment. You are growing every day.",
    "Your potential is endless. Trust your beautiful mind.",
    "Hard work is tough, but you are tougher.",
    "Go get them! But remember to rest when you are done.",
    "You've got this, Sunshine! I am cheering for you!"
  ]
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  // Wake up sleeping panda loading screen
  setTimeout(() => {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.classList.add('hidden'), 500);
    }
  }, 2200);

  initSetup();
  initAudio();
  initSettings();
  initTabs();
  initIdlePanda();
  initMoodOverlay();
  initWinsAndGarden();
  initRelease();
  initBreathing();
  initReasons();
  initEmergency();
  initParticles();

  // Validate environment key presence silently
  await checkBackendKeys();
});

// --- Check Backend Keys Presence ---
async function checkBackendKeys() {
  try {
    const res = await fetch('/api/check-keys');
    if (res.ok) {
      backendKeys = await res.json();
    }
  } catch (e) {
    console.log("Could not fetch backend keys availability.");
  }
  updateKeyWarningBanner();
}

function updateKeyWarningBanner() {
  const warningBanner = document.getElementById('keyWarning');
  const hasGemini = keys.gemini || backendKeys.gemini;
  if (!hasGemini) {
    warningBanner.classList.remove('hidden');
  } else {
    warningBanner.classList.add('hidden');
  }
}

// --- First-time Setup Modal ---
function initSetup() {
  const modal = document.getElementById('setupModal');
  const saveBtn = document.getElementById('saveSetupBtn');
  const userIn = document.getElementById('userNameInput');
  const pandaIn = document.getElementById('pandaSetupNameInput');

  // Check if we need setup
  if (!appState.userName || !appState.pandaName) {
    modal.classList.remove('hidden');
  } else {
    updateNamesOnUI();
  }

  saveBtn.addEventListener('click', () => {
    const userVal = userIn.value.trim() || 'Sunshine';
    const pandaVal = pandaIn.value.trim() || 'Barnaby';
    
    appState.userName = userVal;
    appState.pandaName = pandaVal;
    
    localStorage.setItem('panda_user_name', userVal);
    localStorage.setItem('panda_companion_name', pandaVal);
    
    updateNamesOnUI();
    modal.classList.add('hidden');
    showToast(`Welcome to your safe space, ${userVal}! ✨`);
    
    // Play warm synth sound
    playMelodySound();
  });
}

function updateNamesOnUI() {
  document.querySelectorAll('.u-name').forEach(el => el.innerText = appState.userName);
  document.querySelectorAll('.p-name').forEach(el => el.innerText = appState.pandaName);
  
  // Welcome Text
  const welcome = document.getElementById('welcomeText');
  if (welcome) {
    welcome.innerText = `Hi ${appState.userName} ☀️`;
  }
}

// --- Audio Context Synthesis ---
let audioCtx = null;
function initAudio() {
  // Enable audio context on first click
  document.body.addEventListener('click', () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, { once: true });
}

// Synthesize Sparkle/Chime sound
function playSparkleSound() {
  if (!appState.soundEnabled || !audioCtx) return;
  
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now); // A5
  osc.frequency.exponentialRampToValueAtTime(1760, now + 0.4); // A6
  
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.linearRampToValueAtTime(0.005, now + 0.5);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(now);
  osc.stop(now + 0.5);
}

// Synthesize Shredder/Crinkle Sound
function playShredderSound() {
  if (!appState.soundEnabled || !audioCtx) return;

  const now = audioCtx.currentTime;
  const duration = 1.2;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Create crackling white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000, now);
  filter.frequency.linearRampToValueAtTime(180, now + duration);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.linearRampToValueAtTime(0.001, now + duration);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noiseNode.start(now);
  noiseNode.stop(now + duration);
}

// Synthesize a comforting chime melody
function playMelodySound() {
  if (!appState.soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.15);
    gain.gain.setValueAtTime(0.08, now + idx * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + idx * 0.15);
    osc.stop(now + idx * 0.15 + 0.4);
  });
}

// --- Settings Panel ---
function initSettings() {
  const modal = document.getElementById('settingsModal');
  const openBtn = document.getElementById('settingsBtn');
  const closeBtn = document.getElementById('closeSettingsBtn');
  const saveBtn = document.getElementById('saveSettingsBtn');

  const userIn = document.getElementById('settingsUserNameInput');
  const pandaIn = document.getElementById('settingsPandaNameInput');

  openBtn.addEventListener('click', () => {
    userIn.value = appState.userName;
    pandaIn.value = appState.pandaName;
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  saveBtn.addEventListener('click', () => {
    const userVal = userIn.value.trim() || 'Sunshine';
    const pandaVal = pandaIn.value.trim() || 'Barnaby';
    
    appState.userName = userVal;
    appState.pandaName = pandaVal;
    
    localStorage.setItem('panda_user_name', userVal);
    localStorage.setItem('panda_companion_name', pandaVal);
    
    updateNamesOnUI();
    modal.classList.add('hidden');
    showToast("Names updated! ✨");
    playSparkleSound();
  });
}

function getAPIHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (keys.gemini) headers['X-Gemini-Key'] = keys.gemini;
  if (keys.hf) headers['X-HF-Key'] = keys.hf;
  return headers;
}

// --- Tab Navigation ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(cont => {
        cont.classList.remove('active');
      });
      document.getElementById(`tab-${target}`).classList.add('active');
      playSparkleSound();
    });
  });
}

// --- Idle Waving Hearts ---
function initIdlePanda() {
  const spawner = document.getElementById('heartContainer');
  // Floating hearts around panda
  setInterval(() => {
    if (document.hidden) return;
    spawnHeart(spawner);
  }, 4000);
}

function spawnHeart(parent) {
  if (!parent) return;
  const heart = document.createElement('div');
  heart.className = 'floating-heart';
  heart.innerText = ['💖', '💕', '🌸', '✨'][Math.floor(Math.random() * 4)];
  
  const offset = Math.random() * 120 - 60;
  heart.style.left = `calc(50% + ${offset}px)`;
  heart.style.bottom = '40px';
  parent.appendChild(heart);

  setTimeout(() => heart.remove(), 2500);
}

// --- Mood Overlay Page & Cards ---
function initMoodOverlay() {
  const overlay = document.getElementById('moodFullscreenOverlay');
  const closeBtn = document.getElementById('closeMoodOverlay');
  const cards = document.querySelectorAll('.mood-card');
  const effectContainer = document.getElementById('moodOverlayEffects');

  cards.forEach(card => {
    card.addEventListener('click', async () => {
      const mood = card.getAttribute('data-mood');
      await openMoodFullscreen(mood);
    });
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    effectContainer.innerHTML = '';
    playMelodySound();
  });
}

async function openMoodFullscreen(mood) {
  const overlay = document.getElementById('moodFullscreenOverlay');
  const moodImg = document.getElementById('moodPandaImg');
  const loader = document.getElementById('moodResponseLoading');
  const greetingEl = document.getElementById('moodResponseGreeting');
  const messagesList = document.getElementById('comfortMessagesList');
  const effectContainer = document.getElementById('moodOverlayEffects');

  // Reset visual layout
  overlay.className = `mood-fullscreen-overlay overlay-${mood}`;
  
  // Use the cropped panda image matching this specific mood
  moodImg.src = `images/${mood}.png`;
  
  messagesList.innerHTML = '';
  effectContainer.innerHTML = '';

  // Trigger sound
  playMelodySound();

  // Create cute background visual effects
  triggerOverlayEffects(mood, effectContainer);

  loader.classList.remove('hidden');
  greetingEl.innerText = `Connecting with ${appState.pandaName}...`;

  const hasGemini = keys.gemini || backendKeys.gemini;

  try {
    let comfortData;
    if (hasGemini) {
      const response = await fetch('/api/mood-comfort', {
        method: 'POST',
        headers: getAPIHeaders(),
        body: JSON.stringify({
          userName: appState.userName,
          pandaName: appState.pandaName,
          mood: mood
        })
      });
      if (!response.ok) throw new Error("Mood API failed");
      comfortData = await response.json();
    } else {
      // Local Fallback
      await new Promise(r => setTimeout(r, 1200));
      const fallbackMsgs = [...(localMoodComforts[mood] || localMoodComforts.sad)].sort(() => 0.5 - Math.random()).slice(0, 5);
      comfortData = {
        greeting: `Hey ${appState.userName}, ${appState.pandaName} is here to keep you company.`,
        comfortMessages: fallbackMsgs,
        imageUrl: null
      };
    }

    greetingEl.innerText = comfortData.greeting;
    comfortData.comfortMessages.forEach(msg => {
      const li = document.createElement('li');
      li.innerText = msg;
      messagesList.appendChild(li);
    });

    // If HF generates a custom image, overlay it dynamically
    if (comfortData.imageUrl) {
      moodImg.src = comfortData.imageUrl;
    }
  } catch (err) {
    console.error(err);
    showToast("Gemini offline. Using gentle fallback...");
    greetingEl.innerText = `Everything is okay, ${appState.userName}. I'm right here.`;
    const messages = [...(localMoodComforts[mood] || localMoodComforts.sad)].sort(() => 0.5 - Math.random()).slice(0, 5);
    messages.forEach(msg => {
      const li = document.createElement('li');
      li.innerText = msg;
      messagesList.appendChild(li);
    });
  } finally {
    loader.classList.add('hidden');
  }

  overlay.classList.remove('hidden');
}

function triggerOverlayEffects(mood, container) {
  if (mood === 'sad') {
    // Generate soft falling raindrops
    for (let i = 0; i < 30; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = `${Math.random() * 100}vw`;
      drop.style.top = `-${Math.random() * 50}px`;
      drop.style.animationDuration = `${Math.random() * 1.5 + 1}s`;
      drop.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(drop);
    }
  } else if (mood === 'stressed') {
    // Calming drifting clouds
    for (let i = 0; i < 5; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'cloud';
      cloud.innerText = '☁️';
      cloud.style.top = `${Math.random() * 80}vh`;
      cloud.style.left = `${Math.random() * 100}vw`;
      cloud.style.opacity = '0.2';
      cloud.style.transform = `scale(${Math.random() * 1.5 + 0.8})`;
      container.appendChild(cloud);
    }
  } else if (mood === 'angry') {
    // Floating steam puffs
    for (let i = 0; i < 15; i++) {
      const steam = document.createElement('div');
      steam.className = 'steam-puff';
      steam.innerText = '💨';
      steam.style.left = `${Math.random() * 100}vw`;
      steam.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(steam);
    }
  } else if (mood === 'motivation' || mood === 'stressed') {
    // Floating stars & sparkles
    for (let i = 0; i < 25; i++) {
      const star = document.createElement('div');
      star.className = 'particle';
      star.innerText = mood === 'motivation' ? '⭐' : '✨';
      star.style.left = `${Math.random() * 100}vw`;
      star.style.animationDuration = `${Math.random() * 5 + 5}s`;
      star.style.fontSize = `${Math.random() * 1.2 + 0.8}rem`;
      container.appendChild(star);
    }
  }
}

// --- Tiny Wins & Horizontal Comfort Garden ---
function initWinsAndGarden() {
  const resetBtn = document.getElementById('resetWinsBtn');

  // Verify date to refresh checklist daily
  const todayStr = new Date().toDateString();
  if (appState.winsDate !== todayStr) {
    appState.winsDate = todayStr;
    appState.completedWins = [];
    appState.garden = [];
    localStorage.setItem('panda_wins_date', todayStr);
    localStorage.setItem('panda_completed_wins', JSON.stringify([]));
    localStorage.setItem('panda_garden_list', JSON.stringify([]));
  }

  resetBtn.addEventListener('click', () => {
    appState.completedWins = [];
    appState.garden = [];
    localStorage.setItem('panda_completed_wins', JSON.stringify([]));
    localStorage.setItem('panda_garden_list', JSON.stringify([]));
    
    renderWinsChecklist();
    updateWinsProgress();
    renderGardenGrass();
    showToast("Checklist & garden refreshed! Let's start fresh.");
    playSparkleSound();
  });

  renderWinsChecklist();
  updateWinsProgress();
  renderGardenGrass();
}

function renderWinsChecklist() {
  const container = document.getElementById('winsChecklist');
  container.innerHTML = '';

  masterWins.forEach((win, index) => {
    const isCompleted = appState.completedWins.includes(index);
    
    const card = document.createElement('label');
    card.className = `check-item ${isCompleted ? 'completed' : ''}`;
    card.innerHTML = `
      <input type="checkbox" data-index="${index}" ${isCompleted ? 'checked disabled' : ''}>
      <span>${win}</span>
    `;

    const input = card.querySelector('input');
    input.addEventListener('change', (e) => {
      if (e.target.checked && !appState.completedWins.includes(index)) {
        appState.completedWins.push(index);
        localStorage.setItem('panda_completed_wins', JSON.stringify(appState.completedWins));
        
        card.classList.add('completed');
        input.disabled = true;

        // Visual explosions & sounds
        playSparkleSound();
        triggerConfettiBlast();
        updateWinsProgress();

        // Garden planting check (Sprout every 5 wins)
        if (appState.completedWins.length % 5 === 0) {
          sproutNewGardenPlant();
        }

        // Full check congrats
        if (appState.completedWins.length === masterWins.length) {
          triggerCongratulationsScreen();
        }
      }
    });

    container.appendChild(card);
  });
}

function updateWinsProgress() {
  const bar = document.getElementById('winsProgressBar');
  const textPercent = document.getElementById('winsProgressPercent');
  const countText = document.getElementById('winsCountText');

  const count = appState.completedWins.length;
  const percent = Math.round((count / masterWins.length) * 100);

  bar.style.width = `${percent}%`;
  textPercent.innerText = `${percent}%`;
  countText.innerText = `You've completed ${count} of ${masterWins.length} tiny wins today! So proud of you!`;
}

function triggerConfettiBlast() {
  for (let i = 0; i < 20; i++) {
    setTimeout(() => spawnParticle(['🎉', '✨', '🌸', '💖']), i * 40);
  }
}

// Sprout new plant and space perfectly side-by-side
async function sproutNewGardenPlant() {
  const dateStr = new Date().toLocaleDateString();
  let plant = {
    emoji: gardenPlants[Math.floor(Math.random() * gardenPlants.length)],
    date: dateStr,
    imageUrl: null
  };

  showToast(`🌱 A new plant sprouted in your Comfort Garden!`);

  const hasHF = keys.hf || backendKeys.hf;

  // Call HF API if key available to make a custom plant
  if (hasHF) {
    try {
      const response = await fetch('/api/mood-comfort', {
        method: 'POST',
        headers: getAPIHeaders(),
        body: JSON.stringify({
          userName: appState.userName,
          pandaName: appState.pandaName,
          mood: `plant sprout ${plant.emoji} cute kawaii illustration`
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) plant.imageUrl = data.imageUrl;
      }
    } catch (e) {
      console.log("Could not generate custom image sprite, falling back to emoji.");
    }
  }

  appState.garden.push(plant);
  localStorage.setItem('panda_garden_list', JSON.stringify(appState.garden));
  renderGardenGrass();
}

function renderGardenGrass() {
  const bed = document.getElementById('gardenBed');
  bed.innerHTML = '';

  if (appState.garden.length === 0) {
    bed.innerHTML = `<div class="empty-garden-placeholder">Start completing wins to sprout flora! (Every 5 wins)</div>`;
    return;
  }

  appState.garden.forEach(plant => {
    const item = document.createElement('div');
    item.className = 'plant-item';
    
    if (plant.imageUrl) {
      item.innerHTML = `
        <img class="plant-image" src="${plant.imageUrl}" alt="Sprout">
        <div class="plant-tooltip">Planted on ${plant.date} - You were strong on this day.</div>
      `;
    } else {
      item.innerHTML = `
        <span>${plant.emoji}</span>
        <div class="plant-tooltip">Planted on ${plant.date} - You were strong on this day.</div>
      `;
    }
    bed.appendChild(item);
  });

  // Scroll to the end
  const container = document.querySelector('.grass-bed-container');
  if (container) {
    container.scrollLeft = container.scrollWidth;
  }
}

// Congrats Modal (All 22 Wins checked)
async function triggerCongratulationsScreen() {
  const modal = document.getElementById('congratsModal');
  const textBox = document.getElementById('congratsCustomMessage');
  const closeBtn = document.getElementById('closeCongratsBtn');
  const okBtn = document.getElementById('congratsCloseBtn');
  const loader = document.getElementById('congratsLoading');

  modal.classList.remove('hidden');
  loader.classList.remove('hidden');
  textBox.innerHTML = '';

  const hasGemini = keys.gemini || backendKeys.gemini;

  try {
    let msg = "";
    if (hasGemini) {
      const res = await fetch('/api/congrats', {
        method: 'POST',
        headers: getAPIHeaders(),
        body: JSON.stringify({
          userName: appState.userName,
          pandaName: appState.pandaName
        })
      });
      if (res.ok) {
        const data = await res.json();
        msg = data.congratsMessage;
      }
    }
    
    if (!msg) {
      // Local Fallback
      await new Promise(r => setTimeout(r, 1000));
      msg = `Oh my stars, ${appState.userName}! You checked off every single win today! ${appState.pandaName} is incredibly proud of your care and dedication. Treat yourself to a warm cup of cocoa or a cozy sleep. You deserve it!`;
    }

    textBox.innerText = msg;
  } catch (e) {
    textBox.innerText = `You did it, ${appState.userName}! Every single tiny win checked off. I am so proud of you. Let's start a new checklist next time.`;
  } finally {
    loader.classList.add('hidden');
  }

  const closeModal = () => {
    modal.classList.add('hidden');
    appState.completedWins = [];
    appState.garden = [];
    localStorage.setItem('panda_completed_wins', JSON.stringify([]));
    localStorage.setItem('panda_garden_list', JSON.stringify([]));
    renderWinsChecklist();
    updateWinsProgress();
    renderGardenGrass();
    showToast("Wins and garden reset! Let's build a new collection.");
  };

  closeBtn.onclick = closeModal;
  okBtn.onclick = closeModal;
}

// --- Let It Go Box & Breathing (Tab 2) ---
function initRelease() {
  const textInput = document.getElementById('letItGoText');
  const validateBtn = document.getElementById('validateReleaseBtn');
  const shredBtn = document.getElementById('shredBtn');
  const floatBtn = document.getElementById('floatBtn');
  const validationArea = document.getElementById('releaseValidationArea');
  const validationText = document.getElementById('validationSentence');
  const loading = document.getElementById('releaseLoading');

  const shredder = document.getElementById('paperShredder');
  const shredderStrips = document.getElementById('shredderStrips');
  
  const lantern = document.getElementById('floatingLantern');
  const lanternText = document.getElementById('lanternText');

  const hasGemini = keys.gemini || backendKeys.gemini;

  validateBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
      showToast("Write down what is bothering you first.");
      return;
    }

    loading.classList.remove('hidden');
    validateBtn.disabled = true;

    try {
      let validation = "";
      if (hasGemini) {
        const res = await fetch('/api/validate-release', {
          method: 'POST',
          headers: getAPIHeaders(),
          body: JSON.stringify({ releaseText: text, userName: appState.userName })
        });
        if (res.ok) {
          const data = await res.json();
          validation = data.validation;
        }
      }
      
      if (!validation) {
        await new Promise(r => setTimeout(r, 800));
        validation = `It makes complete sense that you feel heavy from that, ${appState.userName}. Let's release it together.`;
      }

      validationText.innerText = validation;
      validationArea.classList.remove('hidden');
      shredBtn.classList.remove('hidden');
      floatBtn.classList.remove('hidden');
      playMelodySound();
    } catch (err) {
      console.error(err);
      validationText.innerText = "I hear you, friend. Let's let it go.";
      validationArea.classList.remove('hidden');
      shredBtn.classList.remove('hidden');
      floatBtn.classList.remove('hidden');
    } finally {
      loading.classList.add('hidden');
      validateBtn.disabled = false;
    }
  });

  shredBtn.addEventListener('click', () => {
    textInput.classList.add('hidden');
    shredder.classList.remove('hidden');
    
    playShredderSound();

    shredderStrips.innerHTML = '';
    for (let i = 0; i < 18; i++) {
      const strip = document.createElement('div');
      strip.className = 'paper-strip';
      strip.style.animationDelay = `${Math.random() * 0.4}s`;
      shredderStrips.appendChild(strip);
    }

    setTimeout(() => {
      textInput.value = '';
      textInput.classList.remove('hidden');
      shredder.classList.add('hidden');
      validationArea.classList.add('hidden');
      shredBtn.classList.add('hidden');
      floatBtn.classList.add('hidden');
      showToast("🗑️ Shredded! Barnaby shredded the worries away.");
    }, 1500);
  });

  floatBtn.addEventListener('click', () => {
    const textVal = textInput.value;
    textInput.classList.add('hidden');
    
    lanternText.innerText = textVal.substring(0, 30) + (textVal.length > 30 ? '...' : '');
    lantern.className = 'lantern-overlay animating-lantern-float';
    lantern.classList.remove('hidden');

    playSparkleSound();

    setTimeout(() => {
      textInput.value = '';
      textInput.classList.remove('hidden');
      lantern.classList.add('hidden');
      lantern.className = 'lantern-overlay hidden';
      validationArea.classList.add('hidden');
      shredBtn.classList.add('hidden');
      floatBtn.classList.add('hidden');
      showToast("🏮 Lantern floated peacefully into the starry sky.");
    }, 2200);
  });
}

function initBreathing() {
  const startBtn = document.getElementById('startBreathingBtn');
  const stateText = document.getElementById('breathingState');
  const timerText = document.getElementById('breathingTimer');
  const balloon = document.getElementById('pastelBalloon');

  let timerInterval = null;

  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    runBreathingLoop();
  });

  function runBreathingLoop() {
    // 1. Inhale (4s)
    stateText.innerText = "Breathe In...";
    let count = 4;
    timerText.innerText = `${count}s`;
    
    balloon.className = "pastel-balloon balloon-in";

    timerInterval = setInterval(() => {
      count--;
      if (count > 0) {
        timerText.innerText = `${count}s`;
      } else {
        clearInterval(timerInterval);
        holdPhase();
      }
    }, 1000);
  }

  function holdPhase() {
    // 2. Hold (7s)
    stateText.innerText = "Hold...";
    let count = 7;
    timerText.innerText = `${count}s`;

    balloon.className = "pastel-balloon balloon-hold";

    timerInterval = setInterval(() => {
      count--;
      if (count > 0) {
        timerText.innerText = `${count}s`;
      } else {
        clearInterval(timerInterval);
        exhalePhase();
      }
    }, 1000);
  }

  function exhalePhase() {
    // 3. Exhale (8s)
    stateText.innerText = "Exhale...";
    let count = 8;
    timerText.innerText = `${count}s`;

    balloon.className = "pastel-balloon balloon-out";

    timerInterval = setInterval(() => {
      count--;
      if (count > 0) {
        timerText.innerText = `${count}s`;
      } else {
        clearInterval(timerInterval);
        // Complete
        stateText.innerText = "Peaceful...";
        timerText.innerText = "Well done";
        balloon.className = "pastel-balloon";
        
        startBtn.style.display = 'inline-block';
        startBtn.innerText = 'Breathe Again';
      }
    }, 1000);
  }
}

// --- 10 Reasons You Are Amazing (Tab 3) ---
function initReasons() {
  const refreshBtn = document.getElementById('refreshReasonsBtn');
  refreshBtn.addEventListener('click', () => fetchNewReasons(true));

  // Determine if we need to reload from cache or select new
  const todayStr = new Date().toDateString();
  if (appState.reasons.length === 10 && appState.reasonsDate === todayStr) {
    renderReasonsGrid(appState.reasons);
  } else {
    fetchNewReasons();
  }
}

async function fetchNewReasons(force = false) {
  const grid = document.getElementById('reasonsGrid');
  const loader = document.getElementById('reasonsLoading');
  
  loader.classList.remove('hidden');
  grid.innerHTML = '';

  const hasGemini = keys.gemini || backendKeys.gemini;

  try {
    let list = [];
    if (hasGemini) {
      // Call Gemini custom compliment
      const res = await fetch('/api/custom-compliment', {
        method: 'POST',
        headers: getAPIHeaders(),
        body: JSON.stringify({ userName: appState.userName })
      });
      if (res.ok) {
        const data = await res.json();
        list = data.reasons;
      }
    }
    
    if (list.length === 0) {
      // Pull 10 random from master array
      const shuffled = [...masterReasons].sort(() => 0.5 - Math.random());
      list = shuffled.slice(0, 10);
    }

    // Cache
    appState.reasons = list;
    appState.reasonsDate = new Date().toDateString();
    localStorage.setItem('panda_reasons_cache', JSON.stringify(list));
    localStorage.setItem('panda_reasons_date', appState.reasonsDate);

    renderReasonsGrid(list);
  } catch (err) {
    console.error(err);
    const shuffled = [...masterReasons].sort(() => 0.5 - Math.random());
    renderReasonsGrid(shuffled.slice(0, 10));
  } finally {
    loader.classList.add('hidden');
  }
}

function renderReasonsGrid(reasons) {
  const grid = document.getElementById('reasonsGrid');
  grid.innerHTML = '';

  reasons.forEach((reason, index) => {
    const card = document.createElement('div');
    card.className = 'flip-card';
    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-card-front">${index + 1}</div>
        <div class="flip-card-back">${reason}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      if (card.classList.contains('flipped')) {
        playSparkleSound();
        spawnSparklesAroundCard(card);
      }
    });

    grid.appendChild(card);
  });
}

function spawnSparklesAroundCard(card) {
  for (let i = 0; i < 8; i++) {
    spawnParticle(['✨', '💖', '⭐']);
  }
}

// --- Emergency Happiness Button ---
function initEmergency() {
  const btn = document.getElementById('emergencyBtn');
  const loader = document.getElementById('emergencyLoading');
  const output = document.getElementById('emergencyOutput');
  const textContent = document.getElementById('emergencyTextContent');
  const imgCont = document.getElementById('emergencyImageContainer');
  const imgEl = document.getElementById('emergencyImg');

  const hasGemini = keys.gemini || backendKeys.gemini;

  btn.addEventListener('click', async () => {
    loader.classList.remove('hidden');
    output.classList.add('hidden');
    textContent.innerText = '';
    imgCont.classList.add('hidden');

    try {
      let data;
      if (hasGemini) {
        const response = await fetch('/api/emergency-happiness', {
          method: 'POST',
          headers: getAPIHeaders(),
          body: JSON.stringify({
            userName: appState.userName,
            pandaName: appState.pandaName
          })
        });
        if (response.ok) {
          data = await response.json();
        }
      }

      if (!data) {
        // Shuffle local 75 items
        await new Promise(r => setTimeout(r, 800));
        const itemStr = masterEmergencyActions[Math.floor(Math.random() * masterEmergencyActions.length)];
        data = parseEmergencyActionLocal(itemStr);
      }

      renderEmergencySurprise(data);
    } catch (e) {
      console.error(e);
      showToast("Surprise!");
      triggerCSSAnimation('confetti');
    } finally {
      loader.classList.add('hidden');
    }
  });

  function parseEmergencyActionLocal(actionStr) {
    if (actionStr.startsWith('Joke:')) {
      return { type: 'joke', content: actionStr.replace('Joke:', '').trim() };
    }
    if (actionStr.startsWith('Motivational quote:')) {
      return { type: 'quote', content: actionStr.replace('Motivational quote:', '').trim() };
    }
    if (actionStr.includes('confetti') || actionStr.includes('hearts') || actionStr.includes('butterflies') || actionStr.includes('bubbles') || actionStr.includes('leaves')) {
      let anim = 'confetti';
      if (actionStr.includes('butterflies')) anim = 'butterfly-swarm';
      if (actionStr.includes('bubbles')) anim = 'bubble-burst';
      if (actionStr.includes('hearts')) anim = 'hearts';
      return { type: 'animation', content: anim };
    }
    if (actionStr.includes('warmth')) {
      return { type: 'animation', content: 'warmth-pulse' };
    }
    if (actionStr.includes('screen-shaking') || actionStr.includes('VIRTUAL')) {
      return { type: 'animation', content: 'screen-shake' };
    }
    return { type: 'story', content: actionStr };
  }

  function renderEmergencySurprise(data) {
    output.classList.remove('hidden');

    if (data.type === 'joke') {
      textContent.innerText = `💬 Joke of the Day:\n\n"${data.content}"`;
      playMelodySound();
    } else if (data.type === 'story') {
      textContent.innerText = `📖 Cute Story:\n\n${data.content}`;
      playMelodySound();
    } else if (data.type === 'quote') {
      textContent.innerText = `🌸 A gentle reminder:\n\n"${data.content}"`;
      playMelodySound();
    } else if (data.type === 'image') {
      textContent.innerText = `🎨 Draw prompt: "${data.content}"`;
      if (data.imageUrl) {
        imgEl.src = data.imageUrl;
        imgCont.classList.remove('hidden');
      }
    } else if (data.type === 'animation') {
      textContent.innerText = `✨ Magic Cast: "${data.content.toUpperCase()}!"`;
      triggerCSSAnimation(data.content);
    }
  }

  function triggerCSSAnimation(type) {
    if (type === 'confetti' || type === 'butterfly-swarm' || type === 'hearts') {
      const icons = type === 'confetti' ? ['🎉', '✨', '🎈'] : (type === 'hearts' ? ['💖', '💕', '❤️'] : ['🦋', '🌸']);
      for (let i = 0; i < 40; i++) {
        setTimeout(() => spawnParticle(icons), i * 35);
      }
      playSparkleSound();
    } else if (type === 'warmth-pulse') {
      document.body.classList.add('flash-warmth');
      setTimeout(() => document.body.classList.remove('flash-warmth'), 2000);
      playMelodySound();
    } else if (type === 'screen-shake') {
      document.body.classList.add('shake-screen');
      setTimeout(() => document.body.classList.remove('shake-screen'), 500);
      playMelodySound();
    } else if (type === 'bubble-burst') {
      for (let i = 0; i < 30; i++) {
        setTimeout(() => spawnParticle(['🫧', '⚪']), i * 40);
      }
      playSparkleSound();
    }
  }
}

// --- Gentle Background Particle Spawner ---
function initParticles() {
  setInterval(() => {
    if (document.hidden) return;
    spawnParticle(['🦋', '🌸', '✨', '☁️'], true);
  }, 3500);
}

function spawnParticle(emojis = ['✨', '🌸', '💖', '⭐', '🦋'], isBackground = false) {
  const container = document.getElementById(isBackground ? 'particles-bg' : 'particles-fg');
  if (!container) return;

  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.innerText = emojis[Math.floor(Math.random() * emojis.length)];

  const randomLeft = Math.random() * 100;
  const duration = Math.random() * 5 + 8; 
  const fontSize = Math.random() * 1.5 + 0.8; 

  particle.style.left = `${randomLeft}vw`;
  particle.style.animationDuration = `${duration}s`;
  particle.style.fontSize = `${fontSize}rem`;

  if (isBackground) {
    particle.style.opacity = '0.18'; // softer drifting opacity
  }

  container.appendChild(particle);

  setTimeout(() => particle.remove(), duration * 1000);
}

// --- Toast System ---
function showToast(msg, duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
