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
        resDiv.innerHTML = "<span style='color:#ef4444'> ✖ Невірний формат даних або пошкоджений ключ</span>";
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

/* === CART SYSTEM & DELIVERY LOGIC === */

let cart = JSON.parse(localStorage.getItem('tsCart')) || [];

// База даних "товарів" (ключі які будуть видаватися)
const productsDB = {
    "Звичайна": "7816988721857890554983058694508505188299509882728604721523965548373750013828321560398288896594773729429581093935990264045924654401558247770696690524322759482725539420624865471696138726373828187971114843825019105624122581020496291954860042432660575220200093328561765069785960679490598150249624427593852176718586842705065030178265921161864564153353694236146643545656399569818313515683860180540336758379058076570370539762726861984519903140832418961205230781061507974986423437054181376",
    "Коротка": "5035038722106953873944819631548210426851399795118284608172459081772631620779662294692877886732089054146631635094057518816659203210841095511733831201538942243402433262729062917803349123608348753655699916542187532552951664760470461797598187120414031872",
    "Довга": "1322871565452855036091777096260605772080792498816571167682028668367289626365686149036186534324273266439596223315493184563348635593672656150493756003750231972495280866306038632043240106510178690056884546530335152764920733905749033486310098281812294139688586062053815547141166712504217821326111352190631166437384787155524263767724611871848017123254193299644724649146422642245468424892841684266598516180590982989792901473482949085899618368723021151909280253264257649639062755573955921017267734204766808282657238310266972897569877378033245420719592322834852130121092370697403813184860310942656386410410609901568",
    "Для розробника": "2825636510604468872167052324575873151387862007242987207748328739170794147603392907017510601203824268997073788835441821812564733580248599959066504427597821764128308354421139506020954575157703233287169986443160741429769159541889311368747049826090071316950210768991187879014371942837076698372122655361521006623847125917648763441508944368324695004773299677646844379882017146197438717655321985164082782912572692128851932734542471984165764910575794180239023584895004034672969682935397194797345194360914695704218714513112714959349049965844051167214352432163566976333543395097400932351788313611972726601146887630438800067203598792491329174506155110262962631577091789759729741580818321227742932413177475053387776",
    "Для роботи": "40588125983704951450337406592669615480147720170610253684248173052298572837615549516840173607627940612641251265470465867992047929347003401616600994661584261279395556075617819962479063559189600242304746606126817594770263842749019379939431661155080905606777491556801066901178736999652015851062087268195477687910198077857065799781360139018360637875988617053248777220869787749453696032331486499601661323137102743968546267754574252359956698432230127850871369305080517153851823683489781895541017236761950665425680363421696",
    "Професійна": "1599253590451016841768855388483839661244174254432230416115907902643119226982975886441499187814556359897018361746415217654940008388487345165286548123640716692476394315966923536872193844133331003791944252506688661950537491397442064874753829991665752504349165626604783464134736302375764870259150378776867001864163232467599262334460951661668766702734579450688449906800481045609365401811472066422609930803078520742590266893238953030051959938925272522186500595385666549588889241621351861344143183979783531680319192378414444037311716266594112523830511153492603813065308168851361194493806755168545512558543121431004672775828699572150870016"
};

function parsePrice(priceStr) {
    const clean = priceStr.toString().replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
}

// 1. Інжекція HTML (Кошик + Модальне вікно видачі)
if (!document.getElementById('open-cart')) {
    const uiMarkup = `
        <div id="open-cart" class="cart-widget" style="display:none;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <div id="cart-count" class="cart-count">0</div>
        </div>

        <div id="modal-overlay" class="modal-overlay">
            <div class="modal-content">
                <span id="close-cart" class="close-modal">&times;</span>
                <h2 style="color: var(--primary); margin-bottom: 15px;">Ваше замовлення</h2>
                <div id="cart-items-list" style="margin: 20px 0; border-bottom: 1px solid var(--border); max-height: 250px; overflow-y: auto;"></div>
                <div style="font-weight: bold; margin-bottom: 20px; font-size: 1.2rem;">Всього: <span id="total-sum">0</span>$</div>
                <form id="order-form" class="order-form">
                    <input type="text" placeholder="Ваш ПІБ" required>
                    <input type="email" placeholder="Email для отримання" required>
                    <button type="submit" class="submit-order btn-primary full-width">Отримати коди</button>
                </form>
            </div>
        </div>

        <div id="delivery-overlay" class="modal-overlay">
            <div class="modal-content delivery-content">
                <span onclick="closeDelivery()" class="close-modal">&times;</span>
                <h2 style="color: var(--accent); margin-bottom: 10px;">Оплата успішна!</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Ось ваші ключі доступу. Скопіюйте їх.</p>
                <div id="delivery-list" class="delivery-list"></div>
                <button onclick="closeDelivery()" class="btn-primary full-width" style="margin-top:20px;">Закрити</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', uiMarkup);
}

// 2. Оновлення відображення кошика
function updateCart() {
    const countEl = document.getElementById('cart-count');
    const listEl = document.getElementById('cart-items-list');
    const sumEl = document.getElementById('total-sum');
    
    localStorage.setItem('tsCart', JSON.stringify(cart));
    countEl.innerText = cart.length;
    
    if (cart.length === 0) {
        listEl.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Кошик порожній</p>';
        sumEl.innerText = '0';
    } else {
        listEl.innerHTML = cart.map((item, index) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px dashed var(--border);">
                <div style="flex: 1;">
                    <div style="font-size: 14px; font-weight: 500;">${item.name}</div>
                    <div style="font-size: 12px; color: var(--accent);">${item.price}$</div>
                </div>
                <button class="remove-item" data-index="${index}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:18px; padding: 0 5px;">&times;</button>
            </div>
        `).join('');
        
        const total = cart.reduce((acc, curr) => acc + parsePrice(curr.price), 0);
        sumEl.innerText = total.toFixed(2);
    }
}

// 3. Логіка видачі товарів
function showDelivery(purchasedItems) {
    const deliveryList = document.getElementById('delivery-list');
    let html = '';

    purchasedItems.forEach(item => {
        // Отримуємо код з бази або генеруємо заглушку
        const code = productsDB[item.name] || ("TSK:UNKNOWN_" + Math.random().toString(36).substr(2, 9).toUpperCase());
        
        html += `
            <div class="delivery-item">
                <div class="delivery-label">${item.name}</div>
                <div class="code-content" style="font-size: 0.8rem; margin-top:5px;">${code}</div>
            </div>
        `;
    });

    deliveryList.innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'none'; // Закрити кошик
    document.getElementById('delivery-overlay').style.display = 'flex'; // Відкрити видачу
}

function closeDelivery() {
    document.getElementById('delivery-overlay').style.display = 'none';
}

updateCart();

// 4. Обробники подій
document.addEventListener('click', function(e) {
    // === ДОДАВАННЯ В КОШИК (З ПЕРЕВІРКОЮ НА ДУБЛІКАТИ) ===
    if (e.target.closest('#market .btn-primary')) {
        const card = e.target.closest('.card');
        if (card) {
            const name = card.querySelector('h3').innerText;
            const price = card.querySelector('h4').innerText.replace('$','');
            
            // Перевірка на дублікат
            const exists = cart.some(item => item.name === name);
            if (exists) {
                alert("Цей шаблон вже додано до кошика!");
                return; // Зупиняємо функцію, не додаємо
            }

            cart.push({ name, price });
            updateCart();
            
            // Анімація
            const widget = document.getElementById('open-cart');
            widget.style.transform = 'scale(1.2)';
            setTimeout(() => widget.style.transform = 'scale(1)', 200);
        }
    }

    // Видалення товару
    if (e.target.classList.contains('remove-item')) {
        const index = e.target.getAttribute('data-index');
        cart.splice(index, 1);
        updateCart();
    }

    // Відкриття модалки кошика
    if (e.target.closest('#open-cart')) {
        document.getElementById('modal-overlay').style.display = 'flex';
    }

    // Закриття модалки кошика
    if (e.target.id === 'close-cart' || e.target.id === 'modal-overlay') {
        document.getElementById('modal-overlay').style.display = 'none';
    }
});

// 5. Оформлення замовлення (виклик видачі)
document.getElementById('order-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (cart.length === 0) return alert("Кошик порожній!");
    
    // Зберігаємо копію покупок для відображення
    const purchased = [...cart];
    
    // Очищаємо кошик
    cart = [];
    updateCart();
    
    // Показуємо коди
    showDelivery(purchased);
});

// 6. Monkey Patching showPage (відображення віджета тільки в магазині)
const originalShowPage = showPage;
showPage = function(id) {
    originalShowPage(id);
    const cartWidget = document.getElementById('open-cart');
    if (cartWidget) {
        setTimeout(() => {
            cartWidget.style.display = (id === 'market') ? 'flex' : 'none';
        }, 100);
    }
};

document.addEventListener("DOMContentLoaded", () => {
   const activePage = document.querySelector('.page.active');
   const cartWidget = document.getElementById('open-cart');
   if(cartWidget) {
       cartWidget.style.display = (activePage && activePage.id === 'market') ? 'flex' : 'none';
   }
});