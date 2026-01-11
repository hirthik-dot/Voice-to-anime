"""
FastAPI application for Speech to Sign Language conversion.

Main endpoint:
- GET /listen - Records 5 seconds of audio, transcribes, and converts to sign gloss
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import audio
import gloss

# Create FastAPI app
app = FastAPI(
    title="Sign Language MVP",
    description="Real-time Speech to Sign Language using Animated Avatars",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint - API information."""
    return {
        "message": "Sign Language MVP API",
        "endpoints": {
            "/listen": "GET - Record audio and convert to sign gloss"
        }
    }

@app.get("/listen")
def listen():
    """
    Main endpoint: Record audio, transcribe, and convert to sign gloss.
    
    Process:
    1. Record 5 seconds of microphone audio
    2. Transcribe using Whisper
    3. Normalize text
    4. Convert to sign gloss (with finger-spelling fallback)
    
    Returns:
        JSON with transcribed speech and gloss sequence
    """
    audio_file = None
    
    try:
        # Step 1: Record audio
        audio_file = audio.record_audio(duration=5)
        
        # Step 2: Transcribe speech to text
        speech_text = audio.speech_to_text(audio_file)
        
        # Step 3: Convert to gloss
        result = gloss.process_speech_to_gloss(speech_text)
        
        return result
        
    except Exception as e:
        # Handle errors gracefully
        error_msg = str(e)
        print(f"Error in /listen endpoint: {error_msg}")
        
        # Return error response
        raise HTTPException(
            status_code=500,
            detail=f"Error processing audio: {error_msg}"
        )
    
    finally:
        # Clean up temporary audio file
        if audio_file:
            audio.cleanup_audio_file(audio_file)

@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}

# Run with: uvicorn app:app --reload
# Or: python -m uvicorn app:app --reload


