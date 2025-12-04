# Fix: "UNKNOWN: unknown error, unlink" Error

You're seeing this error because OneDrive can't delete symbolic links (symlinks) in the `node_modules` folder. These are special file system links that npm creates.

## Quick Fix (Recommended)

When you see the error dialog with "Retry" and "Cancel" buttons:

1. **Click "Cancel"** on the error dialog
2. **Right-click OneDrive icon** in system tray (bottom right)
3. Click **"Pause syncing"** → **"2 hours"**
4. **Wait 15-20 seconds** for OneDrive to release file locks
5. **Try deleting again** from File Explorer
6. If you still get errors, **click "Skip"** for each problematic file
7. The folder will eventually delete (even if some symlinks remain)

## Alternative: Delete via Command Prompt

1. **Pause OneDrive sync** (right-click icon → Pause syncing → 2 hours)
2. **Wait 15 seconds**
3. **Open Command Prompt as Administrator:**
   - Press `Win + X`
   - Click "Windows Terminal (Admin)" or "Command Prompt (Admin)"
4. **Run these commands:**
   ```cmd
   cd "C:\Users\Evann\OneDrive\Desktop\customer web 2"
   rmdir /s /q motozapp-mobile
   ```
5. If it still fails, the symlinks are locked. Continue with manual deletion.

## Manual Deletion (Most Reliable)

1. **Pause OneDrive sync** (right-click icon → Pause syncing → 2 hours)
2. **Wait 20 seconds**
3. **Open File Explorer**
4. **Navigate to:** `C:\Users\Evann\OneDrive\Desktop\customer web 2`
5. **Right-click `motozapp-mobile` folder**
6. **Click "Delete"**
7. **If error appears:**
   - Click **"Skip"** for the problematic file
   - Repeat until folder is deleted
   - Some symlinks may remain, but the folder structure will be gone

## Why This Happens

- `node_modules` contains symbolic links (symlinks) created by npm
- OneDrive's file system filter can't properly handle these symlinks
- The symlinks point to files that may not exist or are in different locations
- OneDrive locks these files during sync, preventing deletion

## After Deletion

Once the folder is deleted (or mostly deleted), your web app is ready:

```bash
npm run dev
```

**Note:** If a few leftover symlink files remain, they won't affect your web app. The important thing is that the `motozapp-mobile` folder structure is removed.

