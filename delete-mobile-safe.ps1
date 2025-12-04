# Safe deletion script that handles OneDrive symbolic link issues
$folder = "motozapp-mobile"

Write-Host "=== Safe Deletion of motozapp-mobile ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $folder)) {
    Write-Host "Folder already deleted!" -ForegroundColor Green
    exit 0
}

Write-Host "Step 1: Stopping OneDrive..." -ForegroundColor Yellow
Get-Process -Name "OneDrive*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "  OneDrive stopped." -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Deleting node_modules first (this is where the error occurs)..." -ForegroundColor Yellow
$nodeModulesPath = Join-Path $folder "node_modules"
if (Test-Path $nodeModulesPath) {
    try {
        # Use cmd rmdir which handles symlinks better
        $result = cmd /c "rmdir /s /q `"$nodeModulesPath`" 2>&1"
        if (-not (Test-Path $nodeModulesPath)) {
            Write-Host "  ✓ node_modules deleted." -ForegroundColor Green
        } else {
            Write-Host "  ⚠ node_modules partially deleted (some files may be locked)." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠ Could not delete node_modules: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  node_modules not found." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 3: Deleting .expo folder..." -ForegroundColor Yellow
$expoPath = Join-Path $folder ".expo"
if (Test-Path $expoPath) {
    Remove-Item -Path $expoPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  .expo deleted." -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 4: Deleting remaining files..." -ForegroundColor Yellow
try {
    # Delete files individually, skipping errors
    Get-ChildItem -Path $folder -File -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            Remove-Item -Path $_.FullName -Force -ErrorAction Stop
        } catch {
            # Skip files that can't be deleted
        }
    }
    
    # Delete empty directories
    Get-ChildItem -Path $folder -Directory -Recurse -Force -ErrorAction SilentlyContinue | 
        Sort-Object -Property FullName -Descending | ForEach-Object {
        try {
            Remove-Item -Path $_.FullName -Force -ErrorAction Stop
        } catch {
            # Skip directories that can't be deleted
        }
    }
    
    # Finally, try to delete the main folder
    Remove-Item -Path $folder -Recurse -Force -ErrorAction Stop
    Write-Host "  ✓ Folder deleted successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "  ⚠ Some files could not be deleted." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Remaining files may be locked by OneDrive." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Cyan
    Write-Host "1. Right-click OneDrive icon -> Pause syncing -> 2 hours" -ForegroundColor White
    Write-Host "2. Wait 15 seconds" -ForegroundColor White
    Write-Host "3. Delete the folder from File Explorer" -ForegroundColor White
    Write-Host "4. If it still fails, click 'Skip' for problematic files" -ForegroundColor White
}

Write-Host ""
if (Test-Path $folder) {
    Write-Host "⚠ Folder still exists. Please pause OneDrive and delete manually." -ForegroundColor Red
} else {
    Write-Host "✓ SUCCESS: motozapp-mobile folder deleted!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your web app is ready. Run: npm run dev" -ForegroundColor Cyan
}

