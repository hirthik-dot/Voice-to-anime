/**
 * Avatar.js - Frontend logic for Sign Language MVP
 * 
 * Handles:
 * - API communication with backend
 * - Displaying transcribed speech
 * - Displaying gloss sequence
 * - Animated placeholder avatar blocks
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const startBtn = document.getElementById('startBtn');
const statusDiv = document.getElementById('status');
const speechOutput = document.getElementById('speechOutput');
const glossOutput = document.getElementById('glossOutput');
const avatarContainer = document.getElementById('avatarContainer');

// State
let isListening = false;
let currentAnimation = null;

/**
 * Update status message
 */
function setStatus(message, type = '') {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
}

/**
 * Clear status message
 */
function clearStatus() {
    statusDiv.textContent = '';
    statusDiv.className = 'status-message';
}

/**
 * Call backend /listen endpoint
 */
async function listenToSpeech() {
    try {
        isListening = true;
        startBtn.disabled = true;
        startBtn.querySelector('.button-text').textContent = 'Listening...';
        setStatus('Recording audio...', 'loading');

        // Call backend API
        const response = await fetch(`${API_BASE_URL}/listen`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        // Display results
        displaySpeech(data.speech);
        displayGloss(data.gloss);
        animateAvatar(data.gloss);

        setStatus('Success!', '');
        
    } catch (error) {
        console.error('Error:', error);
        setStatus(`Error: ${error.message}`, 'error');
        speechOutput.textContent = 'Error occurred. Please try again.';
        glossOutput.innerHTML = '<p class="placeholder">Error loading gloss sequence</p>';
    } finally {
        isListening = false;
        startBtn.disabled = false;
        startBtn.querySelector('.button-text').textContent = 'Start Listening';
        
        // Clear status after 3 seconds
        setTimeout(clearStatus, 3000);
    }
}

/**
 * Display transcribed speech
 */
function displaySpeech(speech) {
    if (!speech || speech.trim() === '') {
        speechOutput.textContent = '(No speech detected)';
    } else {
        speechOutput.textContent = speech;
    }
}

/**
 * Display gloss sequence as list
 */
function displayGloss(glossArray) {
    if (!glossArray || glossArray.length === 0) {
        glossOutput.innerHTML = '<p class="placeholder">No gloss sequence available</p>';
        return;
    }

    const list = document.createElement('ul');
    list.className = 'gloss-list';

    glossArray.forEach((glossItem, index) => {
        const item = document.createElement('li');
        item.className = 'gloss-item';
        item.textContent = glossItem;
        list.appendChild(item);
    });

    glossOutput.innerHTML = '';
    glossOutput.appendChild(list);
}

/**
 * Animate avatar blocks for each gloss sign
 * This is a placeholder - will be replaced with real 3D avatar later
 */
function animateAvatar(glossArray) {
    if (!glossArray || glossArray.length === 0) {
        avatarContainer.innerHTML = '<p class="placeholder">No signs to display</p>';
        return;
    }

    // Clear previous animation
    if (currentAnimation) {
        clearInterval(currentAnimation);
    }

    avatarContainer.innerHTML = '';

    let currentIndex = 0;

    // Function to show next sign
    function showNextSign() {
        // Remove active class from all blocks
        const blocks = avatarContainer.querySelectorAll('.sign-block');
        blocks.forEach(block => block.classList.remove('active'));

        if (currentIndex < glossArray.length) {
            const glossItem = glossArray[currentIndex];

            // Create sign block
            const block = document.createElement('div');
            block.className = 'sign-block active';
            block.textContent = glossItem;
            block.setAttribute('data-gloss', glossItem);

            // Add to container
            avatarContainer.appendChild(block);

            // Scroll into view if needed
            block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            currentIndex++;

            // Continue animation
            if (currentIndex < glossArray.length) {
                // Wait 1.5 seconds before showing next sign
                setTimeout(showNextSign, 1500);
            } else {
                // Animation complete
                setStatus('Animation complete!', '');
            }
        }
    }

    // Start animation
    showNextSign();
}

/**
 * Initialize event listeners
 */
function init() {
    // Start button click handler
    startBtn.addEventListener('click', () => {
        if (!isListening) {
            listenToSpeech();
        }
    });

    // Check if backend is available
    fetch(`${API_BASE_URL}/health`)
        .then(response => {
            if (response.ok) {
                setStatus('Ready to listen', '');
            } else {
                setStatus('Backend not responding', 'error');
            }
        })
        .catch(error => {
            setStatus('Cannot connect to backend. Make sure server is running on port 8000', 'error');
            console.error('Backend connection error:', error);
        });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);


