// newtab.js - Display backgrounds, clock, greetings, quick links, and quotes

// DOM elements
const bgEl = document.getElementById('bg');
const overlayEl = document.getElementById('overlay');
const clockEl = document.getElementById('clock');
const greetingEl = document.getElementById('greeting');
const quickLinksEl = document.getElementById('quickLinks');
const linksPlaceholderEl = document.getElementById('links-placeholder');
const quoteBox = document.getElementById('quoteText');

// Default bundled images (must exist in images/ folder)
const DEFAULT_IMAGES = [
  { path: 'images/1.jpg', name: 'Default 1' },
  { path: 'images/2.jpg', name: 'Default 2' },
  { path: 'images/3.jpg', name: 'Default 3' }
];

// Default settings
let settings = {
  blur: 0,
  overlayOpacity: 0.35,
  rotateInterval: 0,
  randomize: true, // Default: show random image on each load
  timeFormat: '24h'
};

let quickLinks = [];
let images = []; // Combined array of default + uploaded images
let rotateTimer = null;
let currentObjectUrl = null; // Track current blob URL for cleanup

// Inspirational anime quotes
const quotes = [
  `"A lesson without pain is meaningless." — Edward Elric`,
  `"Fear is freedom! Subjugation is liberation!" — Satsuki Kiryuuin`,
  `"No matter how deep the night, it always turns to day." — Brook (One Piece)`,
  `"When you give up, your dreams and everything else are gone." — Ichigo Kurosaki`,
  `"A lesson in chasing dreams: never stop running." — Naruto Uzumaki`,
  `"You can't sit around envying other people's worlds. You have to go out and change your own." — Chiaki Mamiya"`
];

/**
 * Format time based on user preference (12h or 24h)
 */
function formatTime(d) {
  let hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (settings.timeFormat === '12h') {
    const ampm = hh >= 12 ? ' PM' : ' AM';
    hh = hh % 12 || 12;
    return `${hh}:${mm}${ampm}`;
  }
  return `${String(hh).padStart(2, '0')}:${mm}`;
}

/**
 * Update clock and greeting based on time of day
 */
function updateClock() {
  const now = new Date();
  clockEl.textContent = formatTime(now);
  const h = now.getHours();
  greetingEl.textContent =
    h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/**
 * Set background image from either default path or uploaded blob
 * @param {Object} img - Image object with either 'path' (default) or 'id' (uploaded)
 */
async function setBackground(img) {
  try {
    // Clean up previous object URL to prevent memory leaks
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }

    if (img.path) {
      // Default image - use path directly
      bgEl.style.backgroundImage = `url(${img.path})`;
    } else if (img.id) {
      // Uploaded image - fetch blob from IndexedDB
      const blob = await KireiDB.getImage(img.id);

      if (blob) {
        // Create temporary object URL from blob
        currentObjectUrl = URL.createObjectURL(blob);
        bgEl.style.backgroundImage = `url(${currentObjectUrl})`;
      }
    }
  } catch (error) {
    console.error('[KireiTab] Error setting background:', error);
  }
}

/**
 * Apply visual settings (blur, overlay) and setup image rotation if enabled
 */
async function applySettings() {
  overlayEl.style.backgroundColor = `rgba(7,10,25,${settings.overlayOpacity})`;
  bgEl.style.filter = `brightness(0.9) blur(${settings.blur}px)`;

  // Setup automatic image rotation
  if (rotateTimer) clearInterval(rotateTimer);
  if (settings.rotateInterval > 0 && images.length > 1) {
    let i = Math.floor(Math.random() * images.length); // Start from random position
    rotateTimer = setInterval(async () => {
      i = (i + 1) % images.length;
      await setBackground(images[i]);
    }, settings.rotateInterval * 1000);
  }
  updateClock();
}

/**
 * Render quick links or placeholder
 */
function renderQuickLinks() {
  quickLinksEl.innerHTML = '';
  if (quickLinks.length > 0) {
    linksPlaceholderEl.style.display = 'none';
    quickLinks.forEach((link) => {
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

/**
 * Load images from defaults and IndexedDB
 * Combines default bundled images with user-uploaded images
 */
async function loadImages() {
  try {
    await KireiDB.init();

    // Get stored image IDs from chrome.storage.local
    const storedIds = (await new Promise((res) =>
      chrome.storage.local.get(['animeImages'], (r) => res(r.animeImages || []))
    )) || [];

    // Build combined image array: defaults + uploaded (by ID reference)
    images = [
      ...DEFAULT_IMAGES,
      ...storedIds.map(id => ({ id }))
    ];

    if (images.length === 0) {
      console.warn('[KireiTab] No images available');
      return;
    }

    // Determine which image to show on load
    let startIdx;
    if (settings.randomize) {
      // Random mode: show any random image from collection
      startIdx = Math.floor(Math.random() * images.length);
    } else if (storedIds.length > 0) {
      // Sequential mode with uploads: show first uploaded image
      startIdx = DEFAULT_IMAGES.length;
    } else {
      // Sequential mode without uploads: show first default
      startIdx = 0;
    }

    await setBackground(images[startIdx]);
    await applySettings();
  } catch (error) {
    console.error('[KireiTab] Error loading images:', error);
  }
}

/**
 * Handle search form submission
 * Supports both Google search and direct URL navigation
 */
document
  .getElementById('searchForm')
  .addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;

    // Check if input looks like a URL or search query
    const url =
      q.includes('.') && !q.includes(' ')
        ? q.startsWith('http')
          ? q
          : 'https://' + q
        : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    window.open(url, '_self');
  });

/**
 * Focus search input on '/' key press
 */
window.addEventListener('keydown', (e) => {
  if (e.key === '/') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});

/**
 * Open extension options page
 */
document
  .getElementById('open-options')
  .addEventListener('click', () => chrome.runtime.openOptionsPage());

/**
 * Display random quote
 */
function showQuote() {
  quoteBox.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Load settings and quick links from storage
 */
function loadFromStorage() {
  chrome.storage.local.get(['settings', 'quickLinks'], (res) => {
    if (res.settings) settings = { ...settings, ...res.settings };
    if (res.quickLinks) quickLinks = res.quickLinks;
    renderQuickLinks();
    loadImages();
  });
}

/**
 * Cleanup resources on page unload
 */
window.addEventListener('beforeunload', () => {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }
  if (rotateTimer) {
    clearInterval(rotateTimer);
  }
});

// Initialize clock and quote
updateClock();
setInterval(updateClock, 1000);
showQuote();
loadFromStorage();

/**
 * Listen for storage changes and update UI accordingly
 */
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    settings = { ...settings, ...changes.settings.newValue };
    applySettings();
  }
  if (changes.animeImages) loadImages();
  if (changes.quickLinks) {
    quickLinks = changes.quickLinks.newValue || [];
    renderQuickLinks();
  }
});