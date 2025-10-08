// newtab.js
const bgEl = document.getElementById('bg');
const overlayEl = document.getElementById('overlay');
const clockEl = document.getElementById('clock');
const greetingEl = document.getElementById('greeting');
const thumbsContainer = document.getElementById('thumbsContainer');
const quoteBox = document.getElementById('quoteText');

let settings = {
  blur: 0,
  overlayOpacity: 0.35,
  rotateInterval: 0,
  randomize: true
};

let images = [];
let rotateTimer = null;

const quotes = [
  `"A lesson without pain is meaningless." — Edward Elric`,
  `"Fear is freedom! Subjugation is liberation!" — Satsuki Kiryuuin`,
  `"No matter how deep the night, it always turns to day." — Brook (One Piece)`,
  `"When you give up, your dreams and everything else they’re gone." — Ichigo Kurosaki`,
  `"A lesson in chasing dreams: never stop running." — Naruto Uzumaki`,
  `"You can’t sit around envying other people’s worlds. You have to go out and change your own." — Chiaki Mamiya"`
];

function formatTime(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function updateClock() {
  const now = new Date();
  clockEl.textContent = formatTime(now);
  const h = now.getHours();
  const greet = h < 12 ? 'Good morning 🌅' : (h < 18 ? 'Good afternoon ☀️' : 'Good evening 🌙');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  greetingEl.textContent = `${greet} | ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  updateAmbientColor(h);
}

function updateAmbientColor(h){
  // Morning warm tone → Evening cool tone
  let color;
  if (h < 12) color = 'rgba(255,200,160,0.25)';
  else if (h < 18) color = 'rgba(200,220,255,0.25)';
  else color = 'rgba(40,60,120,0.35)';
  overlayEl.style.background = color;
}

function setBackground(dataUrl) {
  bgEl.style.opacity = '0';
  setTimeout(() => {
    bgEl.style.backgroundImage = `url(${dataUrl})`;
    bgEl.style.opacity = '1';
  }, 300);
}

function renderThumbs() {
  thumbsContainer.innerHTML = '';
  images.forEach((img, idx) => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.style.backgroundImage = `url(${img.dataUrl})`;
    div.title = 'Set as background';
    div.onclick = () => setBackground(img.dataUrl);
    thumbsContainer.appendChild(div);
  });
}

function loadFromStorage() {
  chrome.storage.local.get(['animeImages', 'settings'], (res) => {
    if (res.settings) Object.assign(settings, res.settings);
    if (res.animeImages?.length) {
      images = res.animeImages.map((d, i) => ({ id: i, dataUrl: d }));
      renderThumbs();
      const pick = settings.randomize ? Math.floor(Math.random() * images.length) : 0;
      setBackground(images[pick].dataUrl);
      if (settings.rotateInterval > 0) startRotate();
    } else {
      const bundled = [
        'images/sample1.jpg',
        'images/sample2.jpg',
        'images/sample3.jpg'
      ];
      images = bundled.map((p, i) => ({ id: i, dataUrl: chrome.runtime.getURL(p) }));
      renderThumbs();
      setBackground(images[0].dataUrl);
    }
    applySettings();
  });
}

function applySettings() {
  bgEl.style.filter = `brightness(0.95) blur(${settings.blur}px)`;
}

function startRotate() {
  if (rotateTimer) clearInterval(rotateTimer);
  if (settings.rotateInterval > 0 && images.length > 1) {
    rotateTimer = setInterval(() => {
      const idx = Math.floor(Math.random() * images.length);
      setBackground(images[idx].dataUrl);
    }, settings.rotateInterval * 1000);
  }
}

document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  const looksLikeUrl = q.includes('.') && !q.includes(' ');
  const target = looksLikeUrl
    ? (q.startsWith('http') ? q : 'https://' + q)
    : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  window.open(target, '_self');
});

// keyboard shortcut: focus search when "/" pressed
window.addEventListener('keydown', (e) => {
  if (e.key === '/') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});

// options button
document.getElementById('open-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// show random quote
function showQuote() {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  quoteBox.textContent = q;
}

// Initialize
updateClock();
setInterval(updateClock, 1000);
showQuote();
loadFromStorage();

// react to settings updates live
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.animeImages) loadFromStorage();
    if (changes.settings) {
      settings = Object.assign(settings, changes.settings.newValue || {});
      applySettings();
      if (settings.rotateInterval > 0) startRotate();
    }
  }
});
