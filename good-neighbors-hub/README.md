# Good Neighbors Hub Inventory

Inventory for The Good Neighbors Hub. Everyone with the Hub passcode shares one live inventory,
on phones and computers alike; it's stored in the Hub's Supabase project ("Good Neighbors Hub
Inventory" in the Mt. Hermon UMC organization).

## Use it on the web

Open **https://gravytaters.github.io/Test/good-neighbors-hub/** in any browser, phones included.
The first time on each device, enter the Hub passcode (ask the Hub coordinator) and, if you like,
your first name so the activity log shows who made each change. Add it to a phone's home screen
for one-tap access (Safari: Share → Add to Home Screen; Chrome: ⋮ → Add to Home screen).

Under **Shared inventory** on the left:
- **Back up** saves a copy of the whole inventory, photos included. Do it now and then.
- **Restore** replaces the shared inventory, for everyone, with a backup.
- **Change passcode** sets a new Hub passcode. Every other device is asked for it next time.
- **Lock this device** forgets the passcode on this device, for shared or public computers.

Ten wrong passcode tries from one network blocks that network for 15 minutes.

## Start it on your computer

1. Unzip the folder somewhere permanent, such as Documents. Don't run it from inside the zip.
2. Double-click the start file for your computer:
   - **Mac:** `Start Hub Inventory (Mac).command`. The first time, macOS may say it's from an
     unidentified developer: right-click the file, choose **Open**, then **Open** again.
   - **Windows:** `Start Hub Inventory (Windows).bat`. If Windows SmartScreen appears, choose
     **More info**, then **Run anyway**.
3. Your browser opens to **http://localhost:8642**. Leave the small black window open while you
   use the app; closing it stops the app. It uses the same shared inventory as the web address,
   so it needs an internet connection.

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

- The inventory is stored once, in the Hub's Supabase database, and every device with the
  passcode sees the same items. Changes show up on other open devices within a few seconds.
- The database answers only requests that carry the current Hub passcode. The passcode isn't
  stored anywhere in this repository, which is public.
- Supabase's free plan pauses a project after a week with no activity. If the app says it can't
  reach the inventory after a quiet spell, sign in to supabase.com and restore the project.
- To run without the shared database, each browser keeping its own inventory, change `mode` in
  `config.js` from `"shared"` to `"local"`.

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
| `config.js` | Where the inventory lives: the shared Supabase project, or this browser only |
| `shared-runtime.js` | Talks to the shared database: passcode screen, live updates, photos |
| `local-runtime.js` | Used instead when `config.js` says `"local"` |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline use and installing as an app |
| `vendor/` | Supabase client, barcode reader (ZXing), QR labels, Excel reader (SheetJS) |
