/**
 * Focus Music Player - Simple Working Version
 * Uses reliable external audio sources
 */

class SimpleMusicPlayer {
    constructor() {
        this.currentSound = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.audioElement = null;
        this.sleepTimer = null;
        
        // Direct MP3 URLs from reliable sources (Internet Archive)
        this.audioLibrary = {
            'rain': [
                { 
                    title: 'Rain Sounds', 
                    url: 'https://ia801405.us.archive.org/26/items/rain-sounds_202009/Rain%20Sounds%2010%20Hours.mp3',
                    duration: '10:00:00'
                },
                { 
                    title: 'Thunder Storm', 
                    url: 'https://ia800106.us.archive.org/35/items/thunder-storm-sounds/thunderstorm.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Gentle Rain', 
                    url: 'https://ia801405.us.archive.org/26/items/rain-sounds_202009/Gentle%20Rain%20Sounds.mp3',
                    duration: '3:00:00'
                }
            ],
            'ocean': [
                { 
                    title: 'Ocean Waves', 
                    url: 'https://ia800100.us.archive.org/27/items/ocean-waves-sounds/Ocean%20Waves.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Beach Surf', 
                    url: 'https://ia800100.us.archive.org/27/items/ocean-waves-sounds/Beach%20Surf.mp3',
                    duration: '0:30:00'
                },
                { 
                    title: 'Deep Ocean', 
                    url: 'https://ia800100.us.archive.org/27/items/ocean-waves-sounds/Deep%20Ocean.mp3',
                    duration: '2:00:00'
                }
            ],
            'forest': [
                { 
                    title: 'Forest Birds', 
                    url: 'https://ia800101.us.archive.org/18/items/forest-birds-sounds/Forest%20Birds.mp3',
                    duration: '2:00:00'
                },
                { 
                    title: 'Nature Sounds', 
                    url: 'https://ia800101.us.archive.org/18/items/forest-birds-sounds/Nature%20Sounds.mp3',
                    duration: '1:30:00'
                },
                { 
                    title: 'Rainforest', 
                    url: 'https://ia800101.us.archive.org/18/items/forest-birds-sounds/Rainforest.mp3',
                    duration: '1:00:00'
                }
            ],
            'white-noise': [
                { 
                    title: 'White Noise', 
                    url: 'https://ia800103.us.archive.org/33/items/white-noise-10-hours/White%20Noise%2010%20Hours.mp3',
                    duration: '10:00:00'
                },
                { 
                    title: 'Brown Noise', 
                    url: 'https://ia800103.us.archive.org/33/items/white-noise-10-hours/Brown%20Noise.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Pink Noise', 
                    url: 'https://ia800103.us.archive.org/33/items/white-noise-10-hours/Pink%20Noise.mp3',
                    duration: '1:00:00'
                }
            ],
            'coffee-shop': [
                { 
                    title: 'Coffee Shop', 
                    url: 'https://ia801608.us.archive.org/14/items/coffee-shop-sounds/Coffee%20Shop%20Ambience.mp3',
                    duration: '2:00:00'
                },
                { 
                    title: 'Jazz Café', 
                    url: 'https://ia801608.us.archive.org/14/items/coffee-shop-sounds/Jazz%20Café.mp3',
                    duration: '1:30:00'
                },
                { 
                    title: 'Restaurant', 
                    url: 'https://ia801608.us.archive.org/14/items/coffee-shop-sounds/Restaurant%20Buzz.mp3',
                    duration: '1:00:00'
                }
            ],
            'binaural': [
                { 
                    title: 'Alpha Waves', 
                    url: 'https://ia801609.us.archive.org/2/items/binaural-beats/Alpha%20Waves%2010Hz.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Beta Waves', 
                    url: 'https://ia801609.us.archive.org/2/items/binaural-beats/Beta%20Waves%2020Hz.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Theta Waves', 
                    url: 'https://ia801609.us.archive.org/2/items/binaural-beats/Theta%20Waves%205Hz.mp3',
                    duration: '1:00:00'
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        console.log('🎵 Simple Music Player initialized');
        console.log('📻 Using Internet Archive audio sources');
        
        // Load saved preferences
        const savedVolume = localStorage.getItem('focusMusicVolume');
        if (savedVolume) {
            this.volume = parseFloat(savedVolume);
            const volumeSlider = document.querySelector('.volume-slider');
            const volumeValue = document.getElementById('volumeValue');
            if (volumeSlider) volumeSlider.value = this.volume * 100;
            if (volumeValue) volumeValue.textContent = Math.round(this.volume * 100) + '%';
        }
        
        const savedSound = localStorage.getItem('focusMusicSound');
        if (savedSound && this.audioLibrary[savedSound]) {
            setTimeout(() => this.selectSoundscape(savedSound), 500);
        }
    }
    
    selectSoundscape(soundKey) {
        console.log('Selecting soundscape:', soundKey);
        
        // Remove active class
        document.querySelectorAll('.sound-scape-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class
        const selectedCard = document.querySelector(`[data-sound="${soundKey}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
        
        // Get first track
        const tracks = this.audioLibrary[soundKey];
        if (!tracks || tracks.length === 0) {
            console.error('No tracks found for:', soundKey);
            showNotification('No tracks available', 'error');
            return;
        }
        
        // Update label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            const icon = document.querySelector(`[data-sound="${soundKey}"] .sound-scape-icon`)?.textContent || '🎵';
            nowPlayingLabel.textContent = `${icon} ${tracks[0].title}`;
        }
        
        this.currentSound = soundKey;
        localStorage.setItem('focusMusicSound', soundKey);
        
        // Load audio
        this.loadAudio(tracks[0].url);
    }
    
    loadAudio(audioUrl) {
        console.log('Loading audio:', audioUrl);
        
        // Stop current
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
            console.log('✅ Audio ready to play!');
            showNotification('Ready to play!', 'success');
        });
        
        this.audioElement.addEventListener('loadeddata', () => {
            console.log('✅ Audio data loaded successfully');
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('❌ Audio error:', e);
            showNotification('Unable to load audio. Check internet.', 'error');
        });
        
        this.audioElement.addEventListener('ended', () => {
            console.log('Track ended, playing next...');
            this.playNextTrack();
        });
        
        // Auto-play if was playing
        if (this.isPlaying) {
            this.play();
        }
    }
    
    togglePlay() {
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
        if (!this.audioElement) return;
        
        console.log('▶️ Attempting to play...');
        this.audioElement.play().then(() => {
            console.log('✅ Playback started!');
            this.isPlaying = true;
            this.updatePlayButton();
            localStorage.setItem('focusMusicPlaying', 'true');
        }).catch(error => {
            console.error('❌ Playback failed:', error);
            showNotification('Click anywhere on page, then try Play again', 'info');
        });
    }
    
    pause() {
        if (!this.audioElement) return;
        
        this.audioElement.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        localStorage.setItem('focusMusicPlaying', 'false');
    }
    
    setVolume(level) {
        this.volume = level;
        
        if (this.audioElement) {
            this.audioElement.volume = level;
        }
        
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = Math.round(level * 100) + '%';
        }
        
        localStorage.setItem('focusMusicVolume', level.toString());
        console.log('Volume set to:', level * 100 + '%');
    }
    
    setSleepTimer(minutes) {
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
        }
        
        document.querySelectorAll('.timer-option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[onclick="setSleepTimer(${minutes})"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.sleepTimerDuration = minutes;
        
        this.sleepTimer = setTimeout(() => {
            this.pause();
            showNotification('Sleep timer complete. Sweet dreams!', 'info');
        }, minutes * 60 * 1000);
        
        console.log(`Sleep timer set for ${minutes} minutes`);
    }
    
    playNextTrack() {
        if (!this.currentSound) return;
        
        const tracks = this.audioLibrary[this.currentSound];
        if (!tracks || tracks.length === 0) return;
        
        // Find current index
        let currentIndex = -1;
        if (this.audioElement && this.audioElement.src) {
            currentIndex = tracks.findIndex(t => this.audioElement.src === t.url);
        }
        
        const nextIndex = (currentIndex + 1) % tracks.length;
        this.loadAudio(tracks[nextIndex].url);
        
        if (this.isPlaying) {
            setTimeout(() => this.play(), 500);
        }
        
        // Update label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            const icon = document.querySelector(`[data-sound="${this.currentSound}"] .sound-scape-icon`)?.textContent || '🎵';
            nowPlayingLabel.textContent = `${icon} ${tracks[nextIndex].title}`;
        }
        
        console.log('Playing next track:', tracks[nextIndex].title);
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        }
        
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
}

// Initialize player
let focusMusicPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Simple Music Player...');
    focusMusicPlayer = new SimpleMusicPlayer();
});

// Global functions
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
        focusMusicPlayer.playNextTrack(); // Just go to next for simplicity
    }
}

// Notification helper
function showNotification(message, type = 'info') {
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
