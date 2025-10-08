// newtab.js
const bgEl = document.getElementById('bg');
const overlayEl = document.getElementById('overlay');
const clockEl = document.getElementById('clock');
const greetingEl = document.getElementById('greeting');
const quickLinksEl = document.getElementById('quickLinks');
const linksPlaceholderEl = document.getElementById('links-placeholder');
const quoteBox = document.getElementById('quoteText');

// CORRECTED: Default images list points to the 'images' folder
const DEFAULT_IMAGES = [
    { path: 'images/1.jpg', name: 'Default 1' },
    { path: 'images/2.jpg', name: 'Default 2' },
    { path: 'images/3.jpg', name: 'Default 3' }
];

let settings = {
  blur: 0,
  overlayOpacity: 0.35,
  rotateInterval: 0,
  randomize: true,
  timeFormat: '24h'
};

let quickLinks = [];
let images = []; // Combined list of DEFAULT_IMAGES + uploaded images
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
  let hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  let ampm = '';

  if (settings.timeFormat === '12h') {
    ampm = hh >= 12 ? ' PM' : ' AM';
    hh = hh % 12;
    hh = hh ? hh : 12; // the hour '0' should be '12'
    return `${hh}:${mm}${ampm}`;
  } else {
    hh = String(hh).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

function updateClock() {
  const now = new Date();
  clockEl.textContent = formatTime(now);

  // Greeting logic
  const hour = now.getHours();
  let greetingText = 'Hello';
  if (hour < 12) {
    greetingText = 'Good morning';
  } else if (hour < 18) {
    greetingText = 'Good afternoon';
  } else {
    greetingText = 'Good evening';
  }
  greetingEl.textContent = greetingText;
}

// UPDATED: Now accepts an image object and determines the URL (path or dataUrl)
function setBackground(imageObj) {
  const url = imageObj.dataUrl || imageObj.path;
  bgEl.style.backgroundImage = `url(${url})`;
}

function applySettings() {
  overlayEl.style.backgroundColor = `rgba(7,10,25,${settings.overlayOpacity})`;
  bgEl.style.filter = `brightness(0.9) blur(${settings.blur}px)`;

  // Rotate logic
  if (rotateTimer) clearInterval(rotateTimer);
  if (settings.rotateInterval > 0 && images.length > 1) {
    let idx = 0;
    rotateTimer = setInterval(() => {
      idx = (idx + 1) % images.length;
      setBackground(images[idx]); // Pass the image object
    }, settings.rotateInterval * 1000);
  }
  
  updateClock();
}

function loadFromStorage() {
  chrome.storage.local.get(['settings', 'animeImages', 'quickLinks'], (res) => {
    // Load settings
    if (res.settings) {
      settings = { ...settings, ...res.settings };
    }
    applySettings();

    // Load images
    const storedImages = res.animeImages || [];
    // Combine defaults with user-uploaded images for display/rotation
    images = [...DEFAULT_IMAGES, ...storedImages];
    
    if (images.length > 0) {
      let startIdx = 0;
      if (settings.randomize) {
        startIdx = Math.floor(Math.random() * images.length);
      }
      setBackground(images[startIdx]); // Pass the image object
      // Restart rotation if needed (applySettings handles this)
      applySettings();
    } else {
        // Fallback to the first default image if even the defaults are somehow missing from the array (shouldn't happen)
        setBackground(DEFAULT_IMAGES[0]); 
    }

    // Load quick links
    quickLinks = res.quickLinks || [
      { name: "Google", url: "https://www.google.com" },
      { name: "GitHub", url: "https://github.com" },
      { name: "YouTube", url: "https://youtube.com" }
    ];
    renderQuickLinks();
  });
}

function renderQuickLinks() {
  quickLinksEl.innerHTML = '';
  if (quickLinks && quickLinks.length > 0) {
    linksPlaceholderEl.style.display = 'none';
    quickLinks.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.textContent = link.name;
      quickLinksEl.appendChild(a);
    });
  } else {
    linksPlaceholderEl.style.display = 'block';
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
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    settings = { ...settings, ...changes.settings.newValue };
    applySettings();
  }
  if (changes.animeImages) {
    // If images change, force a re-load to correctly combine defaults + uploaded and restart rotation
    loadFromStorage(); 
  }
  if (changes.quickLinks) {
    quickLinks = changes.quickLinks.newValue || [];
    renderQuickLinks();
  }
});