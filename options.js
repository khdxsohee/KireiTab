// options.js - Handles image uploads, system settings, and quick links management

// DOM element references
const fileInput = document.getElementById('fileInput');
const clearBtn = document.getElementById('clearBtn');
const previewRow = document.getElementById('previewRow');
const saveBtn = document.getElementById('saveBtn');
const msg = document.getElementById('msg');

const rotateInput = document.getElementById('rotateInput');
const randomizeCheckbox = document.getElementById('randomizeCheckbox');
const blurInput = document.getElementById('blurInput');
const blurVal = document.getElementById('blurVal');
const overlayInput = document.getElementById('overlayInput');
const overlayVal = document.getElementById('overlayVal');

// CORRECTED: Default images list points to the 'images' folder
const DEFAULT_IMAGES = [
  { path: 'images/1.jpg', name: 'Default 1' },
  { path: 'images/2.jpg', name: 'Default 2' },
  { path: 'images/3.jpg', name: 'Default 3' }
];

// NEW ELEMENTS
const timeFormat24h = document.getElementById('timeFormat24h');
const timeFormat12h = document.getElementById('timeFormat12h');

const linksList = document.getElementById('linksList');
const newLinkName = document.getElementById('newLinkName');
const newLinkUrl = document.getElementById('newLinkUrl');
const addLinkBtn = document.getElementById('addLinkBtn');

let quickLinks = [];

// Default bundled images (read-only, cannot be deleted)
const DEFAULT_IMAGES = [
  { path: 'images/1.jpg', name: 'Default 1' },
  { path: 'images/2.jpg', name: 'Default 2' },
  { path: 'images/3.jpg', name: 'Default 3' }
];

/**
 * Show temporary message to user
 * @param {string} text - Message to display
 * @param {number} timeout - Duration in ms (default 2500)
 */
function showMessage(text, timeout = 2500) {
  msg.textContent = text;
  setTimeout(() => (msg.textContent = ''), timeout);
}

/**
 * Render image previews (default images + uploaded images from IndexedDB)
 */
async function renderPreviews() {
  previewRow.innerHTML = '';

  // First, display default bundled images
  DEFAULT_IMAGES.forEach((img) => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.style.backgroundImage = `url(${img.path})`;
    div.style.cursor = 'default';
    div.style.opacity = '0.9';
    div.title = `Default Image: ${img.name}`;
    div.innerHTML = `<span class="default-tag">DEFAULT</span>`;
    previewRow.appendChild(div);
  });

  // Then, display user-uploaded images from IndexedDB
  const storedIds = (await getStoredImageIds()) || [];
  
  if (storedIds.length === 0) {
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 20px; color: var(--muted); opacity: 0.7;';
    infoDiv.textContent = 'No uploaded images yet. Upload some images above!';
    previewRow.appendChild(infoDiv);
  }
  
  for (let i = 0; i < storedIds.length; i++) {
    const id = storedIds[i];
    const blob = await KireiDB.getImage(id);
    if (!blob) continue;

    // Create object URL for preview display
    const objectUrl = URL.createObjectURL(blob);
    const div = document.createElement('div');
    div.className = 'thumb';
    div.style.backgroundImage = `url(${objectUrl})`;
    div.title = `Click to remove (ID: ${id}, Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB)`;
    
    // Store object URL for later cleanup
    div.dataset.objectUrl = objectUrl;
    
    // Handle image deletion
    div.onclick = async () => {
      if (!confirm('Remove this image?')) return;
      
      // Clean up object URL
      URL.revokeObjectURL(div.dataset.objectUrl);
      
      // Delete from IndexedDB
      await KireiDB.deleteImage(id);
      
      // Update chrome.storage.local
      const newIds = (await getStoredImageIds()).filter((x) => x !== id);
      chrome.storage.local.set({ animeImages: newIds }, renderPreviews);
      showMessage('Image removed.');
    };
    previewRow.appendChild(div);
  }
}

/**
 * Get stored image IDs from chrome.storage.local
 * @returns {Promise<number[]>} Array of image IDs
 */
function getStoredImageIds() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['animeImages'], (res) => {
      resolve(res.animeImages || []);
    });
  });
}

/**
 * Handle file upload
 * Stores images as blobs in IndexedDB and saves IDs to chrome.storage.local
 */
fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter((f) =>
    f.type.startsWith('image/')
  );
  
  if (files.length === 0) {
    showMessage('Please select valid image files.');
    return;
  }

  try {
    await KireiDB.init();
    const storedIds = (await getStoredImageIds()) || [];

    let addedCount = 0;
    for (let file of files) {
      try {
        // Store the file blob directly in IndexedDB
        const id = await KireiDB.saveImage(file);
        storedIds.push(id);
        addedCount++;
      } catch (error) {
        console.error('[KireiTab] Error saving image:', error);
        showMessage(`Error saving ${file.name}`);
      }
    }

    if (addedCount > 0) {
      // Save image IDs to chrome.storage.local (only IDs, not the actual images)
      chrome.storage.local.set({ animeImages: storedIds }, () => {
        showMessage(`${addedCount} image(s) saved successfully!`);
        fileInput.value = '';
        renderPreviews();
      });
    }
  } catch (error) {
    console.error('[KireiTab] Error in file upload handler:', error);
    showMessage('Error uploading images');
  }
});

/**
 * Clear all uploaded images
 * Removes all images from IndexedDB and clears stored IDs
 */
clearBtn.addEventListener('click', async () => {
  if (!confirm('Remove all uploaded images? This cannot be undone.')) return;
  
  const storedIds = await getStoredImageIds();
  
  // Clean up all object URLs from preview thumbnails
  const thumbs = previewRow.querySelectorAll('.thumb[data-object-url]');
  thumbs.forEach(thumb => {
    if (thumb.dataset.objectUrl) {
      URL.revokeObjectURL(thumb.dataset.objectUrl);
    }
function showMessage(text, timeout = 2500) {
  msg.textContent = text;
  setTimeout(() => msg.textContent = '', timeout);
}

// Image Management Functions
function renderPreviews(images) {
  previewRow.innerHTML = '';
  images.forEach((imageObj, idx) => {
    // Determine display URL and check if it's a default image
    const displayUrl = imageObj.dataUrl || imageObj.path;
    const isDefault = !!imageObj.path;

    const d = document.createElement('div');
    d.className = 'thumb';
    d.style.backgroundImage = `url(${displayUrl})`;
    d.title = isDefault ? `Default Image: ${imageObj.name}` : 'Click to remove';

    // Only allow removing non-default (uploaded) images
    if (!isDefault) {
      // Calculate the index in the actual stored array (skip the default images)
      const storedIndex = idx - DEFAULT_IMAGES.length;
      d.onclick = () => {
        if (!confirm('Remove this image?')) return;
        chrome.storage.local.get(['animeImages'], (res) => {
          let current = res.animeImages || [];
          current.splice(storedIndex, 1);
          chrome.storage.local.set({ animeImages: current }, () => {
            showMessage('Image removed.');
            loadAll();
          });
        });
      };
    } else {
      d.style.cursor = 'default';
      d.style.opacity = '0.9';
      d.innerHTML = `<span class="default-tag">DEFAULT</span>`;
    }
    previewRow.appendChild(d);
  });
}

function loadAll() {
  chrome.storage.local.get(['settings', 'animeImages', 'quickLinks'], (res) => {
    // Load Settings
    if (res.settings) {
      rotateInput.value = res.settings.rotateInterval || 0;
      randomizeCheckbox.checked = !!res.settings.randomize;
      blurInput.value = res.settings.blur || 0;
      blurVal.textContent = res.settings.blur || 0;
      overlayInput.value = res.settings.overlayOpacity || 0.35;
      overlayVal.textContent = res.settings.overlayOpacity || 0.35;

      // Time Format Load
      if (res.settings.timeFormat === '12h') {
        timeFormat12h.checked = true;
      } else {
        timeFormat24h.checked = true;
      }
    }

    // Load Images: Combine defaults with user-uploaded images
    const storedImages = res.animeImages || [];
    const combinedImages = [...DEFAULT_IMAGES, ...storedImages];
    renderPreviews(combinedImages);

    // Load Quick Links
    quickLinks = res.quickLinks || [
      { name: "Google", url: "https://www.google.com" },
      { name: "GitHub", url: "https://github.com" },
      { name: "YouTube", url: "https://youtube.com" }
    ];
    renderLinks();
  });
  
  // Delete all images from IndexedDB
  for (let id of storedIds) {
    await KireiDB.deleteImage(id);
  }
  
  // Clear IDs from chrome.storage.local
  chrome.storage.local.set({ animeImages: [] }, renderPreviews);
  showMessage('All uploaded images cleared.');
});

/**
 * Save system settings to chrome.storage.local
 */
saveBtn.addEventListener('click', () => {
  const newSettings = {
    rotateInterval: Number(rotateInput.value) || 0,
    randomize: !!randomizeCheckbox.checked,
    blur: Number(blurInput.value) || 0,
    overlayOpacity: Number(overlayInput.value) || 0.35,
    timeFormat: timeFormat12h.checked ? '12h' : '24h'
  };
  chrome.storage.local.set({ settings: newSettings }, () =>
    showMessage('Settings saved!')
  );
});

/**
 * Real-time update of slider values
 */
blurInput.addEventListener('input', (e) => (blurVal.textContent = e.target.value));
overlayInput.addEventListener('input', (e) => (overlayVal.textContent = e.target.value));

/**
 * Quick link management - Add new link
 */
addLinkBtn.addEventListener('click', addLink);
newLinkUrl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addLink();
  }
});

/**
 * Render quick links list
 */
function renderLinks() {
  linksList.innerHTML = '';
  if (quickLinks.length === 0) {
    linksList.innerHTML =
      '<div style="justify-content:center;color:var(--muted);opacity:0.6;padding:10px 15px;">No quick links added yet.</div>';
    return;
  }

  quickLinks.forEach((link, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <span>${link.name} (<a href="${link.url}" target="_blank" style="color:var(--muted);text-decoration:none;">${link.url.substring(0, 30)}...</a>)</span>
      <button data-index="${index}">×</button>
    `;
    div.querySelector('button').onclick = () => removeLink(index);
    linksList.appendChild(div);
  });
}

/**
 * Add new quick link
 */
function addLink() {
  const name = newLinkName.value.trim();
  let url = newLinkUrl.value.trim();
  if (!name || !url) return showMessage('Link Name and URL required!');
  
  // Auto-prepend https:// if missing
  if (!url.startsWith('http')) url = 'https://' + url;
  if (!url.includes('.')) return showMessage('Enter valid URL');

  if (!name || !url) {
    showMessage('Link Name and URL cannot be empty!');
    return;
  }

  // Basic URL validation
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  if (!url.includes('.')) {
    showMessage('Please enter a valid URL (e.g., https://example.com)');
    return;
  }

  quickLinks.push({ name, url });
  chrome.storage.local.set({ quickLinks }, () => {
    showMessage('Link added!');
    renderLinks();
    newLinkName.value = '';
    newLinkUrl.value = '';
  });
}

/**
 * Remove quick link by index
 */
function removeLink(index) {
  if (!confirm(`Remove "${quickLinks[index].name}"?`)) return;
  quickLinks.splice(index, 1);
  chrome.storage.local.set({ quickLinks }, () => {
    showMessage('Link removed.');
    renderLinks();
  });
}

/**
 * Load all saved settings and links from chrome.storage.local
 */
async function loadAll() {
  await KireiDB.init();
  
  chrome.storage.local.get(['settings', 'quickLinks'], (res) => {
    // Load settings or use defaults
    if (res.settings) {
      rotateInput.value = res.settings.rotateInterval || 0;
      randomizeCheckbox.checked = res.settings.randomize !== undefined ? res.settings.randomize : true;
      blurInput.value = res.settings.blur || 0;
      blurVal.textContent = res.settings.blur || 0;
      overlayInput.value = res.settings.overlayOpacity || 0.35;
      overlayVal.textContent = res.settings.overlayOpacity || 0.35;
      if (res.settings.timeFormat === '12h') timeFormat12h.checked = true;
      else timeFormat24h.checked = true;
    } else {
      // First time load - set randomize to checked by default
      randomizeCheckbox.checked = true;
    }

    // Load quick links or use defaults
    quickLinks =
      res.quickLinks || [
        { name: 'Google', url: 'https://google.com' },
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'YouTube', url: 'https://youtube.com' }
      ];
    renderLinks();
    renderPreviews();
  });
}

/**
 * Cleanup object URLs on page unload to prevent memory leaks
 */
window.addEventListener('beforeunload', () => {
  const thumbs = previewRow.querySelectorAll('.thumb[data-object-url]');
  thumbs.forEach(thumb => {
    if (thumb.dataset.objectUrl) {
      URL.revokeObjectURL(thumb.dataset.objectUrl);
    }
  });

// Event Listeners
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;

  const readers = files.map(f => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(f);
  }));

  Promise.all(readers).then(results => {
    // combine with existing
    chrome.storage.local.get(['animeImages'], (res) => {
      const current = res.animeImages || [];
      // Uploaded images are stored as { dataUrl: <base64> }
      const newImages = results.map(dataUrl => ({ dataUrl }));
      const combined = current.concat(newImages).slice(0, 50); // keep up to 50 images
      chrome.storage.local.set({ animeImages: combined }, () => {
        showMessage('Images uploaded and saved!');
        fileInput.value = '';
        loadAll();
      });
    });
  }).catch(e => {
    console.error(e);
    showMessage('Error reading files');
  });
});

clearBtn.addEventListener('click', () => {
  if (!confirm('Remove all uploaded images? Default images will remain.')) return;
  // Only remove the uploaded images, keep the default ones.
  chrome.storage.local.remove(['animeImages'], () => { showMessage('Cleared uploaded images.'); loadAll(); });
});

saveBtn.addEventListener('click', () => {
  const newSettings = {
    rotateInterval: Number(rotateInput.value) || 0,
    randomize: !!randomizeCheckbox.checked,
    blur: Number(blurInput.value) || 0,
    overlayOpacity: Number(overlayInput.value) || 0.35,
    // Time Format Save
    timeFormat: timeFormat12h.checked ? '12h' : '24h'
  };
  chrome.storage.local.set({ settings: newSettings }, () => {
    showMessage('Settings saved successfully!');
  });
});

blurInput.addEventListener('input', (e) => { blurVal.textContent = e.target.value; });
overlayInput.addEventListener('input', (e) => { overlayVal.textContent = e.target.value; });

// NEW EVENT LISTENER for Add Link button
addLinkBtn.addEventListener('click', addLink);
newLinkUrl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addLink();
  }
});

// Initialize on page load
loadAll();