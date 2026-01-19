"""
Text to Sign Language Gloss conversion module.

This module handles:
- Text normalization (lowercase, remove fillers)
- Converting words to sign gloss using dictionary
- Fallback to finger-spelling for unknown words
"""

import json
import os
import re

# Load gloss dictionary
_gloss_dict = None

def load_gloss_dictionary():
    """Load sign language gloss dictionary from JSON file."""
    global _gloss_dict
    if _gloss_dict is None:
        # Get path to isl_gloss.json (same directory as this file)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(current_dir, "isl_gloss.json")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            _gloss_dict = json.load(f)
        
        print(f"Loaded {len(_gloss_dict)} gloss entries from dictionary")
    
    return _gloss_dict

def normalize_text(text):
    """
    Normalize text for sign language conversion.
    
    - Convert to lowercase
    - Remove common fillers (um, uh, er, etc.)
    - Remove extra whitespace
    - Remove punctuation
    
    Args:
        text: Raw transcribed text
    
    Returns:
        Normalized text string
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove common fillers
    fillers = ['um', 'uh', 'er', 'ah', 'hmm', 'well', 'like', 'you know']
    for filler in fillers:
        # Remove filler as whole word
        text = re.sub(r'\b' + re.escape(filler) + r'\b', '', text, flags=re.IGNORECASE)
    
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text.strip()

def word_to_gloss(word, gloss_dict):
    """
    Convert a single word to sign gloss.
    
    Args:
        word: Word to convert
        gloss_dict: Dictionary mapping words to glosses
    
    Returns:
        List of gloss tokens (either sign or finger-spelled letters)
    """
    word = word.strip().lower()
    
    # Check if word exists in dictionary
    if word in gloss_dict:
        return [gloss_dict[word]]
    
    # Fallback: finger-spell the word
    # Split into individual letters
    letters = list(word.upper())
    return letters

def text_to_gloss(text):
    """
    Convert normalized text to sign language gloss sequence.
    
    Supports both single words and multi-word phrases (e.g., "good morning").
    
    Args:
        text: Normalized text string
    
    Returns:
        List of gloss tokens (signs or letters)
    """
    if not text:
        return ["SILENCE"]
    
    gloss_dict = load_gloss_dictionary()
    words = text.split()
    
    gloss_sequence = []
    i = 0
    
    while i < len(words):
        # Try to match multi-word phrases first (up to 3 words)
        matched = False
        for phrase_length in range(3, 0, -1):
            if i + phrase_length <= len(words):
                phrase = ' '.join(words[i:i + phrase_length])
                if phrase in gloss_dict:
                    gloss_sequence.append(gloss_dict[phrase])
                    i += phrase_length
                    matched = True
                    break
        
        # If no phrase matched, try single word
        if not matched:
            word = words[i]
            if word:  # Skip empty strings
                gloss_tokens = word_to_gloss(word, gloss_dict)
                gloss_sequence.extend(gloss_tokens)
            i += 1
    
    # Add maintain sign at the end to hold the last sign
    if gloss_sequence:
        gloss_sequence.append("MAINTAIN")
    else:
        gloss_sequence = ["SILENCE"]
    
    return gloss_sequence

def process_speech_to_gloss(speech_text):
    """
    Complete pipeline: normalize text and convert to gloss.
    
    Args:
        speech_text: Raw transcribed speech text
    
    Returns:
        Dictionary with normalized speech and gloss sequence
    """
    normalized = normalize_text(speech_text)
    gloss = text_to_gloss(normalized)
    
    return {
        "speech": normalized,
        "gloss": gloss
    }


