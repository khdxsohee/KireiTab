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

function showMessage(text, timeout=2500){
  msg.textContent = text;
  setTimeout(()=>msg.textContent='', timeout);
}

function renderPreviews(images){
  previewRow.innerHTML = '';
  images.forEach((dataUrl, idx) => {
    const d = document.createElement('div');
    d.style.width = '120px';
    d.style.height = '80px';
    d.style.borderRadius = '8px';
    d.style.backgroundImage = `url(${dataUrl})`;
    d.style.backgroundSize = 'cover';
    d.style.backgroundPosition = 'center';
    d.style.position = 'relative';
    d.title = 'Click to remove';
    d.onclick = () => {
      if (!confirm('Remove this image?')) return;
      chrome.storage.local.get(['animeImages'], (res) => {
        const arr = (res.animeImages || []).filter((v,i)=>i!==idx);
        chrome.storage.local.set({animeImages: arr}, ()=>loadAll());
      });
    };
    previewRow.appendChild(d);
  });
}

function loadAll(){
  chrome.storage.local.get(['animeImages','settings'], (res)=>{
    const imgs = res.animeImages || [];
    renderPreviews(imgs);
    const s = res.settings || {};
    rotateInput.value = s.rotateInterval || 0;
    randomizeCheckbox.checked = s.randomize !== false; // default true
    blurInput.value = s.blur || 0;
    blurVal.textContent = blurInput.value;
    overlayInput.value = (s.overlayOpacity !== undefined) ? s.overlayOpacity : 0.35;
    overlayVal.textContent = overlayInput.value;
  });
}

fileInput.addEventListener('change', (ev)=>{
  const files = Array.from(ev.target.files).slice(0, 25); // limit uploads
  if (!files.length) return;
  showMessage('Reading files — this may take a moment for large images...');
  const readers = files.map(f => new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result);
    r.onerror = rej;
    r.readAsDataURL(f);
  }));

  Promise.all(readers).then(results=>{
    // combine with existing
    chrome.storage.local.get(['animeImages'], (res)=>{
      const current = res.animeImages || [];
      const combined = current.concat(results).slice(0, 50); // keep up to 50 images
      chrome.storage.local.set({animeImages: combined}, ()=>{
        showMessage('Images uploaded and saved!');
        fileInput.value = '';
        loadAll();
      });
    });
  }).catch(e=>{
    console.error(e);
    showMessage('Error reading files');
  });
});

clearBtn.addEventListener('click', ()=>{
  if (!confirm('Remove all uploaded images and use defaults?')) return;
  chrome.storage.local.remove(['animeImages'], ()=>{ showMessage('Cleared'); loadAll(); });
});

saveBtn.addEventListener('click', ()=>{
  const newSettings = {
    rotateInterval: Number(rotateInput.value) || 0,
    randomize: !!randomizeCheckbox.checked,
    blur: Number(blurInput.value) || 0,
    overlayOpacity: Number(overlayInput.value) || 0.35
  };
  chrome.storage.local.set({settings: newSettings}, ()=>{
    showMessage('Settings saved');
  });
});

blurInput.addEventListener('input', ()=>blurVal.textContent = blurInput.value);
overlayInput.addEventListener('input', ()=>overlayVal.textContent = overlayInput.value);

loadAll();
