# Start-All.ps1
# Script to start all components of the DrawWave application

# Define colors for output
$infoColor = "Cyan"
$errorColor = "Red"
$successColor = "Green"
$highlightColor = "Yellow"

# Function to display formatted messages
function Write-ColorOutput {
    param (
        [string]$message,
        [string]$color = "White"
    )
    Write-Host $message -ForegroundColor $color
}

# Print welcome message
Write-ColorOutput "====================================" $highlightColor
Write-ColorOutput "  DrawWave - Starting All Services" $highlightColor
Write-ColorOutput "====================================" $highlightColor
Write-ColorOutput ""

# Define paths (adjust if needed)
$rootPath = $PSScriptRoot
$pythonPath = Join-Path $rootPath "python"
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"

# Check if paths exist
if (-not (Test-Path $pythonPath)) {
    Write-ColorOutput "Error: Python directory not found at $pythonPath" $errorColor
    exit 1
}
if (-not (Test-Path $backendPath)) {
    Write-ColorOutput "Error: Backend directory not found at $backendPath" $errorColor
    exit 1
}
if (-not (Test-Path $frontendPath)) {
    Write-ColorOutput "Error: Frontend directory not found at $frontendPath" $errorColor
    exit 1
}

# Define commands to start each component
$pythonCommand = {
    param($path)
    Set-Location $path
    Write-Host "Starting Python WebSocket server..." -ForegroundColor Cyan
    try {
        python web_main.py
    }
    catch {
        Write-Host "Error starting Python server: $_" -ForegroundColor Red
    }
}

$backendCommand = {
    param($path)
    Set-Location $path
    Write-Host "Starting Node.js backend server..." -ForegroundColor Cyan
    try {
        npm start
    }
    catch {
        Write-Host "Error starting backend server: $_" -ForegroundColor Red
    }
}

$frontendCommand = {
    param($path)
    Set-Location $path
    Write-Host "Starting React frontend..." -ForegroundColor Cyan
    try {
        npm run dev
    }
    catch {
        Write-Host "Error starting frontend: $_" -ForegroundColor Red
    }
}

# Start all processes in new PowerShell windows
try {
    Write-ColorOutput "Starting all services in separate windows..." $infoColor
    
    # Start Python WebSocket server
    Start-Process powershell -ArgumentList "-NoExit", "-Command & {Set-Location '$pythonPath'; Write-Host 'Starting Python WebSocket server...' -ForegroundColor Cyan; python web_main.py}"
    Write-ColorOutput "Python WebSocket server process started." $successColor
    
    # Start Node.js backend
    Start-Process powershell -ArgumentList "-NoExit", "-Command & {Set-Location '$backendPath'; Write-Host 'Starting Node.js backend server...' -ForegroundColor Cyan; npm start}"
    Write-ColorOutput "Node.js backend process started." $successColor
    
    # Start React frontend
    Start-Process powershell -ArgumentList "-NoExit", "-Command & {Set-Location '$frontendPath'; Write-Host 'Starting React frontend...' -ForegroundColor Cyan; npm run dev}"
    Write-ColorOutput "React frontend process started." $successColor

    Write-ColorOutput "`nAll processes started successfully!" $successColor
    Write-ColorOutput "To stop all services, close their respective terminal windows." $infoColor
}
catch {
    Write-ColorOutput "Error launching processes: $_" $errorColor
    exit 1
}
