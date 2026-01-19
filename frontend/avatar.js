/**
 * Avatar.js - Frontend logic for Sign Language MVP
 * 
 * Handles:
 * - API communication with backend
 * - Displaying transcribed speech
 * - Displaying gloss sequence
 * - 3D avatar loading and animation using Three.js
 */

// Import Three.js modules (resolved by Vite from node_modules)
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";


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

// Three.js variables
let scene, camera, renderer, mixer, avatar, clock;
let animationQueue = [];
let isPlayingAnimation = false;
let loadingManager; // Shared loading manager for all GLB loads
let currentAction = null; // Track current animation action for completion detection
let currentClipDuration = 0; // Track current clip duration

/**
 * Initialize 3D avatar scene
 */
function initAvatar() {
    // Wait for container to have dimensions
    if (!avatarContainer || avatarContainer.clientWidth === 0 || avatarContainer.clientHeight === 0) {
        console.warn('Avatar container not ready, retrying...');
        setTimeout(initAvatar, 100);
        return;
    }
    
    console.log('Initializing avatar with container size:', avatarContainer.clientWidth, 'x', avatarContainer.clientHeight);
    
    // Create clock for animation timing
    clock = new THREE.Clock();
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Get container dimensions (with fallback)
    const width = avatarContainer.clientWidth || 800;
    const height = avatarContainer.clientHeight || 400;
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        35,
        width / height,
        0.1,
        100
    );
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear placeholder and add canvas
    avatarContainer.innerHTML = '';
    avatarContainer.appendChild(renderer.domElement);
    
    // Start render loop immediately (don't wait for model to load)
    animate();
    
    // Add lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(1, 3, 2);
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-1, 2, 2);
    scene.add(fillLight);
    
    // Add a grid helper for debugging (helps see if scene is rendering)
    const gridHelper = new THREE.GridHelper(5, 10, 0x888888, 0xcccccc);
    scene.add(gridHelper);
    
    // Add a simple placeholder object to verify rendering works
    const placeholderGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const placeholderMaterial = new THREE.MeshStandardMaterial({ color: 0x667eea });
    const placeholderCube = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholderCube.position.set(0, 1, 0);
    scene.add(placeholderCube);
    
    console.log('Scene initialized with lights and placeholder cube');
    
    // Load avatar model (POSE.glb)
    // Configure loading manager to handle blob URLs and suppress texture warnings
    loadingManager = new THREE.LoadingManager();
    
    // Handle texture loading errors gracefully (textures might be embedded in GLB)
    loadingManager.onError = (url) => {
        // Suppress warnings for blob URLs - they're embedded textures in GLB files
        // These warnings are often non-critical as textures may still render
        if (url && url.startsWith('blob:')) {
            // Silently ignore blob URL texture loading errors
            // These are typically embedded textures that GLTFLoader handles internally
            return;
        }
        // Only log non-blob URL errors
        console.warn('Failed to load resource:', url);
    };
    
    // Configure texture loader to handle blob URLs
    const textureLoader = new THREE.TextureLoader(loadingManager);
    textureLoader.setCrossOrigin('anonymous');
    
    const loader = new GLTFLoader(loadingManager);
    
    // Try loading POSE.glb - Vite should serve files from public/assets
    const modelPath = '/assets/animations/POSE.glb';
    console.log('Loading POSE.glb from:', modelPath);
    
    loader.load(modelPath, (gltf) => {
        console.log('✅ POSE.glb loaded successfully!', gltf);
        avatar = gltf.scene;
        
        // Compute bounding box and center
        const box = new THREE.Box3().setFromObject(avatar);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log('Avatar bounding box:', { size, center });
        
        // Center avatar
        avatar.position.sub(center);
        // Move avatar upward so feet touch ground
        avatar.position.y += size.y / 2;
        
        // FIXED CAMERA (FACE → HIP VIEW)
        camera.position.set(0, size.y * 3.2, size.y * 3.2);
        camera.lookAt(0, size.y * 4.2, 1);
        
        // Enable double-sided rendering
        avatar.traverse(obj => {
            if (obj.isMesh) {
                obj.material.side = THREE.DoubleSide;
                console.log('Mesh found:', obj.name, obj.material);
            }
        });
        
        scene.add(avatar);
        console.log('Avatar added to scene');
        
        // Remove placeholder cube now that avatar is loaded
        scene.children.forEach(child => {
            if (child.type === 'Mesh' && child.geometry && child.geometry.type === 'BoxGeometry') {
                scene.remove(child);
                child.geometry.dispose();
                child.material.dispose();
            }
        });
        
        // Create animation mixer
        mixer = new THREE.AnimationMixer(avatar);
        
        setStatus('Avatar loaded! Ready to listen.', '');
    }, (progress) => {
        // Loading progress
        if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100;
            console.log('Loading progress:', percentComplete.toFixed(2) + '%');
        }
    }, (error) => {
        console.error('❌ Error loading avatar:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        setStatus('Error loading avatar. Check console for details.', 'error');
        // Don't clear the container - keep the canvas visible for debugging
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (camera && renderer) {
            camera.aspect = avatarContainer.clientWidth / avatarContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(avatarContainer.clientWidth, avatarContainer.clientHeight);
        }
    });
}

/**
 * Render loop for Three.js
 */
function animate() {
    requestAnimationFrame(animate);
    
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
        
        // Check if current animation has finished
        if (currentAction && isPlayingAnimation) {
            // Check if animation has reached its end (with small buffer for clampWhenFinished)
            if (currentAction.time >= currentClipDuration - 0.01) {
                // Animation finished
                isPlayingAnimation = false;
                currentAction = null;
                currentClipDuration = 0;
                // Process next animation in queue
                processAnimationQueue();
            }
        }
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

/**
 * Play animation for a gloss sign
 */
function playGlossAnimation(glossName) {
    if (!mixer || !avatar) {
        // Fallback: show placeholder block
        showPlaceholderBlock(glossName);
        return;
    }
    
    // Use shared loading manager for consistent texture handling
    const loader = new GLTFLoader(loadingManager || new THREE.LoadingManager());
    const animationPath = `assets/animations/${glossName}.glb`;
    
    loader.load(animationPath, (animGltf) => {
        if (animGltf.animations.length === 0) {
            console.warn(`No animation found in ${glossName}.glb`);
            showPlaceholderBlock(glossName);
            return;
        }
        
        const clip = animGltf.animations[0];
        const action = mixer.clipAction(clip);
        
        // Stop current animation
        mixer.stopAllAction();
        
        // Configure new animation
        action.reset();
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.fadeIn(0.3);
        action.timeScale = 1.0;
        
        // Track current action and duration for completion detection
        currentAction = action;
        currentClipDuration = clip.duration;
        
        // Play animation
        action.play();
        
        console.log(`Playing animation: ${glossName} (duration: ${clip.duration.toFixed(2)}s)`);
        
    }, undefined, (error) => {
        // Animation file not found - use finger-spelling or placeholder
        console.warn(`Animation not found for ${glossName}:`, error);
        
        // If it's a single letter (finger-spelling), try loading letter animation
        if (glossName.length === 1) {
            const letterPath = `assets/animations/${glossName.toUpperCase()}.glb`;
            const letterLoader = new GLTFLoader(loadingManager || new THREE.LoadingManager());
            letterLoader.load(letterPath, (animGltf) => {
                const clip = animGltf.animations[0];
                const action = mixer.clipAction(clip);
                mixer.stopAllAction();
                action.reset();
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.fadeIn(0.3);
                
                // Track current action and duration
                currentAction = action;
                currentClipDuration = clip.duration;
                
                action.play();
            }, undefined, () => {
                // Letter animation also not found
                showPlaceholderBlock(glossName);
                setTimeout(() => {
                    isPlayingAnimation = false;
                    currentAction = null;
                    currentClipDuration = 0;
                    processAnimationQueue();
                }, 1000);
            });
        } else {
            // Not a letter, show placeholder
            showPlaceholderBlock(glossName);
            setTimeout(() => {
                isPlayingAnimation = false;
                currentAction = null;
                currentClipDuration = 0;
                processAnimationQueue();
            }, 1000);
        }
    });
}

/**
 * Show placeholder block for signs without animations
 */
function showPlaceholderBlock(glossName) {
    // Create a temporary visual indicator
    const block = document.createElement('div');
    block.className = 'sign-block-placeholder';
    block.textContent = glossName;
    block.style.cssText = `
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(102, 126, 234, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 100;
        animation: fadeInOut 1s ease-in-out;
    `;
    
    avatarContainer.appendChild(block);
    
    setTimeout(() => {
        if (block.parentNode) {
            block.parentNode.removeChild(block);
        }
    }, 1000);
}

/**
 * Process animation queue
 */
function processAnimationQueue() {
    if (isPlayingAnimation || animationQueue.length === 0) {
        return;
    }
    
    isPlayingAnimation = true;
    const nextGloss = animationQueue.shift();
    playGlossAnimation(nextGloss);
}

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
 * Animate avatar for gloss sequence
 */
function animateAvatar(glossArray) {
    if (!glossArray || glossArray.length === 0) {
        return;
    }
    
    // Clear any existing queue
    animationQueue = [];
    
    // Filter out SILENCE and MAINTAIN (they're just markers)
    const signsToAnimate = glossArray.filter(gloss => 
        gloss !== 'SILENCE' && gloss !== 'MAINTAIN'
    );
    
    if (signsToAnimate.length === 0) {
        return;
    }
    
    // Add all signs to queue
    animationQueue = [...signsToAnimate];
    
    // Start processing queue
    processAnimationQueue();
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

    // Initialize avatar
    initAvatar();

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
