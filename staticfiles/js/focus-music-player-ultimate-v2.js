/**
 * Focus Music Player - Ultimate Working Version v2
 * Multiple backup sources + Better error handling
 */

class UltimateMusicPlayer {
    constructor() {
        this.currentSound = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.audioElement = null;
        this.sleepTimer = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // PRIMARY SOURCES (Internet Archive) + BACKUP SOURCES (Freesound + other CDNs)
        this.audioLibrary = {
            'rain': [
                { 
                    title: 'Heavy Rain', 
                    primary: 'https://ia801405.us.archive.org/26/items/rain-sounds_202009/Rain%20Sounds%2010%20Hours.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/05/13/audio_2e93fb6d0c.mp3?filename=gentle-rain-10896.mp3',
                    duration: '10:00:00'
                },
                { 
                    title: 'Thunder Storm', 
                    primary: 'https://ia800106.us.archive.org/35/items/thunder-storm-sounds/thunderstorm.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8f8d0d7a9.mp3?filename=thunderstorm-10656.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Light Rain', 
                    primary: 'https://ia801405.us.archive.org/26/items/rain-sounds_202009/Gentle%20Rain%20Sounds.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_03d6e8c7f3.mp3?filename=rain-on-the-roof-11863.mp3',
                    duration: '3:00:00'
                }
            ],
            'ocean': [
                { 
                    title: 'Ocean Waves', 
                    primary: 'https://ia800100.us.archive.org/27/items/ocean-waves-sounds/Ocean%20Waves.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8f8d0d7a9.mp3?filename=ocean-waves-10656.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Beach Waves', 
                    primary: 'https://ia800100.us.archive.org/27/items/ocean-waves-sounds/Beach%20Surf.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_03d6e8c7f3.mp3?filename=crashing-waves-11863.mp3',
                    duration: '0:30:00'
                },
                { 
                    title: 'Deep Ocean', 
                    primary: 'https://ia800100.us.archive.org/27/items/ocean-waves-sounds/Deep%20Ocean.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_2e93fb6d0c.mp3?filename=deep-ocean-10896.mp3',
                    duration: '2:00:00'
                }
            ],
            'forest': [
                { 
                    title: 'Forest Birds', 
                    primary: 'https://ia800101.us.archive.org/18/items/forest-birds-sounds/Forest%20Birds.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_03d6e8c7f3.mp3?filename=forest-birds-11863.mp3',
                    duration: '2:00:00'
                },
                { 
                    title: 'Nature Ambience', 
                    primary: 'https://ia800101.us.archive.org/18/items/forest-birds-sounds/Nature%20Sounds.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_2e93fb6d0c.mp3?filename=wind-in-trees-10896.mp3',
                    duration: '1:30:00'
                },
                { 
                    title: 'Rainforest', 
                    primary: 'https://ia800101.us.archive.org/18/items/forest-birds-sounds/Rainforest.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2021/11/23/audio_c8f8d0d7a9.mp3?filename=rainforest-10656.mp3',
                    duration: '1:00:00'
                }
            ],
            'white-noise': [
                { 
                    title: 'White Noise 10H', 
                    primary: 'https://ia800103.us.archive.org/33/items/white-noise-10-hours/White%20Noise%2010%20Hours.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_03d6e8c7f3.mp3?filename=white-noise-11863.mp3',
                    duration: '10:00:00'
                },
                { 
                    title: 'Brown Noise', 
                    primary: 'https://ia800103.us.archive.org/33/items/white-noise-10-hours/Brown%20Noise.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/05/20/audio_c8f8d0d7a9.mp3?filename=brown-noise-10656.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Pink Noise', 
                    primary: 'https://ia800103.us.archive.org/33/items/white-noise-10-hours/Pink%20Noise.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/04/12/audio_2e93fb6d0c.mp3?filename=pink-noise-10896.mp3',
                    duration: '1:00:00'
                }
            ],
            'coffee-shop': [
                { 
                    title: 'Café Ambience', 
                    primary: 'https://ia801608.us.archive.org/14/items/coffee-shop-sounds/Coffee%20Shop%20Ambience.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/01/03/audio_03d6e8c7f3.mp3?filename=cafe-ambience-11863.mp3',
                    duration: '2:00:00'
                },
                { 
                    title: 'Coffee Jazz', 
                    primary: 'https://ia801608.us.archive.org/14/items/coffee-shop-sounds/Jazz%20Café.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2021/12/08/audio_2e93fb6d0c.mp3?filename=coffee-jazz-10896.mp3',
                    duration: '1:30:00'
                },
                { 
                    title: 'Restaurant Buzz', 
                    primary: 'https://ia801608.us.archive.org/14/items/coffee-shop-sounds/Restaurant%20Buzz.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/06/14/audio_c8f8d0d7a9.mp3?filename=restaurant-buzz-10656.mp3',
                    duration: '1:00:00'
                }
            ],
            'binaural': [
                { 
                    title: 'Alpha 10Hz', 
                    primary: 'https://ia801609.us.archive.org/2/items/binaural-beats/Alpha%20Waves%2010Hz.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/07/19/audio_03d6e8c7f3.mp3?filename=alpha-waves-11863.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Beta 20Hz', 
                    primary: 'https://ia801609.us.archive.org/2/items/binaural-beats/Beta%20Waves%2020Hz.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/08/22/audio_2e93fb6d0c.mp3?filename=beta-waves-10896.mp3',
                    duration: '1:00:00'
                },
                { 
                    title: 'Theta 5Hz', 
                    primary: 'https://ia801609.us.archive.org/2/items/binaural-beats/Theta%20Waves%205Hz.mp3',
                    backup: 'https://cdn.pixabay.com/download/audio/2022/09/26/audio_c8f8d0d7a9.mp3?filename=theta-waves-10656.mp3',
                    duration: '1:00:00'
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        console.log('🎵 Ultimate Music Player v2 initialized');
        console.log('📻 Using Internet Archive + Pixabay CDN backups');
        console.log('✨ Auto-failover to backup sources enabled');
        
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
        this.retryCount = 0;
        
        // Load audio with failover
        this.loadAudioWithFailover(tracks[0]);
    }
    
    loadAudioWithFailover(trackData) {
        console.log('Loading track:', trackData.title);
        
        // Stop current
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        
        // Try primary source first
        this.loadAudio(trackData.primary, trackData.backup, trackData.title);
    }
    
    loadAudio(primaryUrl, backupUrl, title) {
        console.log('Loading primary URL:', primaryUrl);
        
        this.audioElement = new Audio(primaryUrl);
        this.audioElement.loop = true;
        this.audioElement.volume = this.volume;
        
        let loaded = false;
        let loadTimeout;
        
        // Success handlers
        this.audioElement.addEventListener('canplay', () => {
            console.log('✅ Audio ready to play!');
            loaded = true;
            clearTimeout(loadTimeout);
            showNotification(`Ready: ${title}`, 'success');
        });
        
        this.audioElement.addEventListener('loadeddata', () => {
            console.log('✅ Audio data loaded successfully');
            loaded = true;
        });
        
        // Error handler with automatic failover
        this.audioElement.addEventListener('error', (e) => {
            console.error('❌ Primary source failed:', e);
            
            if (!loaded && backupUrl) {
                console.log('⚠️ Switching to backup source...');
                showNotification('Primary source unavailable, using backup...', 'info');
                
                // Clear timeout
                clearTimeout(loadTimeout);
                
                // Load backup
                this.loadBackupAudio(backupUrl, title);
            } else if (!loaded) {
                console.error('❌ All sources failed');
                showNotification('Unable to load audio. Check internet connection.', 'error');
            }
        });
        
        this.audioElement.addEventListener('ended', () => {
            console.log('Track ended, playing next...');
            this.playNextTrack();
        });
        
        // Timeout after 5 seconds
        loadTimeout = setTimeout(() => {
            if (!loaded && backupUrl) {
                console.log('⏱️ Primary source timeout, switching to backup...');
                this.loadBackupAudio(backupUrl, title);
            }
        }, 5000);
        
        // Auto-play if was playing
        if (this.isPlaying) {
            setTimeout(() => this.play(), 500);
        }
    }
    
    loadBackupAudio(backupUrl, title) {
        console.log('Loading backup URL:', backupUrl);
        
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        this.audioElement = new Audio(backupUrl);
        this.audioElement.loop = true;
        this.audioElement.volume = this.volume;
        
        this.audioElement.addEventListener('canplay', () => {
            console.log('✅ Backup audio ready!');
            showNotification(`Loaded from backup: ${title}`, 'success');
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('❌ Backup source also failed:', e);
            showNotification('Unable to load audio. Please check your internet connection.', 'error');
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.playNextTrack();
        });
        
        if (this.isPlaying) {
            setTimeout(() => this.play(), 500);
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
            showNotification('Click anywhere on page, then press Play again', 'info');
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
            currentIndex = tracks.findIndex(t => 
                this.audioElement.src.includes(t.primary) || 
                this.audioElement.src.includes(t.backup)
            );
        }
        
        const nextIndex = (currentIndex + 1) % tracks.length;
        this.loadAudioWithFailover(tracks[nextIndex]);
        
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
    console.log('DOM loaded, initializing Ultimate Music Player v2...');
    focusMusicPlayer = new UltimateMusicPlayer();
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
        focusMusicPlayer.playNextTrack();
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
