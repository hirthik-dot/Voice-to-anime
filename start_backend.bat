@echo off
REM Windows batch script to start the backend server
REM Make sure you've activated your virtual environment first!

echo Starting Sign Language MVP Backend...
echo.
echo Make sure you've:
echo 1. Created and activated a virtual environment
echo 2. Installed dependencies: pip install -r backend/requirements.txt
echo.

cd backend
uvicorn app:app --reload

pause








