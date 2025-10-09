// options.js
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
}

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


// Initialize
loadAll();