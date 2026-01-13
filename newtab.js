/*
 ===================================================================
 * PROJECT: KireiTab
 * VERSION: v1.3.40 - Major UI update & Performance Enhancement
 * DATE: 2026-01-13
 * AUTHOR: khdxsohee
 * ===================================================================
*/

const bgEl = document.getElementById('bg');
const overlayEl = document.getElementById('overlay');
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date-display');
const appsModal = document.getElementById('appsModal');
const todosModal = document.getElementById('todosModal');
const appsGrid = document.getElementById('appsGrid');
const todosList = document.getElementById('todosList');
const newTodoInput = document.getElementById('newTodoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const openAppsBtn = document.getElementById('open-apps');
const openTodosBtn = document.getElementById('open-todos');
const closeButtons = document.querySelectorAll('.close');

const DEFAULT_IMAGES = [
  { path: 'images/1.jpg', name: 'Default 1' },
  { path: 'images/2.jpg', name: 'Default 2' },
  { path: 'images/3.jpg', name: 'Default 3' }
];

let settings = {
  blur: 0, overlayOpacity: 0.35, rotateInterval: 0,
  randomize: true, timeFormat: '24h', showQuotes: false
};

let images = []; 
let rotateTimer = null;
let currentObjectURL = null;
let appsList = [];
let quickLinksList = [];
let imageCache = new Map();

// --- BACKGROUND LOGIC ---
async function preloadDefaultImages() {
  const preloadPromises = DEFAULT_IMAGES.map(img => {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve; image.onerror = resolve;
      image.src = img.path;
    });
  });
  await Promise.allSettled(preloadPromises);
}

async function loadAndCacheUserImages() {
  try {
    const res = await chrome.storage.local.get(['uploadedImageIDs']);
    const uploaded = res.uploadedImageIDs || [];
    for (const item of uploaded.slice(0, 10)) {
      if (item.id && !imageCache.has(item.id)) {
        try {
          const blob = await getImageBlob(item.id);
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            imageCache.set(item.id, blobUrl);
          }
        } catch (e) { console.error('Cache error:', e); }
      }
    }
  } catch (error) { console.error('Load error:', error); }
}

async function setBackgroundInstant(imageObj) {
  let url = imageCache.get(imageObj.id || imageObj.path);
  if (!url && imageObj.path) url = imageObj.path;
  if (!url && imageObj.id) {
    try {
      const blob = await getImageBlob(imageObj.id);
      if (blob) {
        url = URL.createObjectURL(blob);
        imageCache.set(imageObj.id, url);
      }
    } catch (e) { console.error('Image Load Error:', e); return; }
  }
  if (url) {
    bgEl.style.backgroundImage = `url(${url})`;
    bgEl.style.opacity = '1'; bgEl.style.transition = 'none';
    setTimeout(() => { bgEl.style.transition = 'background-image 0.5s ease'; }, 100);
  }
}

// --- APPS & QUICK LINKS (WITH FAVICONS) ---
async function loadApps() {
  try {
    const res = await chrome.storage.local.get(['appsSettings', 'quickLinks']);
    appsList = res.appsSettings?.apps || [];
    quickLinksList = res.quickLinks || [];
    renderApps();
  } catch (error) { console.error('Error loading apps:', error); appsList = []; }
}

function renderApps() {
  appsGrid.innerHTML = '';
  
  // Combine Links and Apps
  const combinedItems = [
      ...quickLinksList.map(link => ({ ...link, type: 'link' })),
      ...appsList.map(app => ({ ...app, type: 'app' }))
  ];

  if (combinedItems.length === 0) {
    appsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);"><div style="font-size: 48px; margin-bottom: 20px;">📱</div><div>No apps or links added yet.</div></div>`;
    return;
  }

  combinedItems.forEach(item => {
    const appItem = document.createElement('div');
    appItem.className = 'app-item';
    
    let iconHtml = '';
    if (item.type === 'app') {
        // App: Emoji
        iconHtml = item.icon;
    } else {
        // Link: Check for Favicon first, then fallback to letter
        if (item.iconUrl) {
            iconHtml = `<img src="${item.iconUrl}" style="width:32px; height:32px; border-radius:4px;">`;
        } else {
            iconHtml = `<div style="background: rgba(255,255,255,0.2); width:100%; height:100%; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">${item.name.charAt(0).toUpperCase()}</div>`;
        }
    }

    appItem.innerHTML = `<div class="app-icon">${iconHtml}</div><div class="app-name">${item.name}</div>`;
    
    appItem.addEventListener('click', () => { 
        window.open(item.url, '_blank'); 
        closeModal(appsModal); 
    });
    
    appsGrid.appendChild(appItem);
  });
}

// --- CLOCK & WEATHER ---
function formatTime(d) {
  let hh = d.getHours(); const mm = String(d.getMinutes()).padStart(2, '0');
  if (settings.timeFormat === '12h') {
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 || 12;
    return `${hh}:${mm}<span class="ampm">${ampm}</span>`;
  }
  return `${String(hh).padStart(2, '0')}:${mm}`;
}

function updateClock() {
  const now = new Date();
  if (clockEl) clockEl.innerHTML = formatTime(now);
  if (dateEl) {
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    dateEl.textContent = `${day}.${month}.${year} ${weekday}`;
  }
}

async function updateWeather() {
    const tempEl = document.getElementById('weatherTemp');
    const locationEl = document.getElementById('weatherLocation');
    const iconEl = document.getElementById('weatherIcon');
    if (!tempEl || !locationEl || !iconEl) return;
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        const { latitude, longitude } = position.coords;
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();
        tempEl.textContent = `${Math.round(weatherData.current_weather.temperature)}°C`;
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const geoData = await geoRes.json();
        locationEl.textContent = geoData.city || geoData.locality || 'Unknown';
        const code = weatherData.current_weather.weathercode;
        const icons = { 0: '☀️', 1: '⛅', 2: '⛅', 3: '⛅', 45: '🌫️', 48: '🌫️', 51: '🌧️', 61: '🌧️', 71: '❄️', 80: '🌦️', 95: '⛈️' };
        iconEl.textContent = icons[code] || '☁️';
    } catch (e) {
        tempEl.textContent = '--°C'; locationEl.textContent = 'Enable location'; iconEl.textContent = '📍';
    }
}

// --- QUOTES ---
async function fetchAnimeQuote() {
    try {
        const response = await fetch('https://animechan.xyz/api/random');
        const data = await response.json();
        document.getElementById('quote-text').innerText = `"${data.quote}"`;
        document.getElementById('quote-author').innerText = `- ${data.character} (${data.anime})`;
    } catch (error) {
        document.getElementById('quote-text').innerText = "Believe in you who believes in yourself!";
        document.getElementById('quote-author').innerText = "- Kamina";
    }
}

async function applyQuoteSettings() {
    const quoteContainer = document.getElementById('quote-container');
    if (settings.showQuotes === true) {
        await fetchAnimeQuote(); quoteContainer.style.display = 'block';
    } else { quoteContainer.style.display = 'none'; }
}

function applySettings() {
  const opacity = parseFloat(settings.overlayOpacity) || 0.35;
  if (overlayEl) overlayEl.style.backgroundColor = `rgba(7,10,25,${opacity})`;
  if (bgEl) bgEl.style.filter = `brightness(0.9) blur(${settings.blur || 0}px)`;
  if (rotateTimer) clearInterval(rotateTimer);
  if (settings.rotateInterval > 0 && images.length > 1) {
    let idx = 0;
    rotateTimer = setInterval(() => {
      idx = (idx + 1) % images.length;
      setBackgroundInstant(images[idx]);
    }, settings.rotateInterval * 1000);
  }
  updateClock();
}

// --- TODOS ---
function renderTodos(todos) {
    todosList.innerHTML = todos.length ? '' : '<div style="text-align: center; color: gray; padding: 20px;">No tasks yet.</div>';
    todos.forEach((todo, index) => {
        const el = document.createElement('div');
        el.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        el.innerHTML = `<input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}"><span class="todo-text">${todo.text}</span><button class="todo-delete" data-index="${index}">🗑️</button>`;
        todosList.appendChild(el);
    });
}

async function updateTodoStorage(action, index, text = '') {
    const res = await chrome.storage.local.get(['todos']);
    let todos = res.todos || [];
    if (action === 'add') todos.push({ text, completed: false, id: Date.now() });
    else if (action === 'toggle') todos[index].completed = !todos[index].completed;
    else if (action === 'delete') todos.splice(index, 1);
    await chrome.storage.local.set({ todos });
    renderTodos(todos);
}

// --- INIT ---
async function loadFromStorage() {
    const res = await chrome.storage.local.get(['settings', 'uploadedImageIDs', 'todos', 'appsSettings', 'quickLinks']);
    
    if (res.settings) {
        settings = { ...settings, ...res.settings, overlayOpacity: parseFloat(res.settings.overlayOpacity) || 0.35, blur: parseInt(res.settings.blur) || 0, rotateInterval: parseInt(res.settings.rotateInterval) || 0 };
    }
    const uploaded = (res.uploadedImageIDs || []).map(item => ({ id: item.id, name: `Uploaded ${item.id}` }));
    images = [...DEFAULT_IMAGES, ...uploaded];

    // Load Apps and Quick Links together
    appsList = res.appsSettings?.apps || [];
    quickLinksList = res.quickLinks || [];

    applySettings();
    if (images.length > 0) {
        const startIdx = settings.randomize ? Math.floor(Math.random() * images.length) : 0;
        setBackgroundInstant(images[startIdx]);
    }
    applyQuoteSettings();
    renderTodos(res.todos || []);
    updateWeather();
}

// --- EVENTS ---
const openModal = (modal) => { 
    if (modal === appsModal) renderApps(); // Renders Links + Apps
    modal.style.display = 'block'; 
};
const closeModal = (modal) => { modal.style.display = 'none'; };

window.addEventListener('click', (event) => {
    if (event.target === appsModal) closeModal(appsModal);
    if (event.target === todosModal) closeModal(todosModal);
});

document.addEventListener('DOMContentLoaded', async () => {
    updateClock(); setInterval(updateClock, 1000);
    loadFromStorage();
    
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const q = document.getElementById('searchInput').value.trim();
        if (!q) return;
        const url = (q.includes('.') && !q.includes(' ')) ? (q.startsWith('http') ? q : 'https://' + q) : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
        window.open(url, '_self');
    });

    document.getElementById('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
    document.getElementById('weatherLocation').addEventListener('click', updateWeather);
    openAppsBtn.addEventListener('click', () => openModal(appsModal));
    openTodosBtn.addEventListener('click', () => openModal(todosModal));
    
    closeButtons.forEach(btn => { btn.addEventListener('click', () => { closeModal(appsModal); closeModal(todosModal); }); });
    
    addTodoBtn.addEventListener('click', () => {
        if(newTodoInput.value.trim()) { updateTodoStorage('add', null, newTodoInput.value.trim()); newTodoInput.value = ''; }
    });
    todosList.addEventListener('click', (e) => {
        const idx = e.target.dataset.index;
        if (e.target.classList.contains('todo-checkbox')) updateTodoStorage('toggle', idx);
        if (e.target.classList.contains('todo-delete')) updateTodoStorage('delete', idx);
    });
    document.body.classList.add('loaded');
});

chrome.storage.onChanged.addListener(async (changes) => {
    if (changes.settings) {
        Object.assign(settings, changes.settings.newValue);
        if (changes.settings.newValue.overlayOpacity !== undefined) settings.overlayOpacity = parseFloat(changes.settings.newValue.overlayOpacity) || 0.35;
        applySettings(); applyQuoteSettings();
    }
    if (changes.todos) renderTodos(changes.todos.newValue || []);
    if (changes.quickLinks || changes.appsSettings) {
        // Reload both lists if either changes
        if (changes.quickLinks) quickLinksList = changes.quickLinks.newValue || [];
        if (changes.appsSettings) appsList = changes.appsSettings.newValue?.apps || [];
        
        if (appsModal.style.display === 'block') renderApps();
    }
    if (changes.uploadedImageIDs) {
        const uploaded = (changes.uploadedImageIDs.newValue || []).map(item => ({ id: item.id, name: `Uploaded ${item.id}` }));
        images = [...DEFAULT_IMAGES, ...uploaded];
        if (settings.rotateInterval > 0 && rotateTimer) {
            clearInterval(rotateTimer); let idx = 0;
            rotateTimer = setInterval(() => { idx = (idx + 1) % images.length; setBackgroundInstant(images[idx]); }, settings.rotateInterval * 1000);
        }
    }
});

window.addEventListener('beforeunload', () => {
    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    imageCache.forEach(url => { if (url && typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url); });
    imageCache.clear();
});