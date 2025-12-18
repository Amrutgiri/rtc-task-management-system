# Bulk Import Quick Test Script
# Save this as: test-bulk-import.ps1
# Run from: backend directory

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================

# Get your token by logging into the app and copying from localStorage
# Or use: curl -X POST http://localhost:5002/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"yourpassword"}'
$TOKEN = "PASTE_YOUR_AUTH_TOKEN_HERE"

# Get a project ID from: curl -X GET http://localhost:5002/projects -H "Authorization: Bearer $TOKEN"
# Copy any _id value (MongoDB ObjectID format, e.g., "675abc123def456789")
$PROJECT_ID = "PASTE_YOUR_PROJECT_ID_HERE"

# ============================================
# SETUP
# ============================================
$BASE_URL = "http://localhost:5002"
$SAMPLES_DIR = "samples"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BULK CSV IMPORT TEST TOOL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if token is set
if ($TOKEN -eq "PASTE_YOUR_AUTH_TOKEN_HERE") {
    Write-Host "❌ ERROR: Please update `$TOKEN in this script first!" -ForegroundColor Red
    Write-Host "   Get your token by logging into the app" -ForegroundColor Yellow
    exit 1
}

# Check if project ID is set
if ($PROJECT_ID -eq "PASTE_YOUR_PROJECT_ID_HERE") {
    Write-Host "❌ ERROR: Please update `$PROJECT_ID in this script first!" -ForegroundColor Red
    Write-Host "   Get a project ID from your database" -ForegroundColor Yellow
    exit 1
}

# ============================================
# UPDATE TASKS CSV WITH PROJECT ID
# ============================================
Write-Host "📝 Updating tasks_sample.csv with Project ID..." -ForegroundColor Yellow

$tasksFile = "$SAMPLES_DIR\tasks_sample.csv"
$tasksContent = Get-Content $tasksFile -Raw
$tasksContent = $tasksContent -replace "REPLACE_WITH_PROJECT_ID", $PROJECT_ID
$tasksContent | Set-Content $tasksFile

Write-Host "✅ tasks_sample.csv updated with project: $PROJECT_ID`n" -ForegroundColor Green

# ============================================
# TEST 1: IMPORT USERS
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST 1: IMPORT USERS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $userResponse = Invoke-RestMethod -Uri "$BASE_URL/import/users" `
        -Method Post `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -Form @{file=Get-Item "$SAMPLES_DIR\users_sample.csv"}
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Imported: $($userResponse.imported) users" -ForegroundColor White
    Write-Host "   Total:    $($userResponse.total) rows`n" -ForegroundColor White
    
    if ($userResponse.errors) {
        Write-Host "⚠️  ERRORS FOUND:" -ForegroundColor Yellow
        $userResponse.errors | ForEach-Object {
            Write-Host "   Row $($_.row): $($_.error)" -ForegroundColor Red
        }
        Write-Host ""
    }
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# ============================================
# TEST 2: IMPORT TASKS
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST 2: IMPORT TASKS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $taskResponse = Invoke-RestMethod -Uri "$BASE_URL/import/tasks" `
        -Method Post `
        -Headers @{Authorization="Bearer $TOKEN"} `
        -Form @{file=Get-Item "$SAMPLES_DIR\tasks_sample.csv"}
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Imported: $($taskResponse.imported) tasks" -ForegroundColor White
    Write-Host "   Total:    $($taskResponse.total) rows`n" -ForegroundColor White
    
    if ($taskResponse.errors) {
        Write-Host "⚠️  ERRORS FOUND:" -ForegroundColor Yellow
        $taskResponse.errors | ForEach-Object {
            Write-Host "   Row $($_.row): $($_.error)" -ForegroundColor Red
        }
        Write-Host ""
    }
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# ============================================
# SUMMARY
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check your database to verify users were created" -ForegroundColor White
Write-Host "2. Check your database to verify tasks were created" -ForegroundColor White
Write-Host "3. Try importing the same file again (should get duplicate errors)" -ForegroundColor White
Write-Host "4. Edit the CSV files to test validation`n" -ForegroundColor White
