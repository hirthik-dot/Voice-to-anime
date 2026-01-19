@echo off
REM Windows batch script to start the frontend server

echo Starting Sign Language MVP Frontend...
echo.
echo Frontend will be available at: http://localhost:8080
echo Make sure the backend is running on http://localhost:8000
echo.

cd frontend
python -m http.server 8080

pause








