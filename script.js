/* === UI & NAVIGATION === */
function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    menu.classList.toggle("open");
}

function showPage(id) {
    // Hide current page
    document.querySelectorAll(".page").forEach(p => {
        p.style.opacity = '0';
        setTimeout(() => p.classList.remove("active"), 200);
    });

    // Update Nav
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    
    // Desktop Nav
    const activeNav = document.querySelector(`.desktop-nav a[onclick="showPage('${id}')"]`);
    if(activeNav) activeNav.classList.add("active");

    // Show new page with delay for smooth transition
    setTimeout(() => {
        const newPage = document.getElementById(id);
        newPage.classList.add("active");
        newPage.style.opacity = '0';
        requestAnimationFrame(() => {
            newPage.style.transition = 'opacity 0.4s ease';
            newPage.style.opacity = '1';
        });
        
        // Close mobile menu if open
        document.getElementById("mobileMenu").classList.remove("open");
    }, 200);
}

function scrollToDetails() {
    document.getElementById("details").scrollIntoView({ behavior: "smooth" });
}

/* === THEME ENGINE === */
const themeBtn = document.querySelector('.theme-toggle');
const sunIcon = document.querySelector('.sun');
const moonIcon = document.querySelector('.moon');

function applyTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light-theme');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        localStorage.setItem('theme', 'dark');
    }
}

themeBtn.addEventListener('click', () => {
    const isLight = !document.body.classList.contains('light-theme');
    applyTheme(isLight);
});

// Init Theme
const savedTheme = localStorage.getItem('theme');
applyTheme(savedTheme === 'light');

/* === ANIMATION OBSERVER === */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            entry.target.style.opacity = 1;
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


/* === BACKGROUND PARTICLES === */
const canvas = document.getElementById('bg-particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
        ctx.fillStyle = document.body.classList.contains('light-theme') ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    resizeCanvas();
    particles = [];
    for (let i = 0; i < 50; i++) particles.push(new Particle());
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', initParticles);
initParticles();
animateParticles();


/* === LOGIC: COMPRESSION & QR === */
const buf2hex = buffer => [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
function hex2buf(hex) {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
}

async function generate() {
    const errEl = document.getElementById("error");
    const resContainer = document.getElementById("result-container");
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    
    errEl.classList.add("hidden");
    resContainer.classList.add("hidden");

    const data = [
        document.getElementById("name").value.trim().replace(/\|/g, "/"),
        document.getElementById("phone").value.trim().replace(/\|/g, "/"),
        document.getElementById("email").value.trim().replace(/\|/g, "/"),
        document.getElementById("message").value.trim().replace(/\|/g, "/")
    ];

    if (!data[0] || !data[1] || !data[2]) {
        errEl.textContent = "Будь ласка, заповніть обов'язкові поля";
        errEl.classList.remove("hidden");
        return;
    }

    // UI Loading State
    btnText.style.display = 'none';
    loader.classList.remove('hidden');
    loader.style.display = 'block';

    // Simulate async work for UI feedback
    await new Promise(r => setTimeout(r, 600));

    const rawData = data.join("|");

    try {
        const compressedB64 = LZString.compressToBase64(rawData);
        const hex = buf2hex(LZString.compressToUint8Array(rawData));
        const numeric = BigInt('0x' + hex).toString();

        // Verification Logic (hidden)
        const qrTempDiv = document.createElement("div");
        new QRCode(qrTempDiv, { 
            text: "TSK:" + compressedB64, 
            width: 400, height: 400, 
            correctLevel: QRCode.CorrectLevel.L 
        });

        setTimeout(() => {
            const canvas = document.getElementById("verifyCanvas");
            const ctx = canvas.getContext("2d");
            const img = qrTempDiv.querySelector("img");
            
            if (!img) throw new Error("QR Generation failed");

            canvas.width = 400; canvas.height = 400;
            ctx.drawImage(img, 0, 0, 400, 400);
            
            const decoded = jsQR(ctx.getImageData(0, 0, 400, 400).data, 400, 400);

            if (decoded) {
                document.getElementById("encoded").textContent = numeric;
                const finalQr = document.getElementById("qrcode");
                finalQr.innerHTML = "";
                new QRCode(finalQr, { 
                    text: "TSK:" + compressedB64, 
                    width: 200, height: 200, 
                    correctLevel: QRCode.CorrectLevel.L,
                    colorDark : "#000000",
                    colorLight : "#ffffff"
                });
                resContainer.classList.remove("hidden");
            } else {
                errEl.textContent = "Помилка: Об'єм даних перевищує ліміт QR-коду";
                errEl.classList.remove("hidden");
            }
            
            // Restore Button
            btnText.style.display = 'block';
            loader.style.display = 'none';

        }, 100);
    } catch (e) { 
        errEl.textContent = "Системна помилка обробки даних";
        errEl.classList.remove("hidden");
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
}

function decode(customVal = null) {
    const resDiv = document.getElementById("decoded");
    try {
        const val = customVal || document.getElementById("inputDecode").value.replace(/\s/g, '').trim();
        if (!val) return;

        let rawString = "";

        if (val.startsWith("TSK:")) {
            rawString = LZString.decompressFromBase64(val.substring(4));
        } else {
            const bigIntVal = BigInt(val);
            let hex = bigIntVal.toString(16);
            if (hex.length % 2) hex = '0' + hex;
            rawString = LZString.decompressFromUint8Array(hex2buf(hex));
        }

        if (!rawString) throw new Error();

        const p = rawString.split("|");
        resDiv.innerHTML = `
            <div style="display:grid; gap:10px;">
                <div><strong>Ім'я:</strong> ${p[0] || '-'}</div>
                <div><strong>Телефон:</strong> ${p[1] || '-'}</div>
                <div><strong>Email:</strong> ${p[2] || '-'}</div>
                <div style="background:var(--bg-color); padding:10px; border-radius:4px; margin-top:5px;">
                    ${p.slice(3).join("|") || '-'}
                </div>
            </div>
        `;
        resDiv.classList.remove("hidden");
    } catch(e) { 
        resDiv.innerHTML = "<span style='color:#ef4444'>❌ Невірний формат даних або пошкоджений ключ</span>";
        resDiv.classList.remove("hidden");
    }
}

function decodeQR(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width; canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
            
            if (code) {
                document.getElementById("inputDecode").value = code.data;
                decode(code.data);
                // Switch tab visual feedback
                document.getElementById("inputDecode").scrollIntoView({behavior: "smooth"});
            } else {
                alert("QR-код не знайдено на зображенні");
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function copyKeyword() {
    const text = document.getElementById("encoded").textContent;
    navigator.clipboard.writeText(text);
    const btn = document.querySelector('.copy-btn');
    const originalText = btn.textContent;
    btn.textContent = "Скопійовано!";
    setTimeout(() => btn.textContent = originalText, 2000);
}

function downloadQR() {
    const img = document.querySelector("#qrcode img");
    if (img) {
        const link = document.createElement("a");
        link.href = img.src;
        link.download = "ts-key-secure.png";
        link.click();
    }
}