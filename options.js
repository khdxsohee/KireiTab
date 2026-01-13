/*
 ===================================================================
 * PROJECT: KireiTab
 * VERSION: v1.3.40 - Major UI update & Performance Enhancement
 * DATE: 2026-01-13
 * AUTHOR: khdxsohee
 * ===================================================================
*/

// DOM Elements
const fileInput = document.getElementById('fileInput');
const clearBtn = document.getElementById('clearBtn');
const previewRow = document.getElementById('previewRow');
const saveBtn = document.getElementById('saveBtn');
const msg = document.getElementById('msg');
const uploadZone = document.getElementById('uploadZone');
const refreshBtn = document.getElementById('refreshBtn');
const resetBtn = document.getElementById('resetBtn');

const rotateInput = document.getElementById('rotateInput');
const randomizeCheckbox = document.getElementById('randomizeCheckbox');
const blurInput = document.getElementById('blurInput');
const blurVal = document.getElementById('blurVal');
const overlayInput = document.getElementById('overlayInput');
const overlayVal = document.getElementById('overlayVal');
const showQuotesCheckbox = document.getElementById('showQuotesCheckbox');
const timeFormat24h = document.getElementById('timeFormat24h');
const timeFormat12h = document.getElementById('timeFormat12h');

const linksList = document.getElementById('linksList');
const newLinkName = document.getElementById('newLinkName');
const newLinkUrl = document.getElementById('newLinkUrl');
const addLinkBtn = document.getElementById('addLinkBtn');

const quotesEnabled = document.getElementById('quotesEnabled');
const quotesCategory = document.getElementById('quotesCategory');
const refreshQuotesBtn = document.getElementById('refreshQuotesBtn');
const autoRefreshCheckbox = document.getElementById('autoRefreshCheckbox');
const refreshInterval = document.getElementById('refreshInterval');
const clearCacheBtn = document.getElementById('clearCacheBtn');

const performanceLevel = document.getElementById('performanceLevel');
const enableAnimations = document.getElementById('enableAnimations');
const hardwareAcceleration = document.getElementById('hardwareAcceleration');
const cacheCheckbox = document.getElementById('cacheCheckbox');

const appNameInput = document.getElementById('appNameInput');
const appUrlInput = document.getElementById('appUrlInput');
const appIconInput = document.getElementById('appIconInput');
const addAppBtn = document.getElementById('addAppBtn');
const appsGrid = document.getElementById('appsGrid');

const newTodoInput = document.getElementById('newTodoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const todosList = document.getElementById('todosList');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');

const imagesCount = document.getElementById('imagesCount');
const linksCount = document.getElementById('linksCount');
const storageUsed = document.getElementById('storageUsed');
const statusIndicator = document.getElementById('statusIndicator');
const imagesBadge = document.getElementById('imagesBadge');
const linksBadge = document.getElementById('linksBadge');
const memoryUsage = document.getElementById('memoryUsage');
const memoryText = document.getElementById('memoryText');
const lastBackup = document.getElementById('lastBackup');
const settingsVersion = document.getElementById('settingsVersion');
const totalItems = document.getElementById('totalItems');
const version = document.getElementById('version');

const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');


let quickLinks = [];
let uploadedImageIDs = [];
let appsList = [];
let todosListData = [];
let editingLinkIndex = -1;
const objectUrlMap = new Map();

const DEFAULT_IMAGES = [
  { path: 'images/1.jpg', name: 'Default 1' },
  { path: 'images/2.jpg', name: 'Default 2' },
  { path: 'images/3.jpg', name: 'Default 3' }
];

const DEFAULT_APPS = [
  { name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
  { name: 'Calendar', url: 'https://calendar.google.com', icon: '📅' },
  { name: 'Drive', url: 'https://drive.google.com', icon: '💾' },
  { name: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' }
];

// ==================== UTILITIES ====================
function showMessage(text, type = 'success', timeout = 2500) {
  const msg = document.getElementById('msg');
  msg.textContent = text; msg.style.display = 'block';
  if (type === 'error') msg.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  else if (type === 'warning') msg.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  else msg.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  msg.style.animation = 'slideUp 0.3s ease-out';
  setTimeout(() => {
    msg.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => { msg.style.display = 'none'; msg.textContent = ''; msg.style.animation = ''; }, 300);
  }, timeout);
}

// --- Helper to get Favicon URL ---
function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
        return '';
    }
}

// ==================== INITIALIZATION ====================
function initializeDashboard() {
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault(); const sectionId = this.getAttribute('data-section');
      navItems.forEach(nav => nav.classList.remove('active')); this.classList.add('active');
      contentSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) section.classList.add('active');
      });
    });
  });
  if (uploadZone) uploadZone.addEventListener('click', () => fileInput.click());
  if (fileInput) fileInput.addEventListener('change', handleFileUpload);
  if (refreshBtn) refreshBtn.addEventListener('click', loadAll);
  if (resetBtn) resetBtn.addEventListener('click', resetToDefaults);
  if (blurInput && blurVal) blurInput.addEventListener('input', (e) => blurVal.textContent = e.target.value);
  if (overlayInput && overlayVal) overlayInput.addEventListener('input', (e) => overlayVal.textContent = parseFloat(e.target.value).toFixed(2));
  if (refreshQuotesBtn) refreshQuotesBtn.addEventListener('click', () => { showMessage('Quotes refreshed!', 'success'); chrome.runtime.sendMessage({ action: 'refreshQuotes' }); });
  if (clearCacheBtn) clearCacheBtn.addEventListener('click', async () => { await chrome.storage.local.remove(['cachedQuotes', 'lastQuoteFetch']); showMessage('Cache cleared!', 'success'); });
  if (addAppBtn && appNameInput && appUrlInput && appIconInput) addAppBtn.addEventListener('click', addApp);
  if (addTodoBtn && newTodoInput) { addTodoBtn.addEventListener('click', addTodo); newTodoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); }); }
  if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', clearCompletedTodos);
  if (exportBtn) exportBtn.addEventListener('click', exportSettings);
  if (importBtn && importInput) { importBtn.addEventListener('click', () => importInput.click()); importInput.addEventListener('change', importSettings); }
  if (addLinkBtn) addLinkBtn.addEventListener('click', addLink);
  if (newLinkUrl) newLinkUrl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } });
  if (saveBtn) saveBtn.addEventListener('click', saveAllSettings);
}

// ==================== IMAGE MANAGEMENT ====================
async function getCombinedImages() {
  const res = await new Promise(resolve => chrome.storage.local.get('uploadedImageIDs', resolve));
  const ids = res.uploadedImageIDs || []; uploadedImageIDs = ids;
  // IMPORTANT: No longer mapping previewDataUrl here to save LocalStorage space
  // We map only IDs. Preview will be fetched from DB on demand.
  const uploadedPreviews = ids.map(item => ({ id: item.id, name: `Uploaded ${item.id}` }));
  return [...DEFAULT_IMAGES, ...uploadedPreviews];
}

async function renderPreviews(images) {
  objectUrlMap.forEach(url => URL.revokeObjectURL(url)); objectUrlMap.clear(); previewRow.innerHTML = '';
  if (images.length === 0) { previewRow.innerHTML = `<div style="grid-column:1 / -1; text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);"><div style="font-size: 48px; margin-bottom: 20px;">📷</div><div>No images uploaded yet</div></div>`; return; }

  // We render asynchronously because we might need to fetch from DB
  for (const imageObj of images) {
    const isDefault = !!imageObj.path; 
    let displayUrl = '';
    
    if (isDefault) {
        displayUrl = imageObj.path;
    } else {
        // Try to get from map first (cached)
        if (objectUrlMap.has(imageObj.id)) {
            displayUrl = objectUrlMap.get(imageObj.id);
        } else {
            // Fetch Blob from DB if not already cached
            try {
                const blob = await getImageBlob(imageObj.id);
                if (blob) {
                    displayUrl = URL.createObjectURL(blob);
                    objectUrlMap.set(imageObj.id, displayUrl);
                }
            } catch (e) {
                console.error('Error loading preview:', e);
                continue; // Skip this image if error
            }
        }
    }

    if (!displayUrl) continue;

    const thumbItem = document.createElement('div');
    thumbItem.className = 'thumb-item';
    thumbItem.innerHTML = `
      <img src="${displayUrl}" class="thumb-image" alt="${imageObj.name}">
      <div class="thumb-overlay"><div class="thumb-actions"><div class="thumb-name">${imageObj.name}</div>${!isDefault ? '<button class="remove-btn" title="Remove">×</button>' : ''}</div></div>
    `;
    if (!isDefault) thumbItem.querySelector('.remove-btn').addEventListener('click', () => removeImage(imageObj.id));
    previewRow.appendChild(thumbItem);
  }
}

// --- SERIAL UPLOAD FOR TRUE UNLIMITED IMAGES ---
async function handleFileUpload(e) {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;

  showMessage(`Uploading ${files.length} images one by one... Please wait.`, 'info');
  
  // Disable button during upload
  uploadZone.style.pointerEvents = 'none';
  uploadZone.style.opacity = '0.7';

  let newImageItems = [];
  let failedCount = 0;

  // Process files ONE BY ONE (Serial) to prevent memory crashes and LocalStorage Quota errors
  for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
          // Step 1: Read as ArrayBuffer (Raw binary, smaller than Base64 string)
          const arrayBuffer = await file.arrayBuffer();
          
          // Step 2: Create Blob
          const blob = new Blob([arrayBuffer], { type: file.type });
          
          // Step 3: Save to IndexedDB (Unlimited storage)
          const id = await saveImageBlob(blob);
          
          // Step 4: Add to list (Only ID! Do not save Base64 here)
          newImageItems.push({ id });
          
          // Update Message occasionally
          if ((i + 1) % 5 === 0) {
              showMessage(`Processed ${i + 1} of ${files.length} images...`, 'info', 1000);
          }
      } catch (err) {
          console.error(`Failed to save ${file.name}:`, err);
          failedCount++;
      }
  }

  // Update Storage at the end
  try {
    const res = await new Promise(resolve => chrome.storage.local.get('uploadedImageIDs', resolve));
    let currentIds = res.uploadedImageIDs || [];
    
    // Append new IDs
    const combinedIds = currentIds.concat(newImageItems);
    
    await new Promise(resolve => chrome.storage.local.set({ uploadedImageIDs: combinedIds }, resolve));
    
    uploadZone.style.pointerEvents = 'auto';
    uploadZone.style.opacity = '1';
    
    if (failedCount > 0) {
        showMessage(`Uploaded ${newImageItems.length} images successfully (${failedCount} failed).`, 'warning', 5000);
    } else {
        showMessage(`Successfully uploaded ${newImageItems.length} images!`, 'success');
    }
    fileInput.value = ''; 
    loadAll();
  } catch (err) {
    console.error("Storage Error:", err);
    uploadZone.style.pointerEvents = 'auto';
    uploadZone.style.opacity = '1';
    showMessage('Error saving list to storage.', 'error', 5000);
  }
}

async function removeImage(id) {
  if (!confirm('Remove this image?')) return;
  try {
    await deleteImage(id); // Remove from IndexedDB
    const res = await new Promise(resolve => chrome.storage.local.get('uploadedImageIDs', resolve));
    let currentIds = res.uploadedImageIDs || [];
    const newIds = currentIds.filter(item => item.id !== id);
    await new Promise(resolve => chrome.storage.local.set({ uploadedImageIDs: newIds }, resolve));
    showMessage('Image removed.', 'success'); loadAll();
  } catch (e) { console.error('Error removing image:', e); showMessage('Error removing image.', 'error', 5000); }
}

// ==================== QUICK LINKS (WITH FAVICONS) ====================
function renderLinks() {
  linksList.innerHTML = '';
  if (quickLinks.length === 0) {
    linksList.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 40px; color: rgba(255,255,255, 0.6);"><div style="font-size: 32px; margin-bottom: 10px;">🔗</div><div>No quick links added yet</div></td></tr>`;
    return;
  }

  quickLinks.forEach((link, index) => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.className = 'link-name';
    nameCell.textContent = link.name;

    const urlCell = document.createElement('td');
    urlCell.className = 'link-url';
    const flexDiv = document.createElement('div');
    flexDiv.style.display = 'flex';
    flexDiv.style.alignItems = 'center';
    flexDiv.style.gap = '10px';

    if (link.iconUrl) {
        const img = document.createElement('img');
        img.src = link.iconUrl;
        img.style.width = '20px';
        img.style.height = '20px';
        img.style.borderRadius = '4px';
        flexDiv.appendChild(img);
    }

    const linkAnchor = document.createElement('a');
    linkAnchor.href = link.url;
    linkAnchor.target = '_blank';
    linkAnchor.style.color = 'rgba(255,255,255, 0.7)';
    linkAnchor.textContent = link.url.substring(0, 40) + (link.url.length > 40 ? '...' : '');
    
    flexDiv.appendChild(linkAnchor);
    urlCell.appendChild(flexDiv);

    const actionCell = document.createElement('td');
    const actionDiv = document.createElement('div');
    actionDiv.className = 'table-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-secondary';
    editBtn.style.padding = '6px 12px';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editQuickLink(index);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.style.background = 'rgba(239, 68, 68, 0.2)';
    removeBtn.textContent = '×';
    removeBtn.onclick = () => removeQuickLink(index);

    actionDiv.appendChild(editBtn);
    actionDiv.appendChild(removeBtn);
    actionCell.appendChild(actionDiv);

    row.appendChild(nameCell);
    row.appendChild(urlCell);
    row.appendChild(actionCell);
    linksList.appendChild(row);
  });
}

function addLink() {
  const name = newLinkName.value.trim();
  let url = newLinkUrl.value.trim();

  if (!name || !url) { showMessage('Link Name and URL cannot be empty!', 'error'); return; }
  if (!url.startsWith('http')) url = 'https://' + url;

  try { new URL(url); } catch (e) { showMessage('Please enter a valid URL', 'error'); return; }

  const iconUrl = getFaviconUrl(url);

  if (editingLinkIndex > -1) {
    quickLinks[editingLinkIndex] = { name, url, iconUrl };
    editingLinkIndex = -1;
    addLinkBtn.textContent = "Add Link";
    showMessage('Link updated successfully!', 'success');
  } else {
    quickLinks.push({ name, url, iconUrl });
    showMessage('Link added successfully!', 'success');
  }

  chrome.storage.local.set({ quickLinks: quickLinks }, () => {
    renderLinks(); updateStats();
    newLinkName.value = ''; newLinkUrl.value = '';
  });
}

function removeQuickLink(index) {
  if (!confirm(`Remove "${quickLinks[index].name}"?`)) return;
  quickLinks.splice(index, 1);
  chrome.storage.local.set({ quickLinks: quickLinks }, () => {
    showMessage('Link removed!', 'success');
    renderLinks(); updateStats();
  });
}

function editQuickLink(index) {
  const link = quickLinks[index];
  newLinkName.value = link.name;
  newLinkUrl.value = link.url;
  editingLinkIndex = index;
  addLinkBtn.textContent = "Update Link";
  showMessage('Edit link details above and click "Update Link"', 'info');
}

// ==================== APPS (FIXED REMOVE) ====================
function renderAppsGrid(apps) {
  appsGrid.innerHTML = '';
  apps.forEach((app, index) => {
    const appItem = document.createElement('div');
    appItem.className = 'app-item';
    appItem.innerHTML = `<div class="app-icon">${app.icon}</div><div class="app-name">${app.name}</div><button class="remove-btn" style="position: absolute; top: 5px; right: 5px;">×</button>`;
    appItem.addEventListener('click', (e) => { if (!e.target.classList.contains('remove-btn')) window.open(app.url, '_blank'); });

    const removeBtn = appItem.querySelector('.remove-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeApp(index);
        });
    }
    appsGrid.appendChild(appItem);
  });
}

function addApp() {
  const name = appNameInput.value.trim();
  let url = appUrlInput.value.trim();
  const icon = appIconInput.value.trim() || '📱';
  if (!name || !url) { showMessage('App name and URL are required', 'error'); return; }
  if (!url.startsWith('http')) url = 'https://' + url;
  try { new URL(url); } catch (e) { showMessage('Please enter a valid URL', 'error'); return; }
  appsList.push({ name, url, icon });
  chrome.storage.local.set({ appsSettings: { apps: appsList } }, () => {
    showMessage('App added!', 'success'); renderAppsGrid(appsList);
    appNameInput.value = ''; appUrlInput.value = ''; appIconInput.value = '';
  });
}

window.removeApp = function(index) {
  if (!confirm('Remove this app?')) return;
  appsList.splice(index, 1);
  chrome.storage.local.set({ appsSettings: { apps: appsList } }, () => { showMessage('App removed!', 'success'); renderAppsGrid(appsList); });
};

// ==================== TODOS ====================
function renderTodos() {
  todosList.innerHTML = '';
  if (todosListData.length === 0) { todosList.innerHTML = `<div style="text-align: center; padding: 40px; color: rgba(255,255,255, 0.6);"><div style="font-size: 48px; margin-bottom: 20px;">📝</div><div>No tasks yet. Add one above!</div></div>`; return; }
  todosListData.forEach(todo => {
    const todoItem = document.createElement('div');
    todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    todoItem.innerHTML = `<input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}><span class="todo-text">${todo.text}</span><button class="todo-delete" onclick="removeTodo('${todo.id}')">×</button>`;
    todoItem.querySelector('.todo-checkbox').addEventListener('change', (e) => {
      todo.completed = e.target.checked;
      chrome.storage.local.set({ todos: todosListData }, () => { renderTodos(); });
    });
    todosList.appendChild(todoItem);
  });
}

function addTodo() {
  const text = newTodoInput.value.trim();
  if (!text) { showMessage('Please enter a task', 'error'); return; }
  const newTodo = { id: Date.now().toString(), text: text, completed: false, createdAt: new Date().toISOString() };
  todosListData.push(newTodo);
  chrome.storage.local.set({ todos: todosListData }, () => { showMessage('Task added!', 'success'); renderTodos(); newTodoInput.value = ''; });
}

window.removeTodo = function(id) {
  todosListData = todosListData.filter(todo => todo.id !== id);
  chrome.storage.local.set({ todos: todosListData }, () => { showMessage('Task removed!', 'success'); renderTodos(); });
};

function clearCompletedTodos() {
  const completedCount = todosListData.filter(t => t.completed).length;
  if (completedCount === 0) { showMessage('No completed tasks to clear', 'info'); return; }
  if (!confirm(`Clear ${completedCount} completed tasks?`)) return;
  todosListData = todosListData.filter(todo => !todo.completed);
  chrome.storage.local.set({ todos: todosListData }, () => { showMessage('Completed tasks cleared!', 'success'); renderTodos(); });
}

// ==================== BACKUP ====================
async function exportSettings() {
  try {
    const data = await new Promise(resolve => { chrome.storage.local.get(null, resolve); });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kireitab-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    const now = new Date(); lastBackup.textContent = now.toLocaleString();
    showMessage('Settings exported!', 'success');
  } catch (e) { showMessage('Error exporting', 'error'); }
}

async function importSettings(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text(); const data = JSON.parse(text);
    if (confirm('Overwrite current settings?')) {
      await new Promise(resolve => chrome.storage.local.set(data, resolve));
      showMessage('Settings imported!', 'success'); loadAll();
    }
  } catch (e) { showMessage('Invalid file', 'error'); }
  e.target.value = '';
}

// ==================== STATS ====================
async function updateStats() {
  const images = await getCombinedImages();
  imagesCount.textContent = images.length; if (imagesBadge) imagesBadge.textContent = images.length;
  linksCount.textContent = quickLinks.length; if (linksBadge) linksBadge.textContent = quickLinks.length;
  try {
    const storage = await new Promise(resolve => chrome.storage.local.getBytesInUse(null, resolve));
    const mb = (storage / (1024 * 1024)).toFixed(2);
    storageUsed.textContent = `${mb}MB`; const memoryPercent = Math.min(parseFloat(mb) / 10 * 100, 100);
    if (memoryUsage) memoryUsage.style.width = `${memoryPercent}%`;
    if (memoryText) memoryText.textContent = `${mb}MB`;
  } catch (e) { storageUsed.textContent = '--MB'; }
  const total = images.length + quickLinks.length + appsList.length + todosListData.length;
  if (totalItems) totalItems.textContent = `${total} items`;
}

async function loadAll() {
  try {
    const res = await new Promise(resolve => { chrome.storage.local.get(['settings', 'quickLinks', 'quotesSettings', 'performanceSettings', 'appsSettings', 'todos'], resolve); });
    if (res.settings) {
      if (rotateInput) rotateInput.value = res.settings.rotateInterval || 0;
      if (randomizeCheckbox) randomizeCheckbox.checked = !!res.settings.randomize;
      if (showQuotesCheckbox) showQuotesCheckbox.checked = res.settings.showQuotes !== false;
      if (blurInput) { blurInput.value = res.settings.blur || 0; blurVal.textContent = res.settings.blur || 0; }
      if (overlayInput) { overlayInput.value = res.settings.overlayOpacity || 0.35; overlayVal.textContent = (res.settings.overlayOpacity || 0.35).toFixed(2); }
      if (res.settings.timeFormat === '12h') { if (timeFormat12h) timeFormat12h.checked = true; } else { if (timeFormat24h) timeFormat24h.checked = true; }
    }
    if (res.quotesSettings) {
      if (quotesEnabled) quotesEnabled.checked = res.quotesSettings.enabled !== false;
      if (quotesCategory) quotesCategory.value = res.quotesSettings.category || 'anime';
      if (autoRefreshCheckbox) autoRefreshCheckbox.checked = !!res.quotesSettings.autoRefresh;
      if (refreshInterval) refreshInterval.value = res.quotesSettings.refreshInterval || 300;
    }
    if (res.performanceSettings) {
      if (performanceLevel) performanceLevel.value = res.performanceSettings.level || 'balanced';
      if (enableAnimations) enableAnimations.checked = res.performanceSettings.animations !== false;
      if (hardwareAcceleration) hardwareAcceleration.checked = !!res.performanceSettings.hardwareAcceleration;
      if (cacheCheckbox) cacheCheckbox.checked = !!res.performanceSettings.cache;
    }
    const combinedImages = await getCombinedImages(); 
    if (previewRow) renderPreviews(combinedImages);
    
    quickLinks = res.quickLinks || [{ name: "Google", url: "https://www.google.com" }, { name: "GitHub", url: "https://github.com" }, { name: "YouTube", url: "https://youtube.com" }];
    // Ensure icons
    quickLinks = quickLinks.map(link => {
        if (!link.iconUrl) return { ...link, iconUrl: getFaviconUrl(link.url) };
        return link;
    });
    
    if (linksList) renderLinks();
    
    appsList = res.appsSettings?.apps || DEFAULT_APPS; if (appsGrid) renderAppsGrid(appsList);
    todosListData = res.todos || []; if (todosList) renderTodos();
    await updateStats();
  } catch(e) { console.error('Error in loadAll:', e); showMessage('Error loading settings.', 'error', 5000); }
}

async function saveAllSettings() {
  try {
    const settings = {
      rotateInterval: Number(rotateInput ? rotateInput.value : 0) || 0,
      randomize: !!(randomizeCheckbox ? randomizeCheckbox.checked : true),
      showQuotes: !!(showQuotesCheckbox ? showQuotesCheckbox.checked : true),
      blur: Number(blurInput ? blurInput.value : 0) || 0,
      overlayOpacity: parseFloat(overlayInput ? overlayInput.value : 0.35) || 0.35,
      timeFormat: (timeFormat12h && timeFormat12h.checked) ? '12h' : '24h'
    };
    const quotesSettings = {
      enabled: quotesEnabled ? quotesEnabled.checked : true,
      category: quotesCategory ? quotesCategory.value : 'anime',
      autoRefresh: autoRefreshCheckbox ? autoRefreshCheckbox.checked : false,
      refreshInterval: refreshInterval ? Number(refreshInterval.value) : 300
    };
    const performanceSettings = {
      level: performanceLevel ? performanceLevel.value : 'balanced',
      animations: enableAnimations ? enableAnimations.checked : true,
      hardwareAcceleration: hardwareAcceleration ? hardwareAcceleration.checked : true,
      cache: cacheCheckbox ? cacheCheckbox.checked : true
    };
    await new Promise(resolve => chrome.storage.local.set({
      settings: settings, quickLinks: quickLinks, quotesSettings: quotesSettings,
      performanceSettings: performanceSettings, appsSettings: { apps: appsList }, todos: todosListData
    }, resolve));
    showMessage('All settings saved!', 'success'); await updateStats();
  } catch (error) { console.error('Error saving:', error); showMessage('Error saving', 'error'); }
}

async function resetToDefaults() {
  if (!confirm('Reset all settings?')) return;
  try {
    await clearAllImages();
    await new Promise(resolve => chrome.storage.local.remove(['uploadedImageIDs'], resolve));
    const defaultSettings = { rotateInterval: 0, randomize: true, showQuotes: true, blur: 0, overlayOpacity: 0.35, timeFormat: '24h' };
    const defaultQuotesSettings = { enabled: true, category: 'anime', autoRefresh: false, refreshInterval: 300 };
    const defaultPerformanceSettings = { level: 'balanced', animations: true, hardwareAcceleration: true, cache: true };
    
    const defaultLinks = [
        { name: "Google", url: "https://www.google.com", iconUrl: getFaviconUrl("https://www.google.com") }, 
        { name: "GitHub", url: "https://github.com", iconUrl: getFaviconUrl("https://github.com") }, 
        { name: "YouTube", url: "https://youtube.com", iconUrl: getFaviconUrl("https://youtube.com") }
    ];

    await new Promise(resolve => chrome.storage.local.set({
      settings: defaultSettings, quickLinks: defaultLinks, quotesSettings: defaultQuotesSettings,
      performanceSettings: defaultPerformanceSettings, appsSettings: { apps: DEFAULT_APPS }, todos: []
    }, resolve));
    showMessage('Reset complete.', 'success'); loadAll();
  } catch (e) { console.error('Error reset:', e); showMessage('Error resetting.', 'error', 5000); }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const manifest = chrome.runtime.getManifest();
    if (manifest && statusIndicator) { statusIndicator.className = 'status-indicator status-active'; statusIndicator.textContent = '● Active v' + manifest.version; }
    if (version) version.textContent = manifest.version;
    if (settingsVersion) settingsVersion.textContent = manifest.version;
    initializeDashboard(); await loadAll(); await updateStats();
  } catch (e) { console.error('Init error:', e); showMessage('Init error.', 'error', 5000); }
});

window.addEventListener('beforeunload', () => { objectUrlMap.forEach(url => URL.revokeObjectURL(url)); objectUrlMap.clear(); });
if (clearBtn) clearBtn.addEventListener('click', async () => {
  if (!confirm('Remove all uploaded images?')) return;
  try { await clearAllImages(); await new Promise(resolve => chrome.storage.local.remove(['uploadedImageIDs'], resolve)); showMessage('Images cleared.', 'success'); loadAll(); }
  catch (e) { console.error('Error:', e); showMessage('Error clearing.', 'error', 5000); }
});