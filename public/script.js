// --- Comfort Corner | Full Feature Logic ---

let userToken = localStorage.getItem('panda_token');
let userState = null;

document.addEventListener('DOMContentLoaded', () => {
    initShader();
    initGlobalFireflies();
    
    // Auto login if token exists
    if (userToken) {
        // Skip entrance animation if already logged in? 
        // For now, let the user click "Enter" anyway, but we will auto-auth.
    }
});

// === SPA ROUTING ===
function navTo(districtId) {
    const districts = ['entrance-district', 'hub-district', 'adventure-district', 'memory-district'];
    
    districts.forEach(d => {
        const el = document.getElementById(d);
        if (el) el.classList.add('hidden-section');
    });
    
    const target = document.getElementById(districtId);
    if (target) {
        target.classList.remove('hidden-section');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const header = document.getElementById('global-header');
    const bottomNav = document.getElementById('global-bottom-nav');
    
    if (districtId === 'entrance-district') {
        if (header) header.classList.add('hidden');
        if (bottomNav) bottomNav.classList.add('hidden');
    } else {
        if (header) header.classList.remove('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');
    }
}

let currentAuthMode = 'login';

function switchAuthTab(mode) {
    currentAuthMode = mode;
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');

    if (mode === 'login') {
        tabLogin.classList.add('text-primary', 'border-secondary-container');
        tabLogin.classList.remove('text-on-surface-variant', 'border-transparent');
        
        tabSignup.classList.remove('text-primary', 'border-secondary-container');
        tabSignup.classList.add('text-on-surface-variant', 'border-transparent');
        
        formLogin.classList.remove('hidden');
        formSignup.classList.add('hidden');
    } else {
        tabSignup.classList.add('text-primary', 'border-secondary-container');
        tabSignup.classList.remove('text-on-surface-variant', 'border-transparent');
        
        tabLogin.classList.remove('text-primary', 'border-secondary-container');
        tabLogin.classList.add('text-on-surface-variant', 'border-transparent');
        
        formSignup.classList.remove('hidden');
        formLogin.classList.add('hidden');
    }
}

// === ENTRANCE & AUTHENTICATION ===
async function enterSanctuary() {
    let username, password, confirmPassword;
    let endpoint = '/api/login';
    let payload = {};

    if (currentAuthMode === 'login') {
        username = document.getElementById('loginUsername').value.trim();
        password = document.getElementById('loginPassword').value.trim();
        if (!username || !password) {
            showToast("Please enter both username and password.");
            return;
        }
        endpoint = '/api/login';
        payload = { username, password };
    } else {
        username = document.getElementById('signupUsername').value.trim();
        password = document.getElementById('signupPassword').value.trim();
        confirmPassword = document.getElementById('signupConfirm').value.trim();
        if (!username || !password || !confirmPassword) {
            showToast("Please fill all sign up fields.");
            return;
        }
        if (password !== confirmPassword) {
            showToast("Passwords do not match!");
            return;
        }
        endpoint = '/api/signup';
        payload = { username, password, confirmPassword };
    }

    const uiContainer = document.getElementById('ui-container');
    const leftGate = document.getElementById('gate-left');
    const rightGate = document.getElementById('gate-right');
    const flashOverlay = document.getElementById('flash-overlay');

    if (!uiContainer || !leftGate || !rightGate) return;

    // Call Backend
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Authentication failed");
        }

        userToken = data.token;
        userState = data.state;
        localStorage.setItem('panda_token', userToken);
        
        renderState();
        loadDailyWins();
        refreshAffirmations();

    } catch (err) {
        showToast(err.message);
        return;
    }

    // Fade out UI
    uiContainer.style.opacity = '0';
    
    // Open Gates
    setTimeout(() => {
        leftGate.classList.add('gate-transition-left');
        rightGate.classList.add('gate-transition-right');
    }, 400);

    // Flash transition
    setTimeout(() => {
        if(flashOverlay) flashOverlay.style.opacity = '1';
    }, 1800);

    // Navigate and reset
    setTimeout(() => {
        navTo('hub-district');
        showToast(`Welcome to the Sanctuary, ${username}.`);
        if(flashOverlay) flashOverlay.style.opacity = '0';
    }, 3500);
}

// === STATE RENDERING ===
let dailyWinsCache = [];

function renderState() {
    if (!userState) return;

    // Render completed count
    updateWinsCounter();

    // Render Memories
    const memoryList = document.getElementById('recent-memories-list');
    if (memoryList) {
        memoryList.innerHTML = '';
        if (userState.memories && userState.memories.length > 0) {
            userState.memories.slice().reverse().forEach(mem => {
                const div = document.createElement('div');
                div.className = 'bg-surface-container-high/50 p-4 rounded-lg border-l-4 border-secondary-container mb-4';
                const dateStr = new Date(mem.date).toLocaleDateString();
                div.innerHTML = `<p class="italic text-on-surface">"${mem.text}"</p><span class="text-label-md text-on-surface-variant block mt-2 opacity-70">— ${dateStr}</span>`;
                memoryList.appendChild(div);
            });
        }
    }

    // Render Garden
    const gardenArea = document.getElementById('comfort-garden-area');
    if (gardenArea) {
        if (userState.garden && userState.garden.length > 0) {
            gardenArea.innerHTML = '';
            userState.garden.forEach((flower, i) => {
                const f = document.createElement('span');
                f.textContent = flower;
                f.className = 'animate-bob drop-shadow-lg text-2xl';
                f.style.animationDelay = `${i * 0.2}s`;
                f.style.position = 'absolute';
                f.style.left = `${10 + Math.random() * 80}%`;
                f.style.bottom = `${10 + Math.random() * 30}%`;
                gardenArea.appendChild(f);
            });
        }
    }

    // Render Tree Stage
    const treeTitles = document.querySelectorAll('h2.font-display-lg.text-primary');
    treeTitles.forEach(t => {
        if(t.textContent === 'Memory Heart' || t.textContent.includes('Tree') || t.textContent === 'Sapling') {
            t.textContent = userState.treeStage || 'Sapling';
        }
    });
}

function updateWinsCounter() {
    const counter = document.getElementById('wins-counter');
    if (!counter || !userState) return;
    const done = userState.completedWins ? userState.completedWins.length : 0;
    counter.textContent = `${done}/12`;
}

async function loadDailyWins() {
    const data = await apiCall('/api/user/daily-wins', null, 'GET');
    if (!data || !data.wins) return;

    dailyWinsCache = data.wins;
    const list = document.getElementById('wins-checkbox-list');
    if (!list) return;
    list.innerHTML = '';

    dailyWinsCache.forEach((win, idx) => {
        const isCompleted = userState && userState.completedWins && userState.completedWins.includes(win.text);
        
        const label = document.createElement('label');
        label.className = `flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isCompleted ? 'bg-primary/10 border-secondary-container/50 opacity-60' : 'bg-surface-container-high border-outline/20 hover:border-secondary-container'}`;
        label.innerHTML = `
            <input type="checkbox" ${isCompleted ? 'checked disabled' : ''} class="w-5 h-5 accent-[#14422d] rounded cursor-pointer flex-shrink-0" data-win-idx="${idx}" />
            <span class="text-lg flex-shrink-0">${win.emoji || '✨'}</span>
            <div class="flex-1 min-w-0">
                <span class="font-body-md text-sm ${isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface'}">${win.text}</span>
                <span class="block text-[10px] text-on-surface-variant uppercase tracking-wider">${win.category}</span>
            </div>`;

        const checkbox = label.querySelector('input');
        if (!isCompleted) {
            checkbox.addEventListener('change', () => handleWinCheck(win, label, checkbox));
        }
        list.appendChild(label);
    });

    updateWinsCounter();
}

async function handleWinCheck(win, label, checkbox) {
    checkbox.disabled = true;
    label.classList.add('bg-primary/10', 'border-secondary-container/50');
    label.classList.remove('hover:border-secondary-container');
    label.querySelector('.font-body-md').classList.add('line-through', 'text-on-surface-variant');

    const res = await apiCall('/api/progress/win', { winText: win.text });

    if (res && res.success) {
        showToast("Spark logged! Tree XP +10 ✨");
        updateWinsCounter();

        // Bloom flower animation every 5 wins
        if (res.shouldBloom) {
            triggerFlowerBloom();
        }
    }
}

function triggerFlowerBloom() {
    const layer = document.getElementById('flower-anim-layer');
    if (!layer) return;

    const flowers = ['🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '💐'];
    const flower = flowers[Math.floor(Math.random() * flowers.length)];

    const el = document.createElement('div');
    el.textContent = flower;
    el.style.cssText = 'position:fixed; font-size:48px; z-index:91; pointer-events:none;';
    el.style.left = '50%';
    el.style.bottom = '20%';
    layer.appendChild(el);

    showToast("🌸 A flower blooms! Your garden is growing!");

    // Animate: grow, float up to tree
    el.animate([
        { transform: 'translate(-50%, 0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, 0) scale(1.5) rotate(20deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(-50%, -60vh) scale(0.5) rotate(360deg)', opacity: 0 }
    ], {
        duration: 3000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => el.remove();

    // Spawn extra petals
    for (let i = 0; i < 8; i++) {
        const petal = document.createElement('div');
        petal.textContent = '🌸';
        petal.style.cssText = `position:fixed; font-size:20px; pointer-events:none; left:${40+Math.random()*20}%; bottom:20%;`;
        layer.appendChild(petal);
        petal.animate([
            { transform: 'translate(0,0) scale(0)', opacity: 0 },
            { transform: `translate(${(Math.random()-0.5)*300}px, ${-200 - Math.random()*400}px) scale(1)`, opacity: 0.8, offset: 0.5 },
            { transform: `translate(${(Math.random()-0.5)*500}px, ${-500 - Math.random()*300}px) scale(0.3)`, opacity: 0 }
        ], { duration: 2500 + Math.random()*1500, easing: 'ease-out' }).onfinish = () => petal.remove();
    }
}

// === GLOBAL NOTIFICATIONS (TOASTS) ===
function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// === MODAL HELPERS ===
function showAiModalLoading() {
    const modal = document.getElementById('ai-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('ai-modal-loading').classList.remove('hidden');
    document.getElementById('ai-modal-content').classList.add('hidden');
    document.getElementById('ai-modal-image').classList.add('hidden');
}

function showAiModalContent(title, bodyHTML, imageUrl) {
    document.getElementById('ai-modal-loading').classList.add('hidden');
    const content = document.getElementById('ai-modal-content');
    content.classList.remove('hidden');
    
    document.getElementById('ai-modal-title').textContent = title;
    document.getElementById('ai-modal-body').innerHTML = bodyHTML;
    
    const img = document.getElementById('ai-modal-image');
    if (imageUrl) {
        img.src = imageUrl;
        img.classList.remove('hidden');
    } else {
        img.classList.add('hidden');
    }
}

function closeAiModal() {
    const modal = document.getElementById('ai-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function closeWinsModal() {
    const modal = document.getElementById('wins-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// === API CALL WRAPPERS ===
async function apiCall(endpoint, payload, method = 'POST') {
    if (!userToken) return null;
    try {
        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            }
        };
        if (payload && method !== 'GET') options.body = JSON.stringify(payload);
        
        const res = await fetch(endpoint, options);
        const data = await res.json();
        if (data.state) {
            userState = data.state;
            renderState();
        }
        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
}

// === MOOD CHECK-IN ===
async function logMood(mood) {
    showToast(`Mood recorded: ${mood}. Barnaby is here for you.`);
    
    // 1. Log progress XP
    await apiCall('/api/progress/mood', { mood });
    
    // 2. Fetch AI Comfort Messages
    showAiModalLoading();
    const data = await apiCall('/api/mood-comfort', {
        userName: userState?.userName || 'Traveler',
        pandaName: 'Barnaby',
        mood: mood
    });

    if (data && data.comfortMessages) {
        let html = '<ul class="text-left space-y-4">';
        data.comfortMessages.forEach(msg => {
            html += `<li class="bg-surface-container-high/50 p-4 rounded-lg border-l-4 border-secondary-container">${msg}</li>`;
        });
        html += '</ul>';
        showAiModalContent(data.greeting || "Hello there...", html, data.imageUrl);
    } else {
        showAiModalContent("Barnaby is here for you.", "<p>Sometimes words are hard, but I'm sending you a big hug.</p>");
    }
}

// === TINY WINS === (now handled by checkbox list in loadDailyWins)
function promptWin() {
    // Scroll to the checkbox list
    const list = document.getElementById('wins-checkbox-list');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// === AFFIRMATIONS ===
async function refreshAffirmations() {
    const textEl = document.getElementById('affirmation-text');
    if(!textEl) return;
    textEl.style.opacity = '0';
    
    setTimeout(async () => {
        // Try calling custom compliment
        const data = await apiCall('/api/custom-compliment', { userName: userState?.userName || 'Traveler' });
        
        let quote = "You are doing your best, and that is enough.";
        if (data && data.reasons && data.reasons.length > 0) {
            quote = data.reasons[Math.floor(Math.random() * data.reasons.length)];
        }
        
        textEl.textContent = `"${quote}"`;
        textEl.style.transition = 'opacity 1s';
        textEl.style.opacity = '1';
    }, 500);
}

// === LET IT GO BOX ===
function letItGo(method) {
    const input = document.getElementById('letItGoInput');
    if(!input || input.value.trim() === '') {
        showToast("Write something to release first.");
        return;
    }

    const text = input.value.trim();

    input.style.transition = 'all 1s ease-in-out';
    if (method === 'shred') {
        input.style.transform = 'scaleY(0) skewX(20deg)';
        input.style.opacity = '0';
        showToast("Shredded and recycled into the earth.");
    } else {
        input.style.transform = 'translateY(-100px) scale(0.5)';
        input.style.opacity = '0';
        showToast("Released to the wind.");
    }

    // Call API just for validation message
    apiCall('/api/validate-release', { releaseText: text, userName: userState?.userName || 'Traveler' }).then(data => {
        if (data && data.validation) {
            setTimeout(() => showToast(data.validation), 2000);
        }
    });

    setTimeout(() => {
        input.value = '';
        input.style.transition = 'none';
        input.style.transform = 'none';
        input.style.opacity = '1';
    }, 1500);
}

// === EMERGENCY HAPPINESS ===
async function triggerEmergencyHappiness() {
    showToast("Calling Barnaby for Emergency Happiness...");
    
    // Confetti
    for(let i=0; i<30; i++) {
        const conf = document.createElement('div');
        conf.className = 'absolute w-3 h-3 rounded-sm';
        conf.style.backgroundColor = ['#feb15d', '#8fd3c7', '#ffdcbd', '#14422d'][Math.floor(Math.random()*4)];
        conf.style.left = `${Math.random()*100}vw`;
        conf.style.top = `-10vh`;
        conf.style.zIndex = '9999';
        document.body.appendChild(conf);

        conf.animate([
            { transform: 'translate3d(0,0,0) rotate(0)', opacity: 1 },
            { transform: `translate3d(${(Math.random()-0.5)*200}px, 110vh, 0) rotate(${Math.random()*720}deg)`, opacity: 0 }
        ], {
            duration: 2000 + Math.random()*2000,
            easing: 'cubic-bezier(.37,0,.63,1)'
        }).onfinish = () => conf.remove();
    }

    showAiModalLoading();
    const data = await apiCall('/api/emergency-happiness', { userName: userState?.userName || 'Traveler', pandaName: 'Barnaby' });
    
    if (data) {
        showAiModalContent("Emergency Happiness Deployed!", `<p class="italic text-xl">"${data.content}"</p>`, data.imageUrl);
    } else {
        closeAiModal();
    }
}

// === BALLOON BREATHING ===
let breathingInterval;
function toggleBreathing() {
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');
    const icon = document.getElementById('breathing-icon');
    
    if (breathingInterval) {
        clearInterval(breathingInterval);
        breathingInterval = null;
        circle.style.transform = 'scale(1)';
        text.textContent = "Click to start";
        icon.style.opacity = '1';
        return;
    }

    let phase = 0; // 0=inhale, 1=hold, 2=exhale
    icon.style.opacity = '0';
    
    function breathCycle() {
        if (phase === 0) {
            text.textContent = "Inhale...";
            circle.style.transform = 'scale(1.5)';
            circle.style.backgroundColor = 'rgba(143, 211, 199, 0.6)'; // tertiary
            phase = 1;
        } else if (phase === 1) {
            text.textContent = "Hold...";
            phase = 2;
        } else {
            text.textContent = "Exhale...";
            circle.style.transform = 'scale(1)';
            circle.style.backgroundColor = 'rgba(254, 177, 93, 0.4)'; // secondary
            phase = 0;
        }
    }
    
    breathCycle(); // immediate start
    breathingInterval = setInterval(breathCycle, 4000);
}

// === MEMORY GROVE: FIREFLIES ===
function releaseFirefly() {
    const input = document.getElementById('memoryInput');
    const text = input ? input.value : '';
    
    if (text.trim() === '') return;

    apiCall('/api/progress/memory', { memoryText: text });

    const firefliesLayer = document.getElementById('fireflies-layer');
    if (firefliesLayer) {
        for(let i=0; i<12; i++) {
            const f = document.createElement('div');
            f.className = 'firefly-mote';
            f.style.left = `${window.innerWidth/2}px`;
            f.style.top = `${window.innerHeight - 200}px`;
            f.style.boxShadow = '0 0 20px 4px rgba(254,177,93,1)';
            firefliesLayer.appendChild(f);
            
            f.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: `translate(${(Math.random()-0.5)*800}px, -${300+Math.random()*600}px) scale(0.5)`, opacity: 0 }
            ], {
                duration: 4000 + Math.random() * 3000,
                easing: 'cubic-bezier(0.1, 0, 0.3, 1)'
            }).onfinish = () => f.remove();
        }
    }
    
    if (input) input.value = '';
    showToast("A new memory joins the grove. Tree XP +20");
}

function initGlobalFireflies() {
    const firefliesLayer = document.getElementById('fireflies-layer');
    if (!firefliesLayer) return;

    function createFirefly() {
        const firefly = document.createElement('div');
        firefly.className = 'firefly-mote';
        firefly.style.left = `${Math.random() * window.innerWidth}px`;
        firefly.style.top = `${Math.random() * window.innerHeight}px`;
        
        const size = 2 + Math.random() * 4;
        firefly.style.width = `${size}px`;
        firefly.style.height = `${size}px`;
        firefly.style.opacity = '0';
        firefliesLayer.appendChild(firefly);

        const duration = 15000 + Math.random() * 20000;
        const xMove = (Math.random() - 0.5) * 400;
        const yMove = (Math.random() - 0.5) * 400;

        const animation = firefly.animate([
            { transform: 'translate(0, 0)', opacity: 0 },
            { transform: `translate(${xMove/2}px, ${yMove/2}px)`, opacity: 0.6, offset: 0.5 },
            { transform: `translate(${xMove}px, ${yMove}px)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'ease-in-out',
            iterations: 1
        });

        animation.onfinish = () => {
            firefly.remove();
            createFirefly();
        };
    }

    for(let i=0; i < 20; i++) setTimeout(createFirefly, Math.random() * 8000);
}

// === CANVAS GAMES ===
let gameActive = false;
let gameLoopId;
let canvasCtx;
let currentGame = '';
let gameCanvas;

// Game state
let panda = {};
let collectibles = [];
let particles = [];
let bgTrees = [];
let gameTime = 0;
let gameKeys = {};

function startDumplingsGame() {
    document.getElementById('game-title').textContent = "Panda's Lost Dumplings";
    document.getElementById('game-overlay-text').textContent = "Use Arrow Keys / WASD to collect 10 Dumplings!";
    currentGame = 'dumplings';
    openGameModal();
}

function startForestAdventure() {
    document.getElementById('game-title').textContent = "Forest Firefly Hunt";
    document.getElementById('game-overlay-text').textContent = "Catch 15 glowing fireflies in the enchanted forest!";
    currentGame = 'adventure';
    openGameModal();
}

function openGameModal() {
    const modal = document.getElementById('game-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    gameCanvas = document.getElementById('game-canvas');
    canvasCtx = gameCanvas.getContext('2d');
    gameCanvas.width = gameCanvas.clientWidth;
    gameCanvas.height = gameCanvas.clientHeight;
    document.getElementById('game-overlay').style.display = 'flex';
    document.getElementById('game-start-btn').textContent = 'Play!';
    document.getElementById('game-start-btn').onclick = startGameLoop;
    gameActive = false;
}

function closeGame() {
    document.getElementById('game-modal').classList.add('hidden');
    document.getElementById('game-modal').classList.remove('flex');
    gameActive = false;
    cancelAnimationFrame(gameLoopId);
    window.removeEventListener('keydown', gameKeyDown);
    window.removeEventListener('keyup', gameKeyUp);
    if (panda.score > 0) {
        apiCall('/api/progress/game', { gameId: currentGame, score: panda.score * 10 });
        showToast(`Game Over! Earned ${panda.score * 10} XP.`);
    }
}

function gameKeyDown(e) { gameKeys[e.key.toLowerCase()] = true; e.preventDefault(); }
function gameKeyUp(e) { gameKeys[e.key.toLowerCase()] = false; }

function startGameLoop() {
    document.getElementById('game-overlay').style.display = 'none';
    const W = gameCanvas.width, H = gameCanvas.height;
    gameKeys = {};
    particles = [];
    gameTime = 0;

    // Generate background trees
    bgTrees = [];
    for (let i = 0; i < 12; i++) {
        bgTrees.push({
            x: Math.random() * W,
            h: 80 + Math.random() * 120,
            w: 15 + Math.random() * 15,
            shade: Math.random() * 0.3
        });
    }

    const targetCount = currentGame === 'dumplings' ? 10 : 15;

    panda = { x: W / 2, y: H - 60, size: 24, speed: 4.5, score: 0, targetScore: targetCount, vx: 0, vy: 0, facing: 1, bobTime: 0 };

    collectibles = [];
    for (let i = 0; i < targetCount; i++) {
        collectibles.push({
            x: 40 + Math.random() * (W - 80),
            y: 40 + Math.random() * (H - 120),
            collected: false,
            bobOffset: Math.random() * Math.PI * 2,
            glow: 0.5 + Math.random() * 0.5
        });
    }

    gameActive = true;
    window.addEventListener('keydown', gameKeyDown);
    window.addEventListener('keyup', gameKeyUp);

    function loop() {
        if (!gameActive) return;
        gameTime += 0.016;
        update(W, H);
        draw(W, H);
        gameLoopId = requestAnimationFrame(loop);
    }
    loop();
}

function update(W, H) {
    const accel = 0.6;
    const friction = 0.85;
    
    if (gameKeys['arrowleft'] || gameKeys['a']) { panda.vx -= accel; panda.facing = -1; }
    if (gameKeys['arrowright'] || gameKeys['d']) { panda.vx += accel; panda.facing = 1; }
    if (gameKeys['arrowup'] || gameKeys['w']) panda.vy -= accel;
    if (gameKeys['arrowdown'] || gameKeys['s']) panda.vy += accel;
    
    panda.vx *= friction;
    panda.vy *= friction;
    panda.x += panda.vx;
    panda.y += panda.vy;
    panda.bobTime += 0.1;

    // Bounds
    panda.x = Math.max(panda.size, Math.min(W - panda.size, panda.x));
    panda.y = Math.max(panda.size, Math.min(H - panda.size, panda.y));

    // Collisions
    collectibles.forEach(obj => {
        if (!obj.collected) {
            const dist = Math.hypot(panda.x - obj.x, panda.y - obj.y);
            if (dist < panda.size + 16) {
                obj.collected = true;
                panda.score++;
                // Burst particles
                for (let i = 0; i < 10; i++) {
                    particles.push({
                        x: obj.x, y: obj.y,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        life: 1,
                        color: currentGame === 'dumplings' ? '#feb15d' : '#8fd3c7',
                        size: 3 + Math.random() * 4
                    });
                }
            }
        }
    });

    // Update particles
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.025;
        p.size *= 0.97;
        return p.life > 0;
    });

    // Win condition
    if (panda.score >= panda.targetScore) {
        gameActive = false;
        document.getElementById('game-overlay').style.display = 'flex';
        document.getElementById('game-overlay-text').textContent = `🎉 You collected them all! Score: ${panda.score}`;
        document.getElementById('game-start-btn').textContent = 'Close & Collect XP';
        document.getElementById('game-start-btn').onclick = closeGame;
    }
}

function draw(W, H) {
    const ctx = canvasCtx;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#0a1628');
    skyGrad.addColorStop(0.5, '#14422d');
    skyGrad.addColorStop(1, '#1a5c3a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 30; i++) {
        const sx = (i * 137.5) % W;
        const sy = (i * 97.3) % (H * 0.5);
        const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(gameTime * 2 + i));
        ctx.fillStyle = `rgba(255,255,200,${twinkle * 0.6})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Moon
    ctx.fillStyle = 'rgba(255,240,200,0.9)';
    ctx.beginPath();
    ctx.arc(W - 80, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skyGrad;
    ctx.beginPath();
    ctx.arc(W - 70, 55, 28, 0, Math.PI * 2);
    ctx.fill();

    // Background bamboo trees
    bgTrees.forEach(t => {
        ctx.fillStyle = `rgba(20,66,45,${0.4 + t.shade})`;
        ctx.fillRect(t.x, H - t.h, t.w, t.h);
        // Leaves
        ctx.fillStyle = `rgba(30,90,50,${0.5 + t.shade})`;
        ctx.beginPath();
        ctx.ellipse(t.x + t.w / 2, H - t.h - 10, t.w * 1.5, 20, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Ground
    const groundGrad = ctx.createLinearGradient(0, H - 40, 0, H);
    groundGrad.addColorStop(0, '#1a5c3a');
    groundGrad.addColorStop(1, '#0d3320');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - 40, W, 40);
    // Grass tufts
    for (let i = 0; i < W; i += 12) {
        ctx.fillStyle = `rgba(40,120,60,${0.5 + Math.random() * 0.3})`;
        const gh = 5 + Math.random() * 10;
        ctx.fillRect(i, H - 40 - gh, 3, gh);
    }

    // Draw collectibles
    collectibles.forEach(obj => {
        if (obj.collected) return;
        const bob = Math.sin(gameTime * 3 + obj.bobOffset) * 4;
        const glow = obj.glow * (0.8 + 0.2 * Math.sin(gameTime * 4 + obj.bobOffset));

        if (currentGame === 'dumplings') {
            // Dumpling glow
            ctx.shadowColor = '#feb15d';
            ctx.shadowBlur = 15 * glow;
            // Dumpling body (steamed bun shape)
            ctx.fillStyle = '#fff5e6';
            ctx.beginPath();
            ctx.ellipse(obj.x, obj.y + bob, 14, 11, 0, Math.PI, 0);
            ctx.ellipse(obj.x, obj.y + bob, 14, 6, 0, 0, Math.PI);
            ctx.fill();
            // Pleats on top
            ctx.strokeStyle = '#e8c98a';
            ctx.lineWidth = 1.5;
            for (let p = -2; p <= 2; p++) {
                ctx.beginPath();
                ctx.moveTo(obj.x + p * 4, obj.y + bob - 8);
                ctx.lineTo(obj.x + p * 3, obj.y + bob - 3);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        } else {
            // Firefly
            ctx.shadowColor = '#8fd3c7';
            ctx.shadowBlur = 20 * glow;
            ctx.fillStyle = `rgba(143,211,199,${glow})`;
            ctx.beginPath();
            ctx.arc(obj.x, obj.y + bob, 8, 0, Math.PI * 2);
            ctx.fill();
            // Inner bright core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y + bob, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Panda
    drawPanda(ctx, panda.x, panda.y + Math.sin(panda.bobTime) * 2, panda.size, panda.facing);

    // HUD
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 180, 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fdf9ef';
    ctx.font = 'bold 18px Literata, serif';
    const itemName = currentGame === 'dumplings' ? '🥟 Dumplings' : '✨ Fireflies';
    ctx.fillText(`${itemName}: ${panda.score}/${panda.targetScore}`, 20, 37);

    // Progress bar
    const progress = panda.score / panda.targetScore;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(10, 55, 180, 6);
    ctx.fillStyle = currentGame === 'dumplings' ? '#feb15d' : '#8fd3c7';
    ctx.fillRect(10, 55, 180 * progress, 6);
}

function drawPanda(ctx, x, y, size, facing) {
    const s = size;
    ctx.save();
    ctx.translate(x, y);
    if (facing === -1) ctx.scale(-1, 1);

    // Body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 6, s * 0.8, s * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -s * 0.5, s * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ears
    ctx.fillStyle = '#1c1c16';
    ctx.beginPath();
    ctx.arc(-s * 0.55, -s * 1.0, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.55, -s * 1.0, s * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye patches
    ctx.fillStyle = '#1c1c16';
    ctx.beginPath();
    ctx.ellipse(-s * 0.25, -s * 0.55, s * 0.22, s * 0.18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.25, -s * 0.55, s * 0.22, s * 0.18, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (white dots)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-s * 0.22, -s * 0.55, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.22, -s * 0.55, s * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Eye pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-s * 0.20, -s * 0.53, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.24, -s * 0.53, s * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.35, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.15, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Arms (black)
    ctx.fillStyle = '#1c1c16';
    ctx.beginPath();
    ctx.ellipse(-s * 0.7, 4, s * 0.25, s * 0.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.7, 4, s * 0.25, s * 0.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, s * 0.8, s * 0.25, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.3, s * 0.8, s * 0.25, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255,180,180,0.4)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.4, -s * 0.35, s * 0.12, s * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.4, -s * 0.35, s * 0.12, s * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// === WEBGL SHADER: BACKGROUND AMBIENCE ===
function initShader() {
    const canvas = document.getElementById('shader-canvas');
    if (!canvas) return;

    function syncSize() {
        const w = canvas.clientWidth  || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width  = w;
            canvas.height = h;
        }
    }
    window.addEventListener('resize', syncSize);
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;
    
    const vs = `attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
    
    const fs = `precision highp float;
    varying vec2 v_texCoord;
    uniform float u_time;
    uniform vec2 u_resolution;

    // Simplex noise for organic movement
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.571353306247832, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 a0 = x - floor(x + 0.5);
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
        vec2 uv = v_texCoord;
        vec3 colorA = vec3(0.05, 0.12, 0.08); // Deep Forest
        vec3 colorB = vec3(0.1, 0.15, 0.25);  // Twilight Indigo
        
        float noise = snoise(uv * 2.0 + u_time * 0.1);
        vec3 color = mix(colorA, colorB, noise * 0.5 + 0.5);
        
        float firefly = 0.0;
        for(int i = 0; i < 5; i++) {
            vec2 pos = vec2(
                sin(u_time * 0.5 + float(i) * 1.5) * 0.4 + 0.5,
                cos(u_time * 0.3 + float(i) * 2.1) * 0.4 + 0.5
            );
            float dist = length(uv - pos);
            firefly += 0.001 / (dist * dist);
        }
        
        color += vec3(0.9, 0.8, 0.4) * firefly;
        gl_FragColor = vec4(color, 1.0);
    }`;

    function cs(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    function render(t) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uTime) gl.uniform1f(uTime, t * 0.001);
        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }
    
    render(0);
}
