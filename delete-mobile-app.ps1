# Simple script to delete motozapp-mobile folder
$folder = "motozapp-mobile"

Write-Host "Stopping OneDrive processes..." -ForegroundColor Yellow
Get-Process -Name "OneDrive*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Attempting to delete folder..." -ForegroundColor Yellow
Remove-Item -Path $folder -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path $folder) {
    Write-Host ""
    Write-Host "FAILED: OneDrive is blocking deletion" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please do this manually:" -ForegroundColor Yellow
    Write-Host "1. Right-click OneDrive icon -> Pause syncing -> 2 hours" -ForegroundColor White
    Write-Host "2. Delete the 'motozapp-mobile' folder from File Explorer" -ForegroundColor White
} else {
    Write-Host "SUCCESS: Folder deleted!" -ForegroundColor Green
}

