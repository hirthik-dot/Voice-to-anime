# Sign Language MVP - Real-time Speech to Sign Language

A complete MVP that converts speech to sign language using animated 3D avatars. Built with FastAPI, Whisper, and Three.js.

## Features

- 🎤 **Speech Recognition**: Records 5 seconds of audio and transcribes using Whisper (offline)
- 📝 **Text Normalization**: Removes fillers and normalizes text
- 🤟 **Sign Language Conversion**: Converts words to sign gloss using a dictionary
- ✋ **Finger-spelling Fallback**: Automatically finger-spells unknown words
- 🎭 **3D Avatar Animation**: Displays animated 3D avatar performing signs
- 🌐 **Offline-capable**: No cloud APIs required
- 🪟 **Windows Compatible**: Works on Windows, macOS, and Linux

## Project Structure

```
sign-language-mvp/
│
├── backend/
│   ├── app.py              # FastAPI application
│   ├── audio.py            # Audio recording and Whisper transcription
│   ├── gloss.py            # Text to sign gloss conversion
│   ├── isl_gloss.json      # Sign language dictionary
│   └── requirements.txt    # Python dependencies
│
└── frontend/
    ├── index.html          # Main HTML page
    ├── avatar.js           # Frontend logic and 3D avatar
    ├── style.css           # Styling
    └── assets/
        └── animations/     # GLB animation files
            ├── POSE.glb    # Base avatar model
            ├── A.glb       # Letter A animation
            ├── GOOD_MORNING.glb
            └── ...
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Microphone connected to your computer
- Modern web browser (Chrome, Firefox, Edge)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   **Note:** Installing Whisper and PyTorch may take several minutes. This is normal.

5. **Start the backend server:**
   ```bash
   uvicorn app:app --reload
   ```
   
   The server will start on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Serve the frontend:**
   
   You can use any static file server. Here are a few options:
   
   **Option 1: Python HTTP Server**
   ```bash
   python -m http.server 8080
   ```
   
   **Option 2: Node.js http-server**
   ```bash
   npx http-server -p 8080
   ```
   
   **Option 3: VS Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

3. **Open in browser:**
   ```
   http://localhost:8080
   ```

## Usage

1. **Start the backend server** (see Backend Setup above)

2. **Open the frontend** in your browser (see Frontend Setup above)

3. **Click "Start Listening"** button

4. **Speak into your microphone** for 5 seconds

5. **View results:**
   - Transcribed speech appears in the top-left
   - Sign gloss sequence appears in the top-right
   - 3D avatar animates the signs in the bottom section

## How It Works

1. **Audio Recording**: Records 5 seconds of audio from your microphone
2. **Speech Recognition**: Uses Whisper to convert audio to text (offline)
3. **Text Normalization**: 
   - Converts to lowercase
   - Removes fillers (um, uh, er, etc.)
   - Removes punctuation
4. **Gloss Conversion**:
   - Looks up each word in `isl_gloss.json` dictionary
   - If found, uses the sign gloss
   - If not found, finger-spells the word (splits into letters)
5. **Animation**: Plays corresponding GLB animation files for each gloss

## Extending the Dictionary

To add more signs, edit `backend/isl_gloss.json`:

```json
{
  "word": "GLOSS_NAME",
  "another word": "ANOTHER_GLOSS"
}
```

**Example:**
```json
{
  "hello": "HELLO",
  "world": "WORLD"
}
```

Then add corresponding animation files:
- `frontend/assets/animations/HELLO.glb`
- `frontend/assets/animations/WORLD.glb`

## API Endpoints

### `GET /listen`
Records audio, transcribes, and converts to sign gloss.

**Response:**
```json
{
  "speech": "hello world",
  "gloss": ["HELLO", "W", "O", "R", "L", "D", "MAINTAIN"]
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Troubleshooting

### Backend Issues

**Problem:** `pyaudio` installation fails on Windows
- **Solution:** Install using pre-built wheel:
  ```bash
  pip install pipwin
  pipwin install pyaudio
  ```

**Problem:** Whisper model download is slow
- **Solution:** This is normal on first run. The model is downloaded once and cached.

**Problem:** Microphone not detected
- **Solution:** Check microphone permissions in Windows Settings → Privacy → Microphone

### Frontend Issues

**Problem:** Avatar doesn't load
- **Solution:** Check browser console for errors. Ensure `POSE.glb` exists in `frontend/assets/animations/`

**Problem:** CORS errors
- **Solution:** Ensure backend is running and CORS is enabled (already configured in `app.py`)

**Problem:** Animations don't play
- **Solution:** Check that animation GLB files exist for the gloss names. Missing animations will show placeholder blocks.

**Problem:** GLTFLoader texture warnings (blob URLs)
- **Solution:** These warnings are often non-critical. The GLB files contain embedded textures as blob URLs. The loading manager is configured to handle these gracefully. If textures still don't render, check that GLB files are valid and contain embedded textures.

## Technical Details

- **Backend**: FastAPI, Whisper (base model), PyAudio
- **Frontend**: Vanilla JavaScript, Three.js (v0.152.2)
- **Audio Format**: WAV, 16kHz, mono
- **3D Format**: GLB (glTF binary)

## License

This project is provided as-is for educational purposes.

## Contributing

Feel free to extend this MVP:
- Add more signs to the dictionary
- Improve animation timing
- Add more avatar models
- Enhance UI/UX

---

**Built with ❤️ for accessibility**

