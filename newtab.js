/*
 ===================================================================
 * PROJECT: KireiTab
 * VERSION: v1.2.3 - Major Feature Update UI & Performance optimized
 * DATE: 2025-10-22
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

// Default images
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
  timeFormat: '24h',
  showQuotes: false // Default off to match CSS hidden state
};

let images = []; 
let rotateTimer = null;
let currentObjectURL = null;

// --- CLOCK & DATE LOGIC ---
function formatTime(d) {
  let hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  
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

// --- WEATHER LOGIC ---
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
        tempEl.textContent = '--°C';
        locationEl.textContent = 'Enable location';
        iconEl.textContent = '📍';
    }
}

// --- BACKGROUND LOGIC ---
async function setBackground(imageObj) {
  if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
  let url = imageObj.path || null;

  if (imageObj.id) {
    try {
      const blob = await getImageBlob(imageObj.id); 
      if (blob) url = currentObjectURL = URL.createObjectURL(blob);
    } catch(e) { console.error(e); }
  }
  
  if (url) bgEl.style.backgroundImage = `url(${url})`;
}

function applySettings() {
  if (overlayEl) overlayEl.style.backgroundColor = `rgba(7,10,25,${settings.overlayOpacity})`;
  if (bgEl) bgEl.style.filter = `brightness(0.9) blur(${settings.blur}px)`;

  if (rotateTimer) clearInterval(rotateTimer);
  if (settings.rotateInterval > 0 && images.length > 1) {
    let idx = 0;
    rotateTimer = setInterval(() => {
      idx = (idx + 1) % images.length;
      setBackground(images[idx]);
    }, settings.rotateInterval * 1000);
  }
  updateClock();
}

// --- ANIME QUOTE LOGIC ---
async function fetchAnimeQuote() {
    try {
        const response = await fetch('https://animechan.xyz/api/random');
        const data = await response.json();
        document.getElementById('quote-text').innerText = `"${data.quote}"`;
        document.getElementById('quote-author').innerText = `- ${data.character} (${data.anime})`;
    } catch (error) {
        document.getElementById('quote-text').innerText = "Believe in the you who believes in yourself!";
        document.getElementById('quote-author').innerText = "- Kamina";
    }
}

async function applyQuoteSettings() {
    const quoteContainer = document.getElementById('quote-container');
    if (settings.showQuotes === true) {
        await fetchAnimeQuote(); 
        quoteContainer.style.display = 'block';
    } else {
        quoteContainer.style.display = 'none';
    }
}

// --- STORAGE & INIT ---
async function loadFromStorage() {
    const res = await chrome.storage.local.get(['settings', 'uploadedImageIDs', 'todos']);
    if (res.settings) Object.assign(settings, res.settings);

    const uploaded = (res.uploadedImageIDs || []).map(item => ({ id: item.id, name: `Uploaded ${item.id}` }));
    images = [...DEFAULT_IMAGES, ...uploaded];

    if (images.length > 0) {
      const startIdx = settings.randomize ? Math.floor(Math.random() * images.length) : 0;
      await setBackground(images[startIdx]);
    }
    
    applySettings();
    applyQuoteSettings();
    renderTodos(res.todos || []);
    updateWeather();
}

// --- TODO LOGIC ---
function renderTodos(todos) {
    todosList.innerHTML = todos.length ? '' : '<div style="text-align: center; color: gray; padding: 20px;">No tasks yet.</div>';
    todos.forEach((todo, index) => {
        const el = document.createElement('div');
        el.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        el.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
            <span class="todo-text">${todo.text}</span>
            <button class="todo-delete" data-index="${index}">🗑️</button>`;
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

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    setInterval(updateClock, 1000);
});

document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;
    const url = (q.includes('.') && !q.includes(' ')) ? (q.startsWith('http') ? q : 'https://' + q) : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    window.open(url, '_self');
});

document.getElementById('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
document.getElementById('weatherLocation').addEventListener('click', updateWeather);

// Modals
const openModal = (m) => m.style.display = 'block';
const closeModal = (m) => m.style.display = 'none';

document.getElementById('open-apps').addEventListener('click', () => openModal(appsModal));
document.getElementById('open-todos').addEventListener('click', () => openModal(todosModal));
document.querySelectorAll('.close').forEach(btn => btn.onclick = () => { closeModal(appsModal); closeModal(todosModal); });

// Todo Actions
addTodoBtn.onclick = () => { if(newTodoInput.value.trim()) { updateTodoStorage('add', null, newTodoInput.value.trim()); newTodoInput.value = ''; } };
todosList.onclick = (e) => {
    const idx = e.target.dataset.index;
    if (e.target.classList.contains('todo-checkbox')) updateTodoStorage('toggle', idx);
    if (e.target.classList.contains('todo-delete')) updateTodoStorage('delete', idx);
};

// Storage Listener
chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
        Object.assign(settings, changes.settings.newValue);
        applySettings();
        applyQuoteSettings();
    }
    if (changes.todos) renderTodos(changes.todos.newValue || []);
});