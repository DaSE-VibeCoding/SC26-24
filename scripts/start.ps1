$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonPath)) {
    throw "Create .venv and install requirements.txt first."
}

Start-Process -WindowStyle Hidden -FilePath $pythonPath -ArgumentList "-m", "uvicorn", "backend.app:app", "--reload", "--port", "8000" -WorkingDirectory $projectRoot
Start-Process -WindowStyle Hidden -FilePath "npm.cmd" -ArgumentList "run", "dev", "--", "--host", "127.0.0.1" -WorkingDirectory (Join-Path $projectRoot "frontend")
Write-Host "AlphaScope started: http://localhost:5173 (API: http://localhost:8000/docs)"
