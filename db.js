// db.js - IndexedDB Helper for KireiTab
// Handles storage and retrieval of large image files using IndexedDB
// This avoids the 5MB chrome.storage.local limit

window.KireiDB = {
  db: null,
  dbName: "KireiDB",
  storeName: "imagesStore",
  version: 1,

  /**
   * Initialize IndexedDB connection
   * Creates the database and object store if they don't exist
   * @returns {Promise<IDBDatabase>} Database instance
   */
  async init() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      // Handle database upgrade (first-time creation or version change)
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          // Create object store with auto-incrementing ID
          db.createObjectStore(this.storeName, { 
            keyPath: "id", 
            autoIncrement: true 
          });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        
        // Add error handler for the database connection
        this.db.onerror = (event) => {
          console.error('[KireiDB] Database error:', event.target.error);
        };
        
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('[KireiDB] Failed to open database:', e.target.error);
        reject(e.target.error);
      };

      request.onblocked = (e) => {
        console.warn('[KireiDB] Database opening blocked. Close other tabs using this extension.');
      };
    });
  },

  /**
   * Save an image blob to IndexedDB
   * @param {Blob} blob - Image file blob to store
   * @returns {Promise<number>} Auto-generated ID of the stored image
   */
  async saveImage(blob) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        
        // Store blob with timestamp for potential future cleanup
        const data = { blob, timestamp: Date.now() };
        const req = store.add(data);
        
        req.onsuccess = () => {
          resolve(req.result); // Returns auto-generated ID
        };
        
        req.onerror = (e) => {
          console.error('[KireiDB] Error saving image:', e.target.error);
          reject(e.target.error);
        };
        
        tx.onerror = (e) => {
          console.error('[KireiDB] Transaction error:', e.target.error);
        };
      } catch (error) {
        console.error('[KireiDB] Exception in saveImage:', error);
        reject(error);
      }
    });
  },

  /**
   * Retrieve an image blob from IndexedDB by ID
   * @param {number} id - Image ID to retrieve
   * @returns {Promise<Blob|null>} Image blob or null if not found
   */
  async getImage(id) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);
        
        req.onsuccess = () => {
          const result = req.result;
          if (result && result.blob) {
            resolve(result.blob);
          } else {
            resolve(null);
          }
        };
        
        req.onerror = (e) => {
          console.error('[KireiDB] Error retrieving image:', e.target.error);
          reject(e.target.error);
        };
      } catch (error) {
        console.error('[KireiDB] Exception in getImage:', error);
        reject(error);
      }
    });
  },

  /**
   * Delete an image from IndexedDB by ID
   * @param {number} id - Image ID to delete
   * @returns {Promise<void>}
   */
  async deleteImage(id) {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(this.storeName, "readwrite");
        const req = tx.objectStore(this.storeName).delete(id);
        
        req.onsuccess = () => {
          resolve();
        };
        
        req.onerror = (e) => {
          console.error('[KireiDB] Error deleting image:', e.target.error);
          reject(e.target.error);
        };
      } catch (error) {
        console.error('[KireiDB] Exception in deleteImage:', error);
        reject(error);
      }
    });
  },

  /**
   * Get all stored image IDs (useful for debugging)
   * @returns {Promise<number[]>} Array of all image IDs
   */
  async getAllImageIds() {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.getAllKeys();
        
        req.onsuccess = () => {
          resolve(req.result);
        };
        
        req.onerror = (e) => {
          console.error('[KireiDB] Error getting all IDs:', e.target.error);
          reject(e.target.error);
        };
      } catch (error) {
        console.error('[KireiDB] Exception in getAllImageIds:', error);
        reject(error);
      }
    });
  }
};