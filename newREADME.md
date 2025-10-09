# KireiTab - Anime New Tab Extension

An elegant Chrome extension that replaces your new tab page with beautiful anime backgrounds, a clean interface, quick links, and inspirational quotes.

## ✨ Features

- **Custom Backgrounds**: Upload unlimited HD anime wallpapers (stored in IndexedDB - no 5MB limit!)
- **Default Images**: Comes with 3 bundled anime backgrounds
- **Randomization**: Show a different random image on each new tab
- **Auto-Rotation**: Automatically cycle through images at set intervals
- **Quick Search**: Google search or direct URL navigation
- **Quick Links**: Customize your favorite websites for fast access
- **Time Display**: Choose between 12-hour or 24-hour format
- **Visual Effects**: Adjustable background blur and overlay darkness
- **Anime Quotes**: Random inspirational quotes from popular anime
- **Keyboard Shortcut**: Press `/` to focus the search bar

## 🚀 Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the extension folder
5. Add your default images to the `images/` folder (1.jpg, 2.jpg, 3.jpg)

## 📁 File Structure

```
KireiTab/
├── manifest.json          # Extension manifest
├── newtab.html           # New tab page HTML
├── newtab.js             # New tab logic
├── options.html          # Settings page HTML
├── options.js            # Settings page logic
├── db.js                 # IndexedDB helper
├── styles.css            # Styling
└── images/               # Default background images
    ├── 1.jpg
    ├── 2.jpg
    └── 3.jpg
```

## 🔧 Technical Details

### Storage Architecture

**IndexedDB (KireiDB)**
- Stores all uploaded image blobs
- No size limit (typically 50MB+ available)
- Fast retrieval using image IDs
- Automatic cleanup on deletion

**chrome.storage.local**
- Stores only image IDs (not the actual images)
- Stores user settings (blur, overlay, rotation, etc.)
- Stores quick links
- Stays well under the 5MB limit

### How It Works

1. **Image Upload**: 
   - User uploads image → Stored as blob in IndexedDB
   - Returns auto-generated ID → ID saved to chrome.storage.local
   - Preview created using `URL.createObjectURL()`

2. **Image Display**:
   - Load image IDs from chrome.storage.local
   - Fetch blob from IndexedDB using ID
   - Create temporary object URL for display
   - Clean up object URL on change to prevent memory leaks

3. **Image Deletion**:
   - Remove blob from IndexedDB
   - Remove ID from chrome.storage.local
   - Revoke object URL if currently displayed

### Memory Management

The extension properly manages memory by:
- Revoking object URLs when images change
- Cleaning up on page unload
- Only loading the current image (not all images at once)
- Efficient blob storage in IndexedDB

## ⚙️ Settings

### Background Images
- Upload multiple images at once
- Supported formats: JPG, PNG, WebP, etc.
- Recommended: HD quality (1920x1080 or higher)
- Remove individual images or clear all at once

### System Settings
- **Time Format**: Choose 12-hour (with AM/PM) or 24-hour format
- **Rotate Interval**: Auto-rotate images (0 = disabled)
- **Randomize**: Show random image on each new tab load
- **Background Blur**: Add blur effect (0-12px)
- **Overlay Darkness**: Adjust dark overlay for text readability (0.0-1.0)

### Quick Links
- Add unlimited quick links
- Auto-prepends `https://` if missing
- Click link name to visit, click × to remove
- Default links: Google, GitHub, YouTube

## 🎨 Customization

### Adding Default Images

1. Place your images in the `images/` folder
2. Name them: `1.jpg`, `2.jpg`, `3.jpg`
3. Update `DEFAULT_IMAGES` array in both `newtab.js` and `options.js`:

```javascript
const DEFAULT_IMAGES = [
  { path: 'images/1.jpg', name: 'Default 1' },
  { path: 'images/2.jpg', name: 'Default 2' },
  { path: 'images/3.jpg', name: 'Default 3' },
  { path: 'images/4.jpg', name: 'Default 4' }, // Add more
];
```

### Adding Custom Quotes

Edit the `quotes` array in `newtab.js`:

```javascript
const quotes = [
  `"Your custom quote here" — Character Name`,
  `"Another quote" — Another Character`,
];
```

### Styling

Modify `styles.css` to change:
- Colors and theme
- Font sizes and families
- Card layouts and spacing
- Button styles and hover effects

## 🐛 Troubleshooting

### Images not showing
1. Check browser console (F12) for errors
2. Verify IndexedDB is enabled in browser settings
3. Check if images exist in `images/` folder
4. Try clearing and re-uploading images

### Random mode not working
1. Open Options → Check "Randomize" checkbox
2. Click "Save Settings"
3. Open a new tab (should show different image each time)

### Storage quota exceeded
- IndexedDB typically has 50MB+ available
- Check chrome://quota-internals/ for storage usage
- Clear old images if needed

### Images not rotating
1. Set rotation interval > 0 (e.g., 10 seconds)
2. Save settings
3. Must have more than 1 image total

## 💡 Tips

- Use high-quality anime wallpapers for best results
- Keep blur low (0-3px) for sharp backgrounds
- Adjust overlay darkness for text readability
- Use keyboard shortcut `/` for quick search access
- Disable randomize for consistent first image

## 🔐 Privacy

- All data stored locally in your browser
- No internet connection required (except for search)
- No data collection or analytics
- No external API calls
- Images never leave your device

## 📝 Development

### Key Functions

**newtab.js**
- `loadImages()` - Loads and combines default + uploaded images
- `setBackground()` - Displays image from path or IndexedDB
- `applySettings()` - Applies visual settings and rotation
- `updateClock()` - Updates time and greeting

**options.js**
- `renderPreviews()` - Shows thumbnails of all images
- `fileInput.onChange` - Handles image uploads
- `saveBtn.onClick` - Saves settings to storage
- `addLink()` / `removeLink()` - Manages quick links

**db.js**
- `init()` - Opens/creates IndexedDB database
- `saveImage()` - Stores blob, returns ID
- `getImage()` - Retrieves blob by ID
- `deleteImage()` - Removes blob by ID

### Future Enhancements

- [ ] Drag-and-drop image upload
- [ ] Image filters (brightness, contrast, saturation)
- [ ] Custom CSS themes
- [ ] Widget system (weather, todo list, etc.)
- [ ] Import/export settings
- [ ] Cloud sync (optional)
- [ ] Multiple image collections
- [ ] Slideshow mode with transitions

## 📄 License

This project is open source. Feel free to modify and distribute.

## 🙏 Credits

Created with ❤️ for anime fans everywhere.

Special thanks to the anime community for inspiration!

---

**Enjoy your beautiful new tab experience! 🎨✨**