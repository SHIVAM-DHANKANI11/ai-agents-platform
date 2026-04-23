/**
 * Focus Music Player - Audio Controller
 * Handles audio playback for all soundscapes
 */

class FocusMusicPlayer {
    constructor() {
        this.currentSound = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.audioElement = null;
        this.sleepTimer = null;
        this.sleepTimerDuration = 60; // minutes
        
        // Audio files mapping - Each soundscape has multiple tracks
        this.soundLibrary = {
            'rain': {
                name: 'Rain',
                icon: '🌧️',
                tracks: [
                    { name: 'Gentle Rain', url: '/static/audio/rain-gentle.mp3' },
                    { name: 'Heavy Rain', url: '/static/audio/rain-heavy.mp3' },
                    { name: 'Thunder Storm', url: '/static/audio/rain-thunder.mp3' }
                ]
            },
            'ocean': {
                name: 'Ocean',
                icon: '🌊',
                tracks: [
                    { name: 'Ocean Waves', url: '/static/audio/ocean-waves.mp3' },
                    { name: 'Beach Surf', url: '/static/audio/ocean-surf.mp3' },
                    { name: 'Deep Ocean', url: '/static/audio/ocean-deep.mp3' }
                ]
            },
            'forest': {
                name: 'Forest',
                icon: '🌲',
                tracks: [
                    { name: 'Forest Birds', url: '/static/audio/forest-birds.mp3' },
                    { name: 'Wind in Trees', url: '/static/audio/forest-wind.mp3' },
                    { name: 'Rainforest', url: '/static/audio/forest-rainforest.mp3' }
                ]
            },
            'white-noise': {
                name: 'White Noise',
                icon: '📻',
                tracks: [
                    { name: 'Pure White Noise', url: '/static/audio/white-noise-pure.mp3' },
                    { name: 'Pink Noise', url: '/static/audio/pink-noise.mp3' },
                    { name: 'Brown Noise', url: '/static/audio/brown-noise.mp3' }
                ]
            },
            'coffee-shop': {
                name: 'Coffee Shop',
                icon: '☕',
                tracks: [
                    { name: 'Café Ambience', url: '/static/audio/cafe-ambience.mp3' },
                    { name: 'Coffee Shop Jazz', url: '/static/audio/coffee-jazz.mp3' },
                    { name: 'Restaurant Buzz', url: '/static/audio/restaurant-buzz.mp3' }
                ]
            },
            'binaural': {
                name: 'Binaural Beats',
                icon: '⚡',
                tracks: [
                    { name: 'Alpha Waves (10Hz)', url: '/static/audio/binaural-alpha.mp3' },
                    { name: 'Beta Waves (20Hz)', url: '/static/audio/binaural-beta.mp3' },
                    { name: 'Theta Waves (5Hz)', url: '/static/audio/binaural-theta.mp3' }
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        // Load saved preferences from localStorage
        const savedVolume = localStorage.getItem('focusMusicVolume');
        if (savedVolume) {
            this.volume = parseFloat(savedVolume);
            document.getElementById('volumeValue').textContent = Math.round(this.volume * 100) + '%';
            document.querySelector('.volume-slider').value = this.volume * 100;
        }
        
        const savedSound = localStorage.getItem('focusMusicSound');
        if (savedSound && this.soundLibrary[savedSound]) {
            this.selectSoundscape(savedSound);
        }
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Volume slider
        const volumeSlider = document.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });
        }
    }
    
    /**
     * Select a soundscape category
     */
    selectSoundscape(soundKey) {
        // Remove active class from all cards
        document.querySelectorAll('.sound-scape-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class to selected card
        const selectedCard = document.querySelector(`[data-sound="${soundKey}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
        
        // Stop current audio if playing
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        // Get sound data
        const soundData = this.soundLibrary[soundKey];
        if (!soundData) return;
        
        // Update now playing label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            nowPlayingLabel.textContent = `${soundData.icon} ${soundData.tracks[0].name}`;
        }
        
        // Store current sound
        this.currentSound = soundKey;
        localStorage.setItem('focusMusicSound', soundKey);
        
        // Load first track from the category
        this.loadTrack(soundData.tracks[0].url);
    }
    
    /**
     * Load an audio track
     */
    loadTrack(audioUrl) {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        
        // Create new audio element
        this.audioElement = new Audio(audioUrl);
        this.audioElement.loop = true;
        this.audioElement.volume = this.volume;
        
        // Event listeners
        this.audioElement.addEventListener('canplay', () => {
            console.log('Audio ready to play');
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showNotification('Unable to load audio track', 'error');
        });
        
        this.audioElement.addEventListener('ended', () => {
            // Auto-play next track if available
            this.playNextTrack();
        });
    }
    
    /**
     * Toggle play/pause
     */
    togglePlay() {
        if (!this.audioElement) {
            showNotification('Please select a soundscape first', 'info');
            return;
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    /**
     * Play audio
     */
    play() {
        if (!this.audioElement) return;
        
        this.audioElement.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.startVisualizer();
            
            // Save state
            localStorage.setItem('focusMusicPlaying', 'true');
        }).catch(error => {
            console.error('Playback failed:', error);
            showNotification('Click anywhere on page to enable audio', 'info');
        });
    }
    
    /**
     * Pause audio
     */
    pause() {
        if (!this.audioElement) return;
        
        this.audioElement.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        this.stopVisualizer();
        
        // Save state
        localStorage.setItem('focusMusicPlaying', 'false');
    }
    
    /**
     * Set volume (0.0 - 1.0)
     */
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
        
        // Update UI
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = Math.round(this.volume * 100) + '%';
        }
        
        // Save preference
        localStorage.setItem('focusMusicVolume', this.volume.toString());
    }
    
    /**
     * Set sleep timer
     */
    setSleepTimer(minutes) {
        // Clear existing timer
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
        }
        
        // Update UI
        document.querySelectorAll('.timer-option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[onclick="setSleepTimer(${minutes})"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.sleepTimerDuration = minutes;
        
        // Set new timer
        this.sleepTimer = setTimeout(() => {
            this.pause();
            showNotification('Sleep timer complete. Sweet dreams!', 'info');
        }, minutes * 60 * 1000);
        
        console.log(`Sleep timer set for ${minutes} minutes`);
    }
    
    /**
     * Play next track in current soundscape
     */
    playNextTrack() {
        if (!this.currentSound) return;
        
        const soundData = this.soundLibrary[this.currentSound];
        const currentIndex = soundData.tracks.findIndex(t => 
            this.audioElement && this.audioElement.src.includes(t.url)
        );
        
        const nextIndex = (currentIndex + 1) % soundData.tracks.length;
        this.loadTrack(soundData.tracks[nextIndex].url);
        
        if (this.isPlaying) {
            this.play();
        }
        
        // Update now playing label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            nowPlayingLabel.textContent = `${soundData.icon} ${soundData.tracks[nextIndex].name}`;
        }
    }
    
    /**
     * Play previous track
     */
    playPreviousTrack() {
        if (!this.currentSound) return;
        
        const soundData = this.soundLibrary[this.currentSound];
        const currentIndex = soundData.tracks.findIndex(t => 
            this.audioElement && this.audioElement.src.includes(t.url)
        );
        
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : soundData.tracks.length - 1;
        this.loadTrack(soundData.tracks[prevIndex].url);
        
        if (this.isPlaying) {
            this.play();
        }
        
        // Update now playing label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            nowPlayingLabel.textContent = `${soundData.icon} ${soundData.tracks[prevIndex].name}`;
        }
    }
    
    /**
     * Update play button icon
     */
    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        }
        
        // Update visualizer state
        const visualizerContainer = document.getElementById('visualizerContainer');
        if (visualizerContainer) {
            if (this.isPlaying) {
                visualizerContainer.classList.remove('paused');
                visualizerContainer.classList.add('playing');
            } else {
                visualizerContainer.classList.remove('playing');
                visualizerContainer.classList.add('paused');
            }
        }
    }
    
    /**
     * Start audio visualizer animation
     */
    startVisualizer() {
        const visualizerContainer = document.getElementById('visualizerContainer');
        if (visualizerContainer) {
            visualizerContainer.classList.remove('paused');
            visualizerContainer.classList.add('playing');
        }
    }
    
    /**
     * Stop audio visualizer animation
     */
    stopVisualizer() {
        const visualizerContainer = document.getElementById('visualizerContainer');
        if (visualizerContainer) {
            visualizerContainer.classList.remove('playing');
            visualizerContainer.classList.add('paused');
        }
    }
    
    /**
     * Get current sound library
     */
    getSoundLibrary() {
        return this.soundLibrary;
    }
}

// Initialize player when DOM is ready
let focusMusicPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    focusMusicPlayer = new FocusMusicPlayer();
});

// Global functions for template onclick handlers
function selectSoundscape(sound) {
    if (focusMusicPlayer) {
        focusMusicPlayer.selectSoundscape(sound);
    }
}

function togglePlay() {
    if (focusMusicPlayer) {
        focusMusicPlayer.togglePlay();
    }
}

function setVolume(value) {
    if (focusMusicPlayer) {
        focusMusicPlayer.setVolume(value);
    }
}

function setSleepTimer(minutes) {
    if (focusMusicPlayer) {
        focusMusicPlayer.setSleepTimer(minutes);
    }
}

function nextSoundscape() {
    if (focusMusicPlayer) {
        focusMusicPlayer.playNextTrack();
    }
}

function previousSoundscape() {
    if (focusMusicPlayer) {
        focusMusicPlayer.playPreviousTrack();
    }
}

// Notification helper
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
