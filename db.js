/*
 ===================================================================
 * PROJECT: KireiTab
 * VERSION: v1.2.3 - Major Feature Update UI & Bugs Fixed
 * DATE: 2025-10-22
 * AUTHOR: khdxsohee
 * ===================================================================
*/

const DB_NAME = 'KireiDB';
const DB_VERSION = 1;
const STORE_NAME = 'imagesStore';

/**
 * Initializes the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database object.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create an object store to hold the image blobs
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.errorCode);
            reject(new Error("Failed to open IndexedDB"));
        };
    });
}

/**
 * Saves a Blob to the IndexedDB.
 * @param {Blob} blob The image blob to save.
 * @returns {Promise<number>} A promise that resolves with the unique ID of the saved image.
 */
async function saveImageBlob(blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // We store the ID (auto-incremented) and the blob data
        const request = store.add({ blob: blob });

        request.onsuccess = (event) => {
            // The key (ID) is the result of the add operation
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("Save image error:", event.target.error);
            reject(new Error("Failed to save image to DB"));
        };
    });
}

/**
 * Retrieves an image Blob from the IndexedDB by its ID.
 * @param {number} id The ID of the image.
 * @returns {Promise<Blob|null>} A promise that resolves with the image Blob or null if not found.
 */
async function getImageBlob(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = (event) => {
            // The result will be an object { id: ..., blob: Blob }
            resolve(event.target.result ? event.target.result.blob : null);
        };

        request.onerror = (event) => {
            console.error("Get image error:", event.target.error);
            reject(new Error("Failed to retrieve image from DB"));
        };
    });
}

/**
 * Retrieves all stored image IDs from the IndexedDB.
 * @returns {Promise<number[]>} A promise that resolves with an array of image IDs.
 */
async function getAllImageIds() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys(); // Get only the keys (IDs)

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("Get all keys error:", event.target.error);
            reject(new Error("Failed to retrieve image IDs from DB"));
        };
    });
}


/**
 * Deletes an image record from the IndexedDB by its ID.
 * @param {number} id The ID of the image to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
async function deleteImage(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error("Delete image error:", event.target.error);
            reject(new Error("Failed to delete image from DB"));
        };
    });
}

/**
 * Deletes all image records from the IndexedDB.
 * @returns {Promise<void>} A promise that resolves when the store is cleared.
 */
async function clearAllImages() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error("Clear images error:", event.target.error);
            reject(new Error("Failed to clear images from DB"));
        };
    });
}