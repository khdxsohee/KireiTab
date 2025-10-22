/*
 ===================================================================
 * PROJECT: KireiTab
 * VERSION: v1.2.1 - Major Feature Update UI & Bugs Fixed
 * DATE: 2025-10-22
 * AUTHOR: khdxsohee
 * ===================================================================
*/

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

let quickLinks = []; // Local array to hold links
// NEW: uploadedImageIDs now stores only the IDs (keys) from IndexedDB
let uploadedImageIDs = [];
// This map will store Object URLs for uploaded images for preview only
const objectUrlMap = new Map();


function showMessage(text, timeout = 2500) {
  const msg = document.getElementById('msg');
  msg.textContent = text;
  msg.style.display = 'block';
  msg.style.animation = 'slideUp 0.3s ease-out';
  
  // Hide after timeout with fade out animation
  setTimeout(() => {
    msg.style.animation = 'fadeOutDown 0.3s ease-out';
    setTimeout(() => {
      msg.style.display = 'none';
      msg.textContent = '';
    }, 300); // Match the animation duration
  }, timeout);
}

// Image Management Functions
/**
 * Renders the image previews.
 * @param {Array<Object>} images - Combined list of default and uploaded image objects.
 */
function renderPreviews(images) {
  // Revoke old object URLs before rendering new ones
  objectUrlMap.forEach(url => URL.revokeObjectURL(url));
  objectUrlMap.clear();

  previewRow.innerHTML = '';
  images.forEach(imageObj => {
    const isDefault = !!imageObj.path;
    let displayUrl = '';
    
    // Determine the source for the preview
    if (isDefault) {
      displayUrl = imageObj.path;
    } else if (imageObj.dataUrl) {
      // Create Object URL from the dataUrl blob for preview
      const blob = dataUrlToBlob(imageObj.dataUrl);
      displayUrl = URL.createObjectURL(blob);
      objectUrlMap.set(imageObj.id, displayUrl);
    } else {
      // This should not happen if loadAll is correct, but good for safety
      return; 
    }

    const d = document.createElement('div');
    d.className = 'thumb';
    d.style.backgroundImage = `url(${displayUrl})`;
    d.title = isDefault ? `Default Image: ${imageObj.name}` : 'Click to remove';

    // Only allow removing non-default (uploaded) images
    if (!isDefault) {
      d.onclick = () => removeImage(imageObj.id);
    } else {
      d.style.cursor = 'default';
      d.style.opacity = '0.9';
      d.innerHTML = `<span class="default-tag">DEFAULT</span>`;
    }
    previewRow.appendChild(d);
  });
}

/**
 * Utility to convert Data URL to Blob for temporary Object URL creation.
 * @param {string} dataurl - The base64 data URL.
 * @returns {Blob} The created Blob.
 */
function dataUrlToBlob(dataurl) {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}


/**
 * Fetches the list of image IDs and a small preview dataUrl for rendering.
 * @returns {Promise<Array<Object>>} A promise resolving to the combined image list.
 */
async function getCombinedImages() {
  const ids = await chrome.storage.local.get('uploadedImageIDs').then(res => res.uploadedImageIDs || []);
  uploadedImageIDs = ids; // Update local tracker

  // The stored object now contains {id: number, previewDataUrl: string}
  const uploadedPreviews = ids.map(item => ({
    id: item.id,
    dataUrl: item.previewDataUrl,
    name: `Uploaded ${item.id}` // Use ID for name
  }));
  
  return [...DEFAULT_IMAGES, ...uploadedPreviews];
}

async function loadAll() {
  try {
    const res = await new Promise(resolve => {
      chrome.storage.local.get(['settings', 'quickLinks'], resolve);
    });

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

    // Load Images: Get the combined list
    const combinedImages = await getCombinedImages();
    renderPreviews(combinedImages);

    // Load Quick Links
    quickLinks = res.quickLinks || [
      { name: "Google", url: "https://www.google.com" },
      { name: "GitHub", url: "https://github.com" },
      { name: "YouTube", url: "https://youtube.com" }
    ];
    renderLinks();
  } catch(e) {
    console.error('Error in loadAll:', e);
    showMessage('Error loading settings or images.', 5000);
  }
}

// NEW: Updated Upload Logic
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;

  showMessage(`Uploading ${files.length} images... Please wait.`);

  // Read files as ArrayBuffer (for DB storage) AND DataURL (for preview thumbnail)
  const readers = files.map(f => new Promise((res, rej) => {
    const readerArrayBuffer = new FileReader();
    const readerDataUrl = new FileReader();
    
    // Read as ArrayBuffer for IndexedDB storage (more efficient than Blob URL)
    readerArrayBuffer.onload = (eArray) => {
      // Read as DataURL for a small preview thumbnail to store in storage.local
      readerDataUrl.onload = (eData) => {
        res({ arrayBuffer: eArray.target.result, dataUrl: eData.target.result });
      };
      readerDataUrl.onerror = rej;
      readerDataUrl.readAsDataURL(f); // Read second time for preview
    };
    readerArrayBuffer.onerror = rej;
    readerArrayBuffer.readAsArrayBuffer(f); // Read first time for DB
  }));

  Promise.all(readers).then(async results => {
    // Save each image to IndexedDB
    const newImagePromises = results.map(async ({ arrayBuffer, dataUrl }) => {
      const blob = new Blob([arrayBuffer], { type: 'image/jpeg' }); // Use a generic image MIME type or the original file type
      const id = await saveImageBlob(blob);
      // Store only the ID and a small preview dataUrl in chrome.storage.local
      return { id, previewDataUrl: dataUrl };
    });

    const newImageItems = await Promise.all(newImagePromises);

    // Update chrome.storage.local with the new IDs and previews
    const res = await new Promise(resolve => chrome.storage.local.get('uploadedImageIDs', resolve));
    let currentIds = res.uploadedImageIDs || [];
    
    const combinedIds = currentIds.concat(newImageItems).slice(0, 50); // Keep up to 50 images
    await new Promise(resolve => chrome.storage.local.set({ uploadedImageIDs: combinedIds }, resolve));

    showMessage('Images uploaded and saved!');
    fileInput.value = '';
    loadAll();

  }).catch(e => {
    console.error(e);
    showMessage('Error reading or saving files to IndexedDB.', 5000);
  });
});

// NEW: Updated Remove Image Logic
async function removeImage(id) {
  if (!confirm('Remove this image?')) return;
  try {
    // 1. Delete from IndexedDB
    await deleteImage(id);

    // 2. Delete the record from chrome.storage.local
    const res = await new Promise(resolve => chrome.storage.local.get('uploadedImageIDs', resolve));
    let currentIds = res.uploadedImageIDs || [];
    const newIds = currentIds.filter(item => item.id !== id);
    await new Promise(resolve => chrome.storage.local.set({ uploadedImageIDs: newIds }, resolve));

    showMessage('Image removed.');
    loadAll();
  } catch (e) {
    console.error('Error removing image:', e);
    showMessage('Error removing image.', 5000);
  }
}

// NEW: Updated Clear All Logic
clearBtn.addEventListener('click', async () => {
  if (!confirm('Remove all uploaded images? Default images will remain.')) return;
  try {
    // 1. Clear IndexedDB store
    await clearAllImages();

    // 2. Clear the IDs list from chrome.storage.local
    await new Promise(resolve => chrome.storage.local.remove(['uploadedImageIDs'], resolve));

    showMessage('Cleared uploaded images.');
    loadAll();
  } catch (e) {
    console.error('Error clearing images:', e);
    showMessage('Error clearing images.', 5000);
  }
});


// NEW FUNCTION: Render Quick Links
function renderLinks() {
  linksList.innerHTML = '';
  if (quickLinks.length === 0) {
    linksList.innerHTML = '<div style="justify-content:center;color:var(--muted);opacity:0.6;padding:10px 15px;">No quick links added yet.</div>';
    return;
  }

  quickLinks.forEach((link, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <span>${link.name} (<a href="${link.url}" target="_blank" style="color:var(--muted);text-decoration:none;">${link.url.substring(0, 30)}...</a>)</span>
      <button data-index="${index}">❌</button>
    `;
    div.querySelector('button').onclick = (e) => removeLink(index);
    linksList.appendChild(div);
  });
}

// NEW FUNCTION: Add Quick Link
function addLink() {
  const name = newLinkName.value.trim();
  let url = newLinkUrl.value.trim();

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

  quickLinks.push({ name: name, url: url });
  chrome.storage.local.set({ quickLinks: quickLinks }, () => {
    showMessage('Link added successfully!');
    renderLinks();
    newLinkName.value = '';
    newLinkUrl.value = '';
  });
}

// NEW FUNCTION: Remove Quick Link
function removeLink(index) {
  if (!confirm(`Are you sure you want to remove "${quickLinks[index].name}"?`)) return;
  quickLinks.splice(index, 1);
  chrome.storage.local.set({ quickLinks: quickLinks }, () => {
    showMessage('Link removed!');
    renderLinks();
  });
}


// Event Listeners

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


// Initialize
loadAll();