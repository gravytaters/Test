# Good Neighbors Hub Inventory

Inventory for The Good Neighbors Hub, run on your own computer. Everything it needs is in this
folder; your inventory is saved in the browser on this computer.

## Start it

1. Unzip the folder somewhere permanent, such as Documents. Don't run it from inside the zip.
2. Double-click the start file for your computer:
   - **Mac:** `Start Hub Inventory (Mac).command`. The first time, macOS may say it's from an
     unidentified developer: right-click the file, choose **Open**, then **Open** again.
   - **Windows:** `Start Hub Inventory (Windows).bat`. If Windows SmartScreen appears, choose
     **More info**, then **Run anyway**.
3. Your browser opens to **http://localhost:8642**. Leave the small black window open while you
   use the app; closing it stops the app.

The start files need Python, which most Macs have. On Windows, install it free from
python.org (tick "Add python.exe to PATH" during setup). Without Python, the start file opens
`index.html` directly instead: everything works except installing it as an app and working
offline.

## Install it as an app

With the app open at http://localhost:8642 in **Chrome or Edge**, click the install icon at the
right end of the address bar (or **⋮ → Cast, save and share → Install page as app**). You get a
Good Neighbors Hub icon on your desktop, Start menu or Dock, and it opens in its own window. Run
the start file first whenever you use it.

## Your data

- The inventory lives in **this browser on this computer**. Another computer, another browser,
  or opening `index.html` directly instead of through the start file each starts empty.
- Use **Back up** (left side, under Folders) regularly and keep the file somewhere safe, such as
  Google Drive. **Restore** loads a backup and replaces what's in the browser.
- Clearing your browser's history or site data for localhost **erases the inventory**. Back up
  first.
- To bring over what you entered on claude.ai, click **Restore** and choose
  `starter-backup-from-claude.json` (made Oct 27, 2026; it has the BIC razors).

## Scanning and lookups

- **Scan** opens the camera: hold the barcode or QR code inside the box. The first time, allow
  camera access when the browser asks. You can still use a photo, or type the code.
- Unknown barcodes are looked up on UPCitemdb (about 100 free lookups a day) and Open Food
  Facts. Lookups need an internet connection; everything else works offline.
- **Import** reads Excel or CSV files, including the Hub's existing inventory spreadsheet.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The app |
| `local-runtime.js` | Saves the inventory and photos in this browser |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline use and installing as an app |
| `vendor/` | Barcode reader (ZXing), QR labels, Excel reader (SheetJS) |
| `starter-backup-from-claude.json` | The inventory from the claude.ai version |
