/*
 ===================================================================
 * PROJECT: KireiTab
 * DB MANAGER (IndexedDB for Unlimited Image Storage)
 * VERSION: v1.3.40 - Major UI update & Performance Enhancement
 * DATE: 2026-01-13
 * AUTHOR: khdxsohee
 * ===================================================================
*/

const DB_NAME = 'KireiTabDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db = null;

// Initialize DB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };

        request.onerror = (e) => {
            console.error('IndexedDB Error:', e);
            reject('DB Error');
        };
    });
}

// Ensure DB is open before operations
async function ensureDB() {
    if (!db) await initDB();
    return db;
}

// Save Image Blob
async function saveImageBlob(blob) {
    const database = await ensureDB();
    return new Promise((resolve, reject) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(blob, id);

        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
}

// Get Image Blob
async function getImageBlob(id) {
    const database = await ensureDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Delete Image
async function deleteImage(id) {
    const database = await ensureDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Clear All Images (used in reset)
async function clearAllImages() {
    const database = await ensureDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}