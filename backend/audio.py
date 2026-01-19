"""
Audio recording and speech recognition module.

This module handles:
- Recording audio from microphone (5 seconds)
- Converting speech to text using Whisper
- Windows-compatible file handling
"""

import os
import tempfile
import wave
import pyaudio
import whisper

# Initialize Whisper model (load once, reuse)
_model = None

def get_whisper_model():
    """Load Whisper model (base model for speed, can upgrade to 'small' or 'medium' for accuracy)."""
    global _model
    if _model is None:
        # Using 'base' model - fast and good enough for MVP
        # Options: 'tiny', 'base', 'small', 'medium', 'large'
        print("Loading Whisper model... (this may take a moment)")
        _model = whisper.load_model("base")
        print("Whisper model loaded!")
    return _model

def record_audio(duration=5, sample_rate=16000, channels=1, chunk_size=1024):
    """
    Record audio from microphone.
    
    Args:
        duration: Recording duration in seconds (default: 5)
        sample_rate: Audio sample rate (default: 16000 for Whisper)
        channels: Number of audio channels (1 = mono)
        chunk_size: Buffer size for audio chunks
    
    Returns:
        Path to temporary audio file
    """
    # Audio format settings
    audio_format = pyaudio.paInt16  # 16-bit audio
    
    # Initialize PyAudio
    audio = pyaudio.PyAudio()
    
    # Open audio stream
    stream = audio.open(
        format=audio_format,
        channels=channels,
        rate=sample_rate,
        input=True,
        frames_per_buffer=chunk_size
    )
    
    print(f"Recording {duration} seconds of audio...")
    frames = []
    
    # Record audio in chunks
    for _ in range(0, int(sample_rate / chunk_size * duration)):
        data = stream.read(chunk_size)
        frames.append(data)
    
    print("Recording finished!")
    
    # Stop and close stream
    stream.stop_stream()
    stream.close()
    audio.terminate()
    
    # Create temporary WAV file (Windows-compatible)
    # Use unique filename to avoid conflicts with concurrent requests
    temp_dir = tempfile.gettempdir()
    temp_file = tempfile.NamedTemporaryFile(
        suffix='.wav',
        prefix='sign_lang_audio_',
        dir=temp_dir,
        delete=False
    ).name
    
    # Save audio to WAV file
    with wave.open(temp_file, 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(audio.get_sample_size(audio_format))
        wf.setframerate(sample_rate)
        wf.writeframes(b''.join(frames))
    
    return temp_file

def speech_to_text(audio_file_path):
    """
    Convert speech audio to text using Whisper.
    
    Args:
        audio_file_path: Path to audio file
    
    Returns:
        Transcribed text string
    """
    model = get_whisper_model()
    
    print("Transcribing audio...")
    result = model.transcribe(audio_file_path, language="en")
    text = result["text"].strip()
    
    print(f"Transcribed text: {text}")
    return text

def cleanup_audio_file(file_path):
    """Safely delete temporary audio file."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Cleaned up audio file: {file_path}")
    except Exception as e:
        print(f"Warning: Could not delete audio file {file_path}: {e}")


