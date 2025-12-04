# How to Unlink OneDrive from motozapp-mobile Folder

OneDrive is preventing deletion because it's actively syncing the folder. The error you're seeing (`UNKNOWN: unknown error, unlink`) is caused by symbolic links in `node_modules` that OneDrive can't delete.

**See `FIX_SYMLINK_ERROR.md` for the specific fix to your error.**

Here are the general steps to unlink OneDrive:

## Method 1: Pause OneDrive Sync (Easiest)

1. **Find OneDrive icon** in your system tray (bottom right corner, near the clock)
2. **Right-click** the OneDrive icon
3. Click **"Pause syncing"** → Select **"2 hours"** (or longer)
4. **Wait 10-15 seconds** for OneDrive to release file locks
5. **Delete the folder:**
   - Open File Explorer
   - Navigate to: `C:\Users\Evann\OneDrive\Desktop\customer web 2`
   - Right-click `motozapp-mobile` folder
   - Click **"Delete"**
6. **Resume OneDrive** after deletion (right-click icon → Resume syncing)

## Method 2: Exclude Folder from OneDrive Sync (Permanent)

This stops OneDrive from syncing the `customer web 2` folder entirely:

1. **Right-click OneDrive icon** in system tray
2. Click **"Settings"**
3. Go to **"Account"** tab
4. Click **"Choose folders"**
5. **Uncheck** the `customer web 2` folder (or `Desktop` if you want to exclude the whole Desktop)
6. Click **"OK"**
7. **Wait 30 seconds** for OneDrive to stop syncing
8. **Delete the `motozapp-mobile` folder** from File Explorer

## Method 3: Move Project Outside OneDrive (Best for Development)

Move your entire project to a location outside OneDrive:

1. **Create a new folder** outside OneDrive:
   - Example: `C:\Projects\`
2. **Move the entire project:**
   - Cut `customer web 2` folder from: `C:\Users\Evann\OneDrive\Desktop\`
   - Paste it to: `C:\Projects\`
3. **OneDrive will automatically stop syncing** it
4. **Delete `motozapp-mobile`** from the new location

**Note:** After moving, update any shortcuts or IDE workspace paths to point to the new location.

## Method 4: Use OneDrive Web Interface

1. Go to [onedrive.live.com](https://onedrive.live.com)
2. Navigate to: **Desktop** → **customer web 2** → **motozapp-mobile**
3. **Delete the folder** from the web interface
4. It will sync the deletion to your local machine

## Why This Happens

OneDrive uses a file system filter driver that locks files even when the OneDrive app is closed. The only way to release these locks is to:
- Pause OneDrive sync
- Exclude the folder from sync
- Move files outside OneDrive's sync scope

## After Deletion

Once the `motozapp-mobile` folder is deleted, your web app will be ready to use:

```bash
npm run dev
```

This will start your Vite development server for the web application.

