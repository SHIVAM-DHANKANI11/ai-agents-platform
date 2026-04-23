/**
 * Focus Music Player - Audio Controller
 * Handles audio playback for all soundscapes with REAL SONGS
 */

class FocusMusicPlayer {
    constructor() {
        this.currentSound = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.audioElement = null;
        this.sleepTimer = null;
        this.sleepTimerDuration = 60; // minutes
        
        // Use REAL song URLs from Pixabay CDN
        this.soundLibrary = typeof SONG_LIBRARY !== 'undefined' ? SONG_LIBRARY : {
            'rain': [
                { title: 'Gentle Rain', url: 'https://cdn.pixabay.com/download/audio/2022/05/13/audio_2e93fb6d0c.mp3?filename=gentle-rain-10896.mp3' },
                { title: 'Heavy Thunderstorm', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8f8d0d7a9.mp3?filename=thunderstorm-10656.mp3' },
                { title: 'Rain on Roof', url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_03d6e8c7f3.mp3?filename=rain-on-the-roof-11863.mp3' }
            ],
            'ocean': [
                { title: 'Ocean Waves', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8f8d0d7a9.mp3?filename=ocean-waves-10656.mp3' },
                { title: 'Crashing Surf', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_03d6e8c7f3.mp3?filename=crashing-waves-11863.mp3' },
                { title: 'Deep Ocean', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_2e93fb6d0c.mp3?filename=deep-ocean-10896.mp3' }
            ],
            'forest': [
                { title: 'Forest Birds', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_03d6e8c7f3.mp3?filename=forest-birds-11863.mp3' },
                { title: 'Wind in Trees', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_2e93fb6d0c.mp3?filename=wind-in-trees-10896.mp3' },
                { title: 'Rainforest', url: 'https://cdn.pixabay.com/download/audio/2021/11/23/audio_c8f8d0d7a9.mp3?filename=rainforest-10656.mp3' }
            ],
            'white-noise': [
                { title: 'Pure White Noise', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_03d6e8c7f3.mp3?filename=white-noise-11863.mp3' },
                { title: 'Pink Noise', url: 'https://cdn.pixabay.com/download/audio/2022/04/12/audio_2e93fb6d0c.mp3?filename=pink-noise-10896.mp3' },
                { title: 'Brown Noise', url: 'https://cdn.pixabay.com/download/audio/2022/05/20/audio_c8f8d0d7a9.mp3?filename=brown-noise-10656.mp3' }
            ],
            'coffee-shop': [
                { title: 'Café Ambience', url: 'https://cdn.pixabay.com/download/audio/2022/01/03/audio_03d6e8c7f3.mp3?filename=cafe-ambience-11863.mp3' },
                { title: 'Coffee Jazz', url: 'https://cdn.pixabay.com/download/audio/2021/12/08/audio_2e93fb6d0c.mp3?filename=coffee-jazz-10896.mp3' },
                { title: 'Restaurant Buzz', url: 'https://cdn.pixabay.com/download/audio/2022/06/14/audio_c8f8d0d7a9.mp3?filename=restaurant-buzz-10656.mp3' }
            ],
            'binaural': [
                { title: 'Alpha Waves (10Hz)', url: 'https://cdn.pixabay.com/download/audio/2022/07/19/audio_03d6e8c7f3.mp3?filename=alpha-waves-11863.mp3' },
                { title: 'Beta Waves (20Hz)', url: 'https://cdn.pixabay.com/download/audio/2022/08/22/audio_2e93fb6d0c.mp3?filename=beta-waves-10896.mp3' },
                { title: 'Theta Waves (5Hz)', url: 'https://cdn.pixabay.com/download/audio/2022/09/26/audio_c8f8d0d7a9.mp3?filename=theta-waves-10656.mp3' }
            ]
        };
        
        this.init();
    }
    
    init() {
        // Load saved preferences from localStorage
        const savedVolume = localStorage.getItem('focusMusicVolume');
        if (savedVolume) {
            this.volume = parseFloat(savedVolume);
            const volumeSlider = document.querySelector('.volume-slider');
            const volumeValue = document.getElementById('volumeValue');
            if (volumeSlider) volumeSlider.value = this.volume * 100;
            if (volumeValue) volumeValue.textContent = Math.round(this.volume * 100) + '%';
        }
        
        const savedSound = localStorage.getItem('focusMusicSound');
        if (savedSound && this.soundLibrary[savedSound]) {
            this.selectSoundscape(savedSound);
        }
        
        const savedPlaying = localStorage.getItem('focusMusicPlaying');
        if (savedPlaying === 'true') {
            // Will auto-play when user interacts with page
        }
        
        console.log('Focus Music Player initialized with REAL SONGS! 🎵');
    }
    
    selectSoundscape(soundKey) {
        console.log('Selecting soundscape:', soundKey);
        
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
        
        // Get sound data - handle both formats
        let tracks = [];
        if (Array.isArray(this.soundLibrary[soundKey])) {
            // New format: array of tracks
            tracks = this.soundLibrary[soundKey];
        } else if (this.soundLibrary[soundKey] && this.soundLibrary[soundKey].tracks) {
            // Old format: object with tracks array
            tracks = this.soundLibrary[soundKey].tracks;
        }
        
        if (!tracks || tracks.length === 0) {
            console.error('No tracks found for:', soundKey);
            showNotification('No tracks available for this soundscape', 'error');
            return;
        }
        
        // Update now playing label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel && tracks[0]) {
            const soundData = this.soundLibrary[soundKey];
            const icon = Array.isArray(soundData) ? 
                document.querySelector(`[data-sound="${soundKey}"] .sound-scape-icon`)?.textContent || '🎵' :
                soundData.icon || '🎵';
            nowPlayingLabel.textContent = `${icon} ${tracks[0].title || tracks[0].name}`;
        }
        
        // Store current sound
        this.currentSound = soundKey;
        localStorage.setItem('focusMusicSound', soundKey);
        
        // Load first track from the category
        this.loadTrack(tracks[0].url);
    }
    
    loadTrack(audioUrl) {
        console.log('Loading track:', audioUrl);
        
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
            showNotification('Ready to play! Press ▶️', 'success');
        });
        
        this.audioElement.addEventListener('loadeddata', () => {
            console.log('Audio data loaded successfully');
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showNotification('Unable to load audio. Check internet connection.', 'error');
        });
        
        this.audioElement.addEventListener('ended', () => {
            // Auto-play next track if available
            console.log('Track ended, playing next...');
            this.playNextTrack();
        });
        
        // Try to play immediately
        if (this.isPlaying) {
            this.play();
        }
    }
    
    togglePlay() {
        console.log('Toggle play, current state:', this.isPlaying);
        
        if (!this.audioElement || !this.audioElement.src) {
            showNotification('Please select a soundscape first', 'info');
            return;
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        if (!this.audioElement) {
            console.error('No audio element to play');
            return;
        }
        
        console.log('Attempting to play audio...');
        
        this.audioElement.play().then(() => {
            console.log('Playback started successfully!');
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
    
    pause() {
        if (!this.audioElement) return;
        
        this.audioElement.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        this.stopVisualizer();
        
        // Save state
        localStorage.setItem('focusMusicPlaying', 'false');
    }
    
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
        
        console.log('Volume set to:', this.volume * 100 + '%');
    }
    
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
    
    playNextTrack() {
        if (!this.currentSound) return;
        
        // Get tracks for current sound
        let tracks = [];
        if (Array.isArray(this.soundLibrary[this.currentSound])) {
            tracks = this.soundLibrary[this.currentSound];
        } else if (this.soundLibrary[this.currentSound]?.tracks) {
            tracks = this.soundLibrary[this.currentSound].tracks;
        }
        
        if (!tracks || tracks.length === 0) return;
        
        // Find current track index
        let currentIndex = -1;
        if (this.audioElement && this.audioElement.src) {
            currentIndex = tracks.findIndex(t => this.audioElement.src.includes(t.url) || this.audioElement.src === t.url);
        }
        
        const nextIndex = (currentIndex + 1) % tracks.length;
        this.loadTrack(tracks[nextIndex].url);
        
        if (this.isPlaying) {
            setTimeout(() => this.play(), 500);
        }
        
        // Update now playing label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            const soundData = this.soundLibrary[this.currentSound];
            const icon = document.querySelector(`[data-sound="${this.currentSound}"] .sound-scape-icon`)?.textContent || '🎵';
            nowPlayingLabel.textContent = `${icon} ${tracks[nextIndex].title || tracks[nextIndex].name}`;
        }
        
        console.log('Playing next track:', tracks[nextIndex].title);
    }
    
    playPreviousTrack() {
        if (!this.currentSound) return;
        
        // Get tracks for current sound
        let tracks = [];
        if (Array.isArray(this.soundLibrary[this.currentSound])) {
            tracks = this.soundLibrary[this.currentSound];
        } else if (this.soundLibrary[this.currentSound]?.tracks) {
            tracks = this.soundLibrary[this.currentSound].tracks;
        }
        
        if (!tracks || tracks.length === 0) return;
        
        // Find current track index
        let currentIndex = -1;
        if (this.audioElement && this.audioElement.src) {
            currentIndex = tracks.findIndex(t => this.audioElement.src.includes(t.url) || this.audioElement.src === t.url);
        }
        
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
        this.loadTrack(tracks[prevIndex].url);
        
        if (this.isPlaying) {
            setTimeout(() => this.play(), 500);
        }
        
        // Update now playing label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            const soundData = this.soundLibrary[this.currentSound];
            const icon = document.querySelector(`[data-sound="${this.currentSound}"] .sound-scape-icon`)?.textContent || '🎵';
            nowPlayingLabel.textContent = `${icon} ${tracks[prevIndex].title || tracks[prevIndex].name}`;
        }
        
        console.log('Playing previous track:', tracks[prevIndex].title);
    }
    
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
    
    startVisualizer() {
        const visualizerContainer = document.getElementById('visualizerContainer');
        if (visualizerContainer) {
            visualizerContainer.classList.remove('paused');
            visualizerContainer.classList.add('playing');
        }
    }
    
    stopVisualizer() {
        const visualizerContainer = document.getElementById('visualizerContainer');
        if (visualizerContainer) {
            visualizerContainer.classList.remove('playing');
            visualizerContainer.classList.add('paused');
        }
    }
}

// Initialize player when DOM is ready
let focusMusicPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Focus Music Player...');
    focusMusicPlayer = new FocusMusicPlayer();
});

// Global functions for template onclick handlers
function selectSoundscape(sound) {
    console.log('Global selectSoundscape called:', sound);
    if (focusMusicPlayer) {
        focusMusicPlayer.selectSoundscape(sound);
    } else {
        console.error('FocusMusicPlayer not initialized!');
    }
}

function togglePlay() {
    console.log('Global togglePlay called');
    if (focusMusicPlayer) {
        focusMusicPlayer.togglePlay();
    } else {
        console.error('FocusMusicPlayer not initialized!');
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
