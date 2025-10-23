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
let images = []; 
let rotateTimer = null;
let currentObjectURL = null;

// Time display logic - Fixed AM/PM

function formatTime(d) {
  let hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  
  if (settings.timeFormat === '12h') {
    // 12-hour format conversion
    hh = hh % 12;
    hh = hh ? hh : 12; // 0 o'clock (midnight) should be 12
    return `${hh}:${mm}`;
  } else {
    // 24-hour format
    hh = String(hh).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

function updateClock() {
  const now = new Date();
  
  if (clockEl) {
    let timeHTML = formatTime(now);
    
    if (settings.timeFormat === '12h') {
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      
      timeHTML += `<span class="ampm">${ampm}</span>`;
    }
    
    clockEl.innerHTML = timeHTML;
  }
  
  if (dateEl) {
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
 
    dateEl.textContent = `${day}.${month}.${year} ${weekday}`;
  }
}

// Weather functionality
async function updateWeather() {
    const tempEl = document.getElementById('weatherTemp');
    const locationEl = document.getElementById('weatherLocation');
    const iconEl = document.getElementById('weatherIcon');
    
    if (!tempEl || !locationEl || !iconEl) return;
    
    try {
        // Get location first
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: false
            });
        });
        
        const { latitude, longitude } = position.coords;
        
        // Weather API call
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        
        const data = await response.json();
        const weather = data.current_weather;
        
        // Update weather display
        tempEl.textContent = `${Math.round(weather.temperature)}°C`;
        
        // Get location name
        const locationResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const locationData = await locationResponse.json();
        locationEl.textContent = locationData.city || locationData.locality || 'Unknown';
        
        // Weather icon mapping
        const weatherCode = weather.weathercode;
        let icon = '☁️';
        
        if (weatherCode === 0) icon = '☀️';
        else if (weatherCode >= 1 && weatherCode <= 3) icon = '⛅';
        else if (weatherCode >= 45 && weatherCode <= 48) icon = '🌫️';
        else if (weatherCode >= 51 && weatherCode <= 67) icon = '🌧️';
        else if (weatherCode >= 71 && weatherCode <= 77) icon = '❄️';
        else if (weatherCode >= 80 && weatherCode <= 82) icon = '🌦️';
        else if (weatherCode >= 95 && weatherCode <= 99) icon = '⛈️';
        
        iconEl.textContent = icon;
        
    } catch (error) {
        console.log('Weather data unavailable:', error);
        tempEl.textContent = '--°C';
        locationEl.textContent = 'Enable location';
        iconEl.textContent = '📍';
        
        // Make weather clickable to retry
        locationEl.style.cursor = 'pointer';
        locationEl.onclick = updateWeather;
    }
}

// Background setting logic
async function setBackground(imageObj) {
  let url;

  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = null;
  }

  if (imageObj.path) {
    url = imageObj.path;
  } else if (imageObj.id) {
    try {
      const blob = await getImageBlob(imageObj.id); 
      if (blob) {
        url = URL.createObjectURL(blob);
        currentObjectURL = url;
      } else {
        console.error('Blob not found for ID:', imageObj.id);
        return;
      }
    } catch(e) {
      console.error('Error fetching image blob:', e);
      return;
    }
  } else {
    return;
  }
  
  bgEl.style.backgroundImage = `url(${url})`;
}

function applySettings() {
  if (overlayEl) {
    overlayEl.style.backgroundColor = `rgba(7,10,25,${settings.overlayOpacity})`;
  }
  if (bgEl) {
    bgEl.style.filter = `brightness(0.9) blur(${settings.blur}px)`;
  }

  // Rotate logic
  if (rotateTimer) clearInterval(rotateTimer);
  if (settings.rotateInterval > 0 && images.length > 1) {
    let idx = 0;
    rotateTimer = setInterval(() => {
      idx = (idx + 1) % images.length;
      setBackground(images[idx]);
    }, settings.rotateInterval * 1000);
  }

  // Update clock with new settings
  updateClock();
}

async function loadFromStorage() {
  try {
    const res = await new Promise(resolve => {
      chrome.storage.local.get(['settings', 'uploadedImageIDs', 'quickLinks'], resolve);
    });

    // Load settings - PROPERLY MERGE SETTINGS
    if (res.settings) {
      Object.assign(settings, res.settings);
    }

    // Load images
    const storedImageIDs = res.uploadedImageIDs || [];
    const uploadedImages = storedImageIDs.map(item => ({
      id: item.id,
      name: `Uploaded ${item.id}`
    }));

    images = [...DEFAULT_IMAGES, ...uploadedImages];

    if (images.length > 0) {
      let startIdx = 0;
      if (settings.randomize) {
        startIdx = Math.floor(Math.random() * images.length);
      }
      await setBackground(images[startIdx]);
    } else {
      await setBackground(DEFAULT_IMAGES[0]);
    }

    applySettings();

    quickLinks = res.quickLinks || [
      { name: "Google", url: "https://www.google.com" },
      { name: "GitHub", url: "https://github.com" },
      { name: "YouTube", url: "https://youtube.com" }
    ];

    // Load weather
    updateWeather();
    
  } catch (error) {
    console.error('Error loading from storage:', error);
  }
}

// Event Listeners
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

// Make weather clickable
document.getElementById('weatherLocation').addEventListener('click', updateWeather);

// Initialization - FIXED
document.addEventListener('DOMContentLoaded', function() {
  // First show time immediately
  updateClock();
  
  // Then load settings
  loadFromStorage();
  
  // Start regular updates
  setInterval(updateClock, 1000);
});

// React to settings updates live
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    Object.assign(settings, changes.settings.newValue);
    applySettings();
  }
  if (changes.uploadedImageIDs) {
    loadFromStorage();
  }
  if (changes.quickLinks) {
    quickLinks = changes.quickLinks.newValue || [];
  }
});

// Cleanup
window.addEventListener('beforeunload', () => {
    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
    }
});

// Apps and Todos functionality
const appsModal = document.getElementById('appsModal');
const todosModal = document.getElementById('todosModal');
const appsGrid = document.getElementById('appsGrid');
const todosList = document.getElementById('todosList');
const newTodoInput = document.getElementById('newTodoInput');
const addTodoBtn = document.getElementById('addTodoBtn');

// Popular apps with icons
const popularApps = [
    { name: "YouTube", url: "https://youtube.com", icon: "📺" },
    { name: "Google", url: "https://google.com", icon: "🔍" },
    { name: "Gmail", url: "https://mail.google.com", icon: "📧" },
    { name: "Drive", url: "https://drive.google.com", icon: "💾" },
    { name: "Instagram", url: "https://instagram.com", icon: "📷" },
    { name: "Facebook", url: "https://facebook.com", icon: "👥" },
    { name: "Twitter", url: "https://twitter.com", icon: "🐦" },
    { name: "GitHub", url: "https://github.com", icon: "💻" },
    { name: "Netflix", url: "https://netflix.com", icon: "🎬" },
    { name: "Amazon", url: "https://amazon.com", icon: "📦" },
    { name: "WhatsApp", url: "https://web.whatsapp.com", icon: "💬" },
    { name: "Spotify", url: "https://open.spotify.com", icon: "🎵" },
    { name: "Reddit", url: "https://reddit.com", icon: "📱" },
    { name: "LinkedIn", url: "https://linkedin.com", icon: "💼" },
    { name: "Pinterest", url: "https://pinterest.com", icon: "📌" },
    { name: "TikTok", url: "https://tiktok.com", icon: "🎵" }
];

// Modal functions
function openModal(modal) {
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

// Load apps
function loadApps() {
    appsGrid.innerHTML = '';
    popularApps.forEach(app => {
        const appElement = document.createElement('a');
        appElement.href = app.url;
        appElement.target = '_blank';
        appElement.className = 'app-item';
        appElement.innerHTML = `
            <div class="app-icon">${app.icon}</div>
            <div class="app-name">${app.name}</div>
        `;
        appsGrid.appendChild(appElement);
    });
}

// Load todos from storage
async function loadTodos() {
    const result = await chrome.storage.local.get(['todos']);
    const todos = result.todos || [];
    renderTodos(todos);
}

// Render todos
function renderTodos(todos) {
    todosList.innerHTML = '';
    
    if (todos.length === 0) {
        todosList.innerHTML = '<div style="text-align: center; color: var(--muted); padding: 20px;">No tasks yet. Add your first task!</div>';
        return;
    }
    
    todos.forEach((todo, index) => {
        const todoElement = document.createElement('div');
        todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoElement.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
            <span class="todo-text">${todo.text}</span>
            <button class="todo-delete" data-index="${index}">🗑️</button>
        `;
        todosList.appendChild(todoElement);
    });
    
    // Add event listeners
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', toggleTodo);
    });
    
    document.querySelectorAll('.todo-delete').forEach(button => {
        button.addEventListener('click', deleteTodo);
    });
}

// Add new todo
async function addTodo() {
    const text = newTodoInput.value.trim();
    if (!text) return;
    
    const result = await chrome.storage.local.get(['todos']);
    const todos = result.todos || [];
    
    todos.push({
        text: text,
        completed: false,
        id: Date.now()
    });
    
    await chrome.storage.local.set({ todos });
    newTodoInput.value = '';
    loadTodos();
}

// Toggle todo completion
async function toggleTodo(event) {
    const index = parseInt(event.target.dataset.index);
    const result = await chrome.storage.local.get(['todos']);
    const todos = result.todos || [];
    
    if (todos[index]) {
        todos[index].completed = !todos[index].completed;
        await chrome.storage.local.set({ todos });
        loadTodos();
    }
}

// Delete todo
async function deleteTodo(event) {
    const index = parseInt(event.target.dataset.index);
    const result = await chrome.storage.local.get(['todos']);
    const todos = result.todos || [];
    
    if (todos[index]) {
        todos.splice(index, 1);
        await chrome.storage.local.set({ todos });
        loadTodos();
    }
}

// Event listeners for modals
document.getElementById('open-apps').addEventListener('click', () => {
    loadApps();
    openModal(appsModal);
});

document.getElementById('open-todos').addEventListener('click', () => {
    loadTodos();
    openModal(todosModal);
});

// Close modals when clicking X
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        closeModal(appsModal);
        closeModal(todosModal);
    });
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === appsModal) {
        closeModal(appsModal);
    }
    if (event.target === todosModal) {
        closeModal(todosModal);
    }
});

// Add todo event listeners
addTodoBtn.addEventListener('click', addTodo);
newTodoInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTodo();
    }
});

// Initial load todos
document.addEventListener('DOMContentLoaded', function() {
    loadTodos();
});