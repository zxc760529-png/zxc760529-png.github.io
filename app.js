// --- КОД ДЛЯ 3D КАРУСЕЛИ ---
const track = document.getElementById('carouselTrack');
const cards = document.querySelectorAll('.carousel-card');
const totalCards = cards.length;

const angleStep = 360 / totalCards;
const radius = 420; 
let currentRotation = 0;

function updateCarousel() {
    cards.forEach((card, index) => {
        const cardAngle = (index * angleStep) + currentRotation;
        const rad = (cardAngle % 360) * Math.PI / 180;
        const cos = Math.cos(rad);

        let opacity = cos > 0.1 ? 1 : (cos + 0.6);
        if (opacity < 0) opacity = 0;

        card.style.transform = `rotateY(${cardAngle}deg) translateZ(${radius}px) rotateY(${-cardAngle}deg)`;
        card.style.opacity = opacity;
        
        if (Math.abs(cardAngle % 360) < 15 || Math.abs(cardAngle % 360) > 345) {
            card.style.transform += ` scale(1.12)`;
            card.style.zIndex = 10;
        } else {
            card.style.zIndex = Math.floor(cos * 5);
        }
    });
}

function autoRotate() {
    currentRotation -= 0.12; 
    updateCarousel();
    requestAnimationFrame(autoRotate);
}

// --- КОД ДЛЯ ИНТЕРАКТИВНОГО ХОЛСТА (ТОЧКИ) ---
const canvas = document.getElementById('halftoneCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let particles = [];
const mouse = { x: null, y: null, radius: 95 };

let particleDefaultColor = '#ffffff';

function resize() {
    if (canvas && canvas.parentNode) {
        canvas.width = canvas.parentNode.clientWidth;
        canvas.height = canvas.parentNode.clientHeight;
        initParticles();
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.color = particleDefaultColor;
        this.size = 2.2; 
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.90; 
        this.ease = 0.07;     
        this.forceModifier = 3.6; 
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
            let force = (mouse.radius - distance) / mouse.radius;
            let angle = Math.atan2(dy, dx);
            
            this.vx -= Math.cos(angle) * force * this.forceModifier;
            this.vy -= Math.sin(angle) * force * this.forceModifier;
            
            let ratio = Math.floor((distance / mouse.radius) * 100);
            this.color = `hsl(${ratio * 0.4}, 100%, 60%)`; 
            this.size = 3.2;
        } else {
            this.vx += (this.originX - this.x) * this.ease;
            this.vy += (this.originY - this.y) * this.ease;
            this.color = particleDefaultColor; 
            this.size = 2.2;
        }

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
    }
}

function initParticles() {
    particles = [];
    ctx.fillStyle = '#fff'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let fontSize = Math.floor(canvas.width * 0.12);
    if (fontSize > 130) fontSize = 130;
    
    ctx.font = `900 ${fontSize}px 'Inter', sans-serif`; 
    ctx.fillText('наведите курсор', canvas.width / 2, canvas.height / 2);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gap = 8; 

    for (let y = 0; y < canvas.height; y += gap) {
        for (let x = 0; x < canvas.width; x += gap) {
            const index = (y * canvas.width + x) * 4;
            const alpha = index < imgData.data.length ? imgData.data[index + 3] : 0;
            if (alpha > 128) {
                particles.push(new Particle(x, y));
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    requestAnimationFrame(animate);
}

window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

window.addEventListener('click', () => {
    mouse.radius = 220;
    setTimeout(() => { mouse.radius = 95; }, 400);
});

window.addEventListener('resize', resize);


// --- ЛОГИКА ДЛЯ ПЛАВНОГО ПЕРЕКЛЮЧЕНИЯ ТЕМЫ САЙТА ---
const themeToggleBtn = document.getElementById('themeToggle');

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        
        if (document.body.classList.contains('light-theme')) {
            particleDefaultColor = '#111111'; 
            lineColor = 'rgba(0, 0, 0, 0.04)'; 
        } else {
            particleDefaultColor = '#ffffff'; 
            lineColor = 'rgba(255, 255, 255, 0.04)'; 
        }
        
        particles.forEach(p => {
            if (p.color !== '#ffffff' && p.color !== '#111111') return; 
            p.color = particleDefaultColor;
        });
    });
}


// --- ЛОГИКА ОТПРАВКИ ФОРМЫ ЗАКАЗА В GOOGLE ТАБЛИЦУ + 3D АНИМАЦИЯ ---
const orderScrollBtn = document.getElementById('orderScrollBtn');
const finalSubmitBtn = document.getElementById('finalSubmitBtn');

// Ваша подтвержденная рабочая ссылка для отправки данных в Google Таблицу
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbO94I_d32caYx1Fgnh2JNxCdgSM-A4oZhG3Ly6wLsUPlXII6KPv3yibIRbaY5LwEw/exec';

// Плавный скролл к форме при клике на верхнюю кнопку
if (orderScrollBtn && finalSubmitBtn) {
    orderScrollBtn.addEventListener('click', () => {
        finalSubmitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

// Обработка клика на кнопку "Заказать"
if (finalSubmitBtn) {
    finalSubmitBtn.addEventListener('click', () => {
        // Если кнопка уже находится в процессе переворота, игнорируем повторный клик
        if (finalSubmitBtn.classList.contains('is-flipped')) return;

        // Находим элементы полей ввода
        const purposeInput = document.getElementById('inputPurpose');
        const contactInput = document.getElementById('inputContact');
        const priceInput = document.getElementById('inputPrice');

        // Проверяем, заполнил ли пользователь все поля формы
        if (!purposeInput.value || !contactInput.value || !priceInput.value) {
            alert('Пожалуйста, заполните все поля перед отправкой заказа!');
            return;
        }

        // Собираем данные из инпутов для отправки
        const formData = {
            purpose: purposeInput.value,
            contact: contactInput.value,
            price: priceInput.value
        };

        // Отправляем данные в Google Таблицу в фоновом режиме через fetch
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(() => {
            // Запускаем эффектный 3D-переворот кнопки на зеленую сторону
            finalSubmitBtn.classList.add('is-flipped');

            // Очищаем заполненные поля формы для новых заявок
            purposeInput.value = '';
            contactInput.value = '';
            priceInput.value = '';

            // Плавно возвращаем кнопку в исходное состояние через 5 секунд
            setTimeout(() => {
                finalSubmitBtn.classList.remove('is-flipped');
            }, 5000);
        })
        .catch(error => {
            console.error('Ошибка при отправке данных:', error);
            alert('Что-то пошло не так при отправке. Попробуйте еще раз!');
        });
    });
}


// --- КОД ДЛЯ ДВИЖУЩИХСЯ ЛИНИЙ НА ЗАДНЕМ ФОНЕ ---
const linesCanvas = document.getElementById('bgLinesCanvas');
const linesCtx = linesCanvas.getContext('2d');

let linesWidth = window.innerWidth;
let linesHeight = window.innerHeight;
let lineIncrement = 0;
let lineColor = 'rgba(255, 255, 255, 0.04)'; 

function resizeLinesCanvas() {
    linesWidth = window.innerWidth;
    linesHeight = window.innerHeight;
    linesCanvas.width = linesWidth;
    linesCanvas.height = linesHeight;
}

function drawBackgroundWave(amplitude, frequency, offset, speed) {
    linesCtx.beginPath();
    linesCtx.strokeStyle = lineColor;
    linesCtx.lineWidth = 1.5;

    for (let x = 0; x < linesWidth; x++) {
        const y = linesHeight * 0.45 + Math.sin(x * frequency + offset + lineIncrement * speed) * amplitude * Math.cos(x * 0.001);
        if (x === 0) {
            linesCtx.moveTo(x, y);
        } else {
            linesCtx.lineTo(x, y);
        }
    }
    linesCtx.stroke();
}

function animateBackgroundLines() {
    linesCtx.clearRect(0, 0, linesWidth, linesHeight);
    
    drawBackgroundWave(140, 0.002, 0, 0.5);
    drawBackgroundWave(180, 0.0015, 1.5, 0.3);
    drawBackgroundWave(110, 0.003, 3, 0.7);
    drawBackgroundWave(160, 0.001, 4.5, 0.4);
    
    lineIncrement += 0.02; 
    requestAnimationFrame(animateBackgroundLines);
}

window.addEventListener('resize', resizeLinesCanvas);


// Запуск всех анимационных и интерактивных систем проекта
updateCarousel();
autoRotate();
resize();
animate();
resizeLinesCanvas();
animateBackgroundLines();
