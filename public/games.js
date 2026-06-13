// ==========================================
// SANCTUARY MINI-GAMES V4 (Requested Fixes)
// ==========================================

let gameCanvasCtx = null;
let gameW = 0;
let gameH = 0;
let activeGameLoop = null;
let currentActiveGame = null;
let keys = {};
let mouse = { x: 0, y: 0, down: false };

// Global assets
const pandaImg = new Image();
pandaImg.src = '/assets/barnaby_sprite.png';

window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function haltGame() {
    if (activeGameLoop) {
        cancelAnimationFrame(activeGameLoop);
        clearTimeout(activeGameLoop);
        activeGameLoop = null;
    }
    currentActiveGame = null;
    
    // Remove old listeners to prevent memory leaks
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        const clone = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(clone, canvas);
        
        // Re-attach mouse listeners for generic tracking
        clone.addEventListener('mousedown', e => {
            const rect = clone.getBoundingClientRect();
            mouse.x = (e.clientX - rect.left) * (clone.width / rect.width);
            mouse.y = (e.clientY - rect.top) * (clone.height / rect.height);
            mouse.down = true;
            if (currentActiveGame && currentActiveGame.onMouseDown) currentActiveGame.onMouseDown(mouse.x, mouse.y);
        });
        clone.addEventListener('mousemove', e => {
            const rect = clone.getBoundingClientRect();
            mouse.x = (e.clientX - rect.left) * (clone.width / rect.width);
            mouse.y = (e.clientY - rect.top) * (clone.height / rect.height);
            if (currentActiveGame && currentActiveGame.onMouseMove) currentActiveGame.onMouseMove(mouse.x, mouse.y);
        });
        clone.addEventListener('mouseup', () => { 
            mouse.down = false; 
            if (currentActiveGame && currentActiveGame.onMouseUp) currentActiveGame.onMouseUp();
        });
        clone.addEventListener('mouseleave', () => { 
            mouse.down = false; 
            if (currentActiveGame && currentActiveGame.onMouseUp) currentActiveGame.onMouseUp();
        });
        
        // Touch support!
        clone.addEventListener('touchstart', e => {
            const rect = clone.getBoundingClientRect();
            mouse.x = (e.touches[0].clientX - rect.left) * (clone.width / rect.width);
            mouse.y = (e.touches[0].clientY - rect.top) * (clone.height / rect.height);
            mouse.down = true;
            if (currentActiveGame && currentActiveGame.onMouseDown) currentActiveGame.onMouseDown(mouse.x, mouse.y);
        });
        clone.addEventListener('touchmove', e => {
            e.preventDefault(); // Prevent scrolling while playing
            const rect = clone.getBoundingClientRect();
            mouse.x = (e.touches[0].clientX - rect.left) * (clone.width / rect.width);
            mouse.y = (e.touches[0].clientY - rect.top) * (clone.height / rect.height);
            if (currentActiveGame && currentActiveGame.onMouseMove) currentActiveGame.onMouseMove(mouse.x, mouse.y);
        }, {passive: false});
        clone.addEventListener('touchend', () => {
            mouse.down = false; 
            if (currentActiveGame && currentActiveGame.onMouseUp) currentActiveGame.onMouseUp();
        });
    }
}

// Function to draw the user's custom panda image with free animation
function drawCustomPanda(ctx, x, y, size, moving, facingRight) {
    if (!pandaImg.complete || pandaImg.naturalWidth === 0) return; // Fallback if not loaded
    
    ctx.save();
    ctx.translate(x, y);
    
    // Animation: Bobbing and rotating based on movement
    let bob = 0;
    let rot = 0;
    if (moving) {
        bob = Math.abs(Math.sin(Date.now() * 0.015)) * 10;
        rot = Math.sin(Date.now() * 0.01) * 0.15;
    } else {
        bob = Math.sin(Date.now() * 0.003) * 3; // Breathing
    }
    
    ctx.translate(0, -bob);
    ctx.rotate(rot);
    
    if (!facingRight) {
        ctx.scale(-1, 1);
    }
    
    // Draw the image centered
    const aspect = pandaImg.height / pandaImg.width;
    const w = size * 2;
    const h = (size * 2) * aspect;
    ctx.drawImage(pandaImg, -w/2, -h/2, w, h);
    ctx.restore();
}

// ==========================================
// GAME 1: DUMPLING DASH (Free Roam Arcade)
// ==========================================
class DumplingDash {
    constructor(canvasId) {
        const canvas = document.getElementById(canvasId);
        this.ctx = canvas.getContext('2d');
        this.W = canvas.width;
        this.H = canvas.height;
        
        this.loaded = false;
        this.bgImg = new Image();
        this.bgImg.src = '/assets/dumpling_dash_bg.png';
        this.bgImg.onload = () => { this.loaded = true; };

        // Continuous movement properties
        this.panda = { 
            x: this.W/2, y: this.H/2, 
            vx: 4, vy: 0, // Starts moving right automatically
            speed: 4,     // Constant normal speed
            size: 40,
            facingRight: true
        };
        
        this.dumplings = [];
        this.score = 0;
        this.particles = [];
        
        // Spawn 5 initial dumplings
        for(let i=0; i<5; i++) this.spawnDumpling();
    }

    spawnDumpling() {
        // Keep dumplings away from the edges
        const padding = 100;
        const x = padding + Math.random() * (this.W - padding * 2);
        const y = padding + Math.random() * (this.H - padding * 2);
        
        const r = Math.random();
        let type = 'normal';
        if (r > 0.9) type = 'rainbow';
        else if (r > 0.7) type = 'golden';
        
        this.dumplings.push({
            x: x, y: y,
            type: type,
            bobOffset: Math.random() * Math.PI * 2,
            life: 600 // Disappears after a while to encourage "dashing"
        });
    }

    update() {
        if (!this.loaded) return;

        const p = this.panda;
        
        // Steering input (Keyboard instantly changes direction)
        if (keys['arrowleft'] || keys['a']) { p.vx = -p.speed; p.vy = 0; p.facingRight = false; }
        if (keys['arrowright'] || keys['d']) { p.vx = p.speed; p.vy = 0; p.facingRight = true; }
        if (keys['arrowup'] || keys['w']) { p.vx = 0; p.vy = -p.speed; }
        if (keys['arrowdown'] || keys['s']) { p.vx = 0; p.vy = p.speed; }

        // Touch/Mouse follow logic (Steer towards tap)
        if (mouse.down) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.hypot(dx, dy);
            // Only change direction if the tap isn't exactly where Barnaby already is
            if (dist > 10) {
                p.vx = (dx / dist) * p.speed;
                p.vy = (dy / dist) * p.speed;
                p.facingRight = dx > 0;
            }
        }

        // Apply constant movement
        p.x += p.vx;
        p.y += p.vy;
        p.moving = true; // Always moving

        // Boundaries: Bounce off walls so he doesn't get stuck!
        if (p.x <= p.size) { p.x = p.size; p.vx = Math.abs(p.vx); p.facingRight = true; }
        if (p.x >= this.W - p.size) { p.x = this.W - p.size; p.vx = -Math.abs(p.vx); p.facingRight = false; }
        if (p.y <= p.size) { p.y = p.size; p.vy = Math.abs(p.vy); }
        if (p.y >= this.H - p.size) { p.y = this.H - p.size; p.vy = -Math.abs(p.vy); }

        // Dumpling logic
        for (let i = this.dumplings.length - 1; i >= 0; i--) {
            let d = this.dumplings[i];
            d.life--;
            
            // Check collision with Barnaby
            const dist = Math.hypot(p.x - d.x, p.y - d.y);
            if (dist < p.size + 20) {
                // Collect!
                let pts = 1;
                if (d.type === 'golden') pts = 5;
                if (d.type === 'rainbow') pts = 10;
                this.score += pts;
                
                // Burst particles
                for(let j=0; j<15; j++) {
                    this.particles.push({
                        x: d.x, y: d.y,
                        vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15,
                        life: 1,
                        color: d.type === 'rainbow' ? `hsl(${Math.random()*360}, 100%, 70%)` : (d.type === 'golden' ? '#ffd700' : '#fff')
                    });
                }
                
                this.dumplings.splice(i, 1);
                this.spawnDumpling(); // Spawn a new one immediately
            } else if (d.life <= 0) {
                // Dumpling expired, fade away
                this.dumplings.splice(i, 1);
                this.spawnDumpling();
            }
        }

        // Particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.03;
            return p.life > 0;
        });
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);

        if (!this.loaded) {
            ctx.fillStyle = '#1c2e24'; ctx.fillRect(0,0,this.W,this.H);
            return;
        }

        ctx.drawImage(this.bgImg, 0, 0, this.W, this.H);
        ctx.fillStyle = 'rgba(0, 20, 10, 0.2)';
        ctx.fillRect(0, 0, this.W, this.H);

        // Draw Dumplings
        this.dumplings.forEach(d => {
            const bob = Math.sin(Date.now()*0.005 + d.bobOffset)*6;
            ctx.save();
            ctx.translate(d.x, d.y + bob);
            
            // Flicker if expiring soon
            if (d.life < 100 && Math.floor(d.life / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }

            ctx.shadowBlur = 15;
            if (d.type === 'golden') { ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; }
            else if (d.type === 'rainbow') { ctx.fillStyle = `hsl(${Date.now()%360}, 100%, 70%)`; ctx.shadowColor = ctx.fillStyle; }
            else { ctx.fillStyle = '#fff5e6'; ctx.shadowColor = 'white'; }

            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI*2);
            ctx.fill();
            
            // Expiration circle
            if (d.life < 300) {
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 30, -Math.PI/2, -Math.PI/2 + (d.life/300) * Math.PI*2);
                ctx.stroke();
            }
            
            ctx.restore();
        });

        // Draw Particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw Player (Using Custom Image)
        drawCustomPanda(ctx, this.panda.x, this.panda.y, this.panda.size, this.panda.moving, this.panda.facingRight);

        // UI
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath(); ctx.roundRect(20, 20, 200, 50, 10); ctx.fill();
        ctx.fillStyle = '#fdf9ef'; ctx.font = 'bold 24px Literata'; ctx.textAlign = 'left';
        ctx.fillText(`🥟 Score: ${this.score}`, 40, 53);
    }

    loop() {
        this.update();
        this.draw();
        activeGameLoop = requestAnimationFrame(() => this.loop());
    }

    start() { this.loop(); }
}

// ==========================================
// GAME 2: RAINBOW PAINTER (Coloring Book)
// ==========================================
class RainbowPainter {
    constructor(canvasId) {
        const canvas = document.getElementById(canvasId);
        this.ctx = canvas.getContext('2d');
        this.W = canvas.width;
        this.H = canvas.height;
        
        this.outlineImg = new Image();
        this.fetchAIPage();
        
        // Offscreen canvas for the user's paint
        this.paintCanvas = document.createElement('canvas');
        this.paintCanvas.width = this.W;
        this.paintCanvas.height = this.H;
        this.paintCtx = this.paintCanvas.getContext('2d');
        
        // Fill paint canvas with white initially
        this.paintCtx.fillStyle = '#ffffff';
        this.paintCtx.fillRect(0, 0, this.W, this.H);

        this.score = 0;
        this.lastMouse = { x: -1, y: -1 };
        this.brushSize = 25;
        this.currentColor = '#ffb3ba'; // Pastel Red
        
        // Vibrant & Cozy palette
        this.palette = [
            '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', // vibrant
            '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', // pastels
            '#e8baff', '#ffc9de', '#000000', '#ffffff'             // specials
        ];
    }

    async fetchAIPage() {
        this.outlineImg.onload = () => { this.loaded = true; };
        this.outlineImg.onerror = () => { 
            console.error("Failed to load AI image. Using fallback.");
            if (this.outlineImg.src !== window.location.origin + '/assets/coloring_page_hq_1.png') {
                this.outlineImg.src = '/assets/coloring_page_hq_1.png'; 
            }
        };

        try {
            const res = await fetch('/api/game/coloring-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.userToken || localStorage.getItem('panda_token') || ''}`
                }
            });
            const data = await res.json();
            this.outlineImg.src = data.imageUrl;
        } catch (err) {
            console.error("API Error fetching coloring page:", err);
            this.outlineImg.src = '/assets/coloring_page_hq_1.png';
        }
    }

    onMouseDown(mx, my) {
        // Check if clicked palette
        const pw = 60; const ph = 60; const pad = 10;
        const totalW = this.palette.length * pw + (this.palette.length - 1) * pad;
        const startX = this.W / 2 - totalW / 2;
        const y = this.H - 80;

        for (let i = 0; i < this.palette.length; i++) {
            const x = startX + i * (pw + pad);
            if (mx > x && mx < x + pw && my > y && my < y + ph) {
                this.currentColor = this.palette[i];
                // Play particle effect
                return;
            }
        }
    }

    onMouseMove(mx, my) {
        if (!mouse.down || !this.loaded) return;
        
        // Don't paint if interacting with palette
        if (my > this.H - 100) return;

        // Draw onto the paint canvas
        this.paintCtx.lineJoin = 'round';
        this.paintCtx.lineCap = 'round';
        this.paintCtx.lineWidth = this.brushSize;
        this.paintCtx.strokeStyle = this.currentColor;
        
        this.paintCtx.beginPath();
        if (this.lastMouse.x === -1) {
            this.paintCtx.moveTo(mx, my);
            this.paintCtx.lineTo(mx + 0.1, my + 0.1);
        } else {
            this.paintCtx.moveTo(this.lastMouse.x, this.lastMouse.y);
            this.paintCtx.lineTo(mx, my);
        }
        this.paintCtx.stroke();

        this.lastMouse = { x: mx, y: my };
        
        if (Math.random() < 0.05) this.score += 1;
    }

    onMouseUp() {
        this.lastMouse = { x: -1, y: -1 };
    }

    update() {}

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);

        if (!this.loaded) {
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,this.W,this.H);
            ctx.fillStyle = '#333'; ctx.font = '24px Literata'; ctx.textAlign = 'center';
            ctx.fillText("Barnaby is fetching the art supplies...", this.W/2, this.H/2);
            return;
        }

        // Draw the user's painted canvas
        ctx.drawImage(this.paintCanvas, 0, 0);

        // Draw the black line art OVER the paint using Multiply
        // Multiply makes white transparent and black opaque
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        // Scale and center the line art
        const scale = Math.min(this.W / this.outlineImg.width, (this.H - 120) / this.outlineImg.height);
        const w = this.outlineImg.width * scale;
        const h = this.outlineImg.height * scale;
        const x = (this.W - w) / 2;
        const y = (this.H - 100 - h) / 2; // Leave room for palette
        
        ctx.drawImage(this.outlineImg, x, y, w, h);
        ctx.restore();

        // UI - Palette
        const pw = 60; const ph = 60; const pad = 10;
        const totalW = this.palette.length * pw + (this.palette.length - 1) * pad;
        const startX = this.W / 2 - totalW / 2;
        const py = this.H - 80;

        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.roundRect(startX - 20, py - 20, totalW + 40, ph + 40, 20); ctx.fill();

        for (let i = 0; i < this.palette.length; i++) {
            const px = startX + i * (pw + pad);
            
            if (this.currentColor === this.palette[i]) {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(px + pw/2, py + ph/2, pw/2 + 5, 0, Math.PI*2); ctx.stroke();
            }
            
            ctx.fillStyle = this.palette[i];
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 5;
            ctx.beginPath(); ctx.arc(px + pw/2, py + ph/2, pw/2, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            
            // "Eraser" text for white
            if (this.palette[i] === '#ffffff') {
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial'; ctx.textAlign = 'center';
                ctx.fillText('Eraser', px + pw/2, py + ph/2 + 4);
            }
        }
    }

    loop() {
        this.update();
        this.draw();
        activeGameLoop = requestAnimationFrame(() => this.loop());
    }

    start() { this.loop(); }
}

// ==========================================
// GAME 3: PANDA CAFE (Fixed)
// ==========================================
class PandaCafe {
    constructor(canvasId) {
        const canvas = document.getElementById(canvasId);
        this.ctx = canvas.getContext('2d');
        this.W = canvas.width;
        this.H = canvas.height;
        
        this.loaded = false;
        this.bgImg = new Image();
        this.bgImg.src = '/assets/panda_cafe_bg.png';
        this.bgImg.onload = () => { this.loaded = true; };

        // Adjusted coordinates for 1280x720 internal resolution
        this.seats = [
            { x: this.W * 0.2, y: this.H * 0.6, customer: null },
            { x: this.W * 0.4, y: this.H * 0.65, customer: null },
            { x: this.W * 0.6, y: this.H * 0.65, customer: null },
            { x: this.W * 0.8, y: this.H * 0.6, customer: null }
        ];

        this.items = ['🍵 Tea', '🥟 Dumpling', '🍪 Cookie'];
        
        this.barnaby = {
            x: this.W / 2, y: this.H * 0.8,
            holding: null,
            targetX: this.W / 2,
            moving: false,
            facingRight: true
        };

        this.score = 0;
        this.spawnTimer = 0;
        this.particles = [];
    }

    spawnCustomer() {
        const emptySeats = this.seats.filter(s => s.customer === null);
        if (emptySeats.length === 0) return;
        
        const seat = emptySeats[Math.floor(Math.random() * emptySeats.length)];
        const types = ['🐰 Bunny', '🦊 Fox', '🐦 Bird', '🐢 Turtle'];
        
        seat.customer = {
            type: types[Math.floor(Math.random() * types.length)],
            order: this.items[Math.floor(Math.random() * this.items.length)],
            patience: 1.0,
            bobOffset: Math.random() * Math.PI * 2
        };
    }

    update() {
        if (!this.loaded) return;

        // Move Barnaby smoothly
        const dx = this.barnaby.targetX - this.barnaby.x;
        this.barnaby.x += dx * 0.08;
        this.barnaby.moving = Math.abs(dx) > 5;
        if (this.barnaby.moving) this.barnaby.facingRight = dx > 0;

        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            this.spawnCustomer();
            this.spawnTimer = 120 + Math.random() * 120; // Faster spawns
        }

        this.seats.forEach(seat => {
            if (seat.customer) {
                seat.customer.patience -= 0.001;
                if (seat.customer.patience <= 0) {
                    seat.customer = null;
                }
            }
        });

        this.particles = this.particles.filter(p => {
            p.y -= 2; p.life -= 0.02;
            return p.life > 0;
        });
    }

    onMouseDown(mx, my) {
        if (!this.loaded) return;

        // Check if clicking kitchen items (scaled correctly)
        const btnW = 160; const btnH = 80;
        const startX = this.W/2 - (this.items.length * btnW + (this.items.length-1)*20)/2;
        
        for(let i=0; i<this.items.length; i++) {
            const bx = startX + i * (btnW + 20);
            const by = this.H - 120;
            if (mx > bx && mx < bx + btnW && my > by && my < by + btnH) {
                this.barnaby.holding = this.items[i];
                return;
            }
        }

        // Check if clicking customer
        this.seats.forEach(seat => {
            if (seat.customer) {
                const dist = Math.hypot(mx - seat.x, my - seat.y);
                if (dist < 120) {
                    this.barnaby.targetX = seat.x;
                    if (this.barnaby.holding === seat.customer.order) {
                        this.score += 15;
                        this.barnaby.holding = null;
                        for(let i=0; i<5; i++) {
                            this.particles.push({
                                x: seat.x + (Math.random()-0.5)*40,
                                y: seat.y - 40,
                                text: '❤️', life: 1
                            });
                        }
                        seat.customer = null;
                    }
                }
            }
        });
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);

        if (!this.loaded) return;

        ctx.drawImage(this.bgImg, 0, 0, this.W, this.H);
        ctx.fillStyle = 'rgba(30, 10, 0, 0.4)'; // Dimmer for UI pop
        ctx.fillRect(0,0,this.W,this.H);

        this.seats.forEach(seat => {
            if (seat.customer) {
                const c = seat.customer;
                const bob = Math.sin(Date.now() * 0.005 + c.bobOffset) * 5;
                
                ctx.font = '60px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(c.type.split(' ')[0], seat.x, seat.y + bob);

                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.roundRect(seat.x - 60, seat.y - 120 + bob, 120, 60, 15); ctx.fill();
                ctx.fillStyle = '#000'; ctx.font = '30px Arial';
                ctx.fillText(c.order.split(' ')[0], seat.x, seat.y - 80 + bob);

                ctx.fillStyle = '#333';
                ctx.fillRect(seat.x - 40, seat.y + 30, 80, 10);
                ctx.fillStyle = c.patience > 0.4 ? '#4caf50' : '#f44336';
                ctx.fillRect(seat.x - 40, seat.y + 30, 80 * c.patience, 10);
            }
        });

        // Use custom panda!
        drawCustomPanda(ctx, this.barnaby.x, this.barnaby.y, 60, this.barnaby.moving, this.barnaby.facingRight);
        
        if (this.barnaby.holding) {
            ctx.font = '50px Arial';
            ctx.fillText(this.barnaby.holding.split(' ')[0], this.barnaby.x + 40, this.barnaby.y - 20);
        }

        const btnW = 160; const btnH = 80;
        const startX = this.W/2 - (this.items.length * btnW + (this.items.length-1)*20)/2;
        
        this.items.forEach((item, i) => {
            const bx = startX + i * (btnW + 20);
            const by = this.H - 120;
            
            ctx.fillStyle = this.barnaby.holding === item ? '#ffb4ab' : '#93000a';
            ctx.beginPath(); ctx.roundRect(bx, by, btnW, btnH, 20); ctx.fill();
            
            ctx.fillStyle = this.barnaby.holding === item ? '#410002' : '#ffdad6';
            ctx.font = 'bold 28px Literata'; ctx.textAlign = 'center';
            ctx.fillText(item, bx + btnW/2, by + 50);
        });

        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.font = '40px Arial';
            ctx.fillText(p.text, p.x, p.y);
        });
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath(); ctx.roundRect(20, 20, 260, 60, 15); ctx.fill();
        ctx.fillStyle = '#ffdad6'; ctx.font = 'bold 30px Literata'; ctx.textAlign = 'left';
        ctx.fillText(`☕ Tips: ${this.score}`, 40, 60);
    }

    loop() {
        this.update();
        this.draw();
        activeGameLoop = requestAnimationFrame(() => this.loop());
    }

    start() { this.loop(); }
}

window.startDumplingDash = function() {
    document.getElementById('game-modal').classList.remove('hidden');
    document.getElementById('game-modal').classList.add('flex');
    document.getElementById('game-title').innerText = "Dumpling Dash";
    document.getElementById('game-overlay').classList.remove('hidden');
    document.getElementById('game-overlay-text').innerText = "Run or tap to collect as many dumplings as you can!";
    
    const startBtn = document.getElementById('game-start-btn');
    startBtn.onclick = () => {
        document.getElementById('game-overlay').classList.add('hidden');
        haltGame();
        const canvas = document.getElementById('game-canvas');
        canvas.width = 1280; canvas.height = 720;
        currentActiveGame = new DumplingDash('game-canvas');
        currentActiveGame.start();
    };
};

window.startRainbowPainter = function() {
    document.getElementById('game-modal').classList.remove('hidden');
    document.getElementById('game-modal').classList.add('flex');
    document.getElementById('game-title').innerText = "Rainbow Painter";
    document.getElementById('game-overlay').classList.remove('hidden');
    document.getElementById('game-overlay-text').innerText = "Tap a color and draw to bring the art to life!";
    
    const startBtn = document.getElementById('game-start-btn');
    startBtn.onclick = () => {
        document.getElementById('game-overlay').classList.add('hidden');
        haltGame();
        const canvas = document.getElementById('game-canvas');
        canvas.width = 1280; canvas.height = 720;
        currentActiveGame = new RainbowPainter('game-canvas');
        currentActiveGame.start();
    };
};

window.startPandaCafe = function() {
    document.getElementById('game-modal').classList.remove('hidden');
    document.getElementById('game-modal').classList.add('flex');
    document.getElementById('game-title').innerText = "Panda Cafe";
    document.getElementById('game-overlay').classList.remove('hidden');
    document.getElementById('game-overlay-text').innerText = "Tap food, then tap a customer to serve them!";
    
    const startBtn = document.getElementById('game-start-btn');
    startBtn.onclick = () => {
        document.getElementById('game-overlay').classList.add('hidden');
        haltGame();
        const canvas = document.getElementById('game-canvas');
        canvas.width = 1280; canvas.height = 720;
        currentActiveGame = new PandaCafe('game-canvas');
        currentActiveGame.start();
    };
};

window.closeGame = function() {
    haltGame();
    document.getElementById('game-modal').classList.add('hidden');
    document.getElementById('game-modal').classList.remove('flex');
};

window.getActiveGameScore = function() {
    return currentActiveGame ? currentActiveGame.score : 0;
};
