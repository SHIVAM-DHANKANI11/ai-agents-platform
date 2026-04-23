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
        this.youtubePlayer = null;
        this.isYouTubeMode = false;
        this.sleepTimer = null;
        
        this.audioLibrary = SONG_LIBRARY;
        
        this.init();
        this.initYouTube();
    }
    
    init() {
        console.log('🎵 Ultimate Music Player v3 (YouTube Edition) initialized');
        
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
            setTimeout(() => this.selectSoundscape(savedSound), 1000);
        }
    }

    initYouTube() {
        // Load YouTube IFrame API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
            console.log('📺 YouTube API Ready');
            this.youtubePlayer = new YT.Player('youtube-player-container', {
                height: '0',
                width: '0',
                videoId: '',
                playerVars: {
                    'autoplay': 0,
                    'controls': 0,
                    'disablekb': 1,
                    'fs': 0,
                    'rel': 0,
                    'modestbranding': 1
                },
                events: {
                    'onReady': (event) => {
                        console.log('✅ YouTube Player Ready');
                        event.target.setVolume(this.volume * 100);
                    },
                    'onStateChange': (event) => {
                        if (event.data === YT.PlayerState.ENDED) {
                            this.playNextTrack();
                        }
                    }
                }
            });
        };
    }
    
    selectSoundscape(soundKey) {
        console.log('Selecting soundscape:', soundKey);
        
        document.querySelectorAll('.sound-scape-card').forEach(card => card.classList.remove('active'));
        const selectedCard = document.querySelector(`[data-sound="${soundKey}"]`);
        if (selectedCard) selectedCard.classList.add('active');
        
        const tracks = this.audioLibrary[soundKey];
        if (!tracks || tracks.length === 0) return;
        
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            const icon = document.querySelector(`[data-sound="${soundKey}"] .sound-scape-icon`)?.textContent || '🎵';
            nowPlayingLabel.textContent = `${icon} ${tracks[0].title}`;
        }
        
        this.currentSound = soundKey;
        localStorage.setItem('focusMusicSound', soundKey);
        this.loadTrack(tracks[0]);
    }

    loadTrack(track) {
        this.pause();
        
        if (track.youtubeId) {
            this.isYouTubeMode = true;
            if (this.youtubePlayer && this.youtubePlayer.loadVideoById) {
                this.youtubePlayer.loadVideoById(track.youtubeId);
            }
        } else if (track.primary) {
            this.isYouTubeMode = false;
            this.audioElement = new Audio(track.primary);
            this.audioElement.loop = true;
            this.audioElement.volume = this.volume;
        }

        if (this.isPlaying) this.play();
    }
    
    togglePlay() {
        this.isPlaying ? this.pause() : this.play();
    }
    
    play() {
        this.isPlaying = true;
        this.updatePlayButton();

        if (this.isYouTubeMode && this.youtubePlayer && this.youtubePlayer.playVideo) {
            this.youtubePlayer.playVideo();
        } else if (this.audioElement) {
            this.audioElement.play().catch(e => console.error("Audio playback failed", e));
        }
    }
    
    pause() {
        this.isPlaying = false;
        this.updatePlayButton();

        if (this.isYouTubeMode && this.youtubePlayer && this.youtubePlayer.pauseVideo) {
            this.youtubePlayer.pauseVideo();
        } else if (this.audioElement) {
            this.audioElement.pause();
        }
    }
    
    setVolume(level) {
        this.volume = level;
        if (this.audioElement) this.audioElement.volume = level;
        if (this.youtubePlayer && this.youtubePlayer.setVolume) this.youtubePlayer.setVolume(level * 100);
        
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) volumeValue.textContent = Math.round(level * 100) + '%';
        localStorage.setItem('focusMusicVolume', level.toString());
    }
    
    setSleepTimer(minutes) {
        if (this.sleepTimer) clearTimeout(this.sleepTimer);
        document.querySelectorAll('.timer-option-btn').forEach(btn => btn.classList.remove('active'));
        
        this.sleepTimer = setTimeout(() => {
            this.pause();
            showNotification('Sleep timer complete.', 'info');
        }, minutes * 60 * 1000);
    }
    
    playNextTrack() {
        if (!this.currentSound) return;
        const tracks = this.audioLibrary[this.currentSound];
        // For now, random selection for variety
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        this.loadTrack(randomTrack);
        
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            const icon = document.querySelector(`[data-sound="${this.currentSound}"] .sound-scape-icon`)?.textContent || '🎵';
            nowPlayingLabel.textContent = `${icon} ${randomTrack.title}`;
        }
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.innerHTML = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        
        const visualizer = document.getElementById('visualizerContainer');
        if (visualizer) {
            this.isPlaying ? visualizer.classList.add('playing') : visualizer.classList.remove('playing');
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
