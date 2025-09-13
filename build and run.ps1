Write-Host "Building the application..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Check the errors above." -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit $LASTEXITCODE
}

Write-Host "Build successful! Starting preview server..." -ForegroundColor Green
npm run preview -- --port 2088 --host 0.0.0.0
Read-Host "Press Enter to continue"