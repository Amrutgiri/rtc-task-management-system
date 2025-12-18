# Create frontend .env file for local development
# Run this script from the TMS root directory

$envContent = @"
# Frontend Environment Variables (Local Development)

# Backend API URL - points to local backend
# Important: Include /api at the end
VITE_API_URL=http://localhost:3232/api
"@

$frontendEnvPath = ".\frontend\.env"

# Create the .env file
$envContent | Out-File -FilePath $frontendEnvPath -Encoding utf8 -NoNewline

Write-Host "✅ Created frontend .env file at: $frontendEnvPath" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify backend .env has FRONTEND_ORIGIN=http://localhost:5173" -ForegroundColor Cyan
Write-Host "2. Restart both backend and frontend servers" -ForegroundColor Cyan
Write-Host "3. Test Socket.IO connection" -ForegroundColor Cyan
