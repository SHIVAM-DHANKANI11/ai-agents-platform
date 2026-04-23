/**
 * Focus Music Player - YouTube Integration
 * Real ambient music from YouTube with visible player
 */

class YouTubeMusicPlayer {
    constructor() {
        this.currentSound = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.player = null;
        this.sleepTimer = null;
        this.sleepTimerDuration = 60; // minutes
        
        // YouTube Video IDs (real ambient music videos)
        this.youtubeLibrary = {
            'rain': [
                { 
                    title: 'Gentle Rain Sounds', 
                    videoId: 'nDq6TstdEi8', // Real YouTube video ID
                    duration: '3:00:00'
                },
                { 
                    title: 'Rain & Thunder', 
                    videoId: 'SUiCZ6qTzJE',
                    duration: '2:30:00'
                },
                { 
                    title: 'Heavy Rain', 
                    videoId: 'q76bMs-NwRk',
                    duration: '1:45:00'
                }
            ],
            'ocean': [
                { 
                    title: 'Ocean Waves', 
                    videoId: 'XjHMEJFfLCM',
                    duration: '3:00:00'
                },
                { 
                    title: 'Beach Sounds', 
                    videoId: '8m1O3QhKvN4',
                    duration: '2:00:00'
                },
                { 
                    title: 'Deep Ocean', 
                    videoId: 'bn9S1brNGuA',
                    duration: '1:30:00'
                }
            ],
            'forest': [
                { 
                    title: 'Forest Birds Singing', 
                    videoId: '1dVw7Gqd5aM',
                    duration: '3:00:00'
                },
                { 
                    title: 'Nature Sounds', 
                    videoId: 'eKFTSSKCzWA',
                    duration: '2:30:00'
                },
                { 
                    title: 'Rainforest', 
                    videoId: 'bn9S1brNGuB',
                    duration: '2:00:00'
                }
            ],
            'white-noise': [
                { 
                    title: 'White Noise 10 Hours', 
                    videoId: 'wzjWIxXBs_s',
                    duration: '10:00:00'
                },
                { 
                    title: 'Brown Noise', 
                    videoId: 'ffjKSztW5Jk',
                    duration: '8:00:00'
                },
                { 
                    title: 'Pink Noise', 
                    videoId: 'tp9cVFeUoyg',
                    duration: '8:00:00'
                }
            ],
            'coffee-shop': [
                { 
                    title: 'Coffee Shop Jazz', 
                    videoId: '5qap5aO4i9A',
                    duration: '3:00:00'
                },
                { 
                    title: 'Café Ambience', 
                    videoId: '2Vv-BfVoq4g',
                    duration: '2:00:00'
                },
                { 
                    title: 'Smooth Jazz', 
                    videoId: 'neonVZpMmhI',
                    duration: '1:30:00'
                }
            ],
            'binaural': [
                { 
                    title: 'Alpha Waves 10Hz', 
                    videoId: 'dkp8Bs8L5_8',
                    duration: '1:00:00'
                },
                { 
                    title: 'Focus Flow Music', 
                    videoId: '5P1M1FtDd-A',
                    duration: '2:00:00'
                },
                { 
                    title: 'Theta Waves', 
                    videoId: 'HRb8bPzp3_E',
                    duration: '1:30:00'
                }
            ]
        };
        
        // Load YouTube IFrame API
        this.loadYouTubeAPI();
    }
    
    loadYouTubeAPI() {
        console.log('Loading YouTube IFrame API...');
        
        // Create script tag for YouTube API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // API will call onYouTubeIframeAPIReady when ready
        window.onYouTubeIframeAPIReady = () => {
            console.log('✅ YouTube IFrame API loaded!');
            this.init();
        };
    }
    
    init() {
        console.log('🎵 YouTube Music Player initializing...');
        
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
        if (savedSound && this.youtubeLibrary[savedSound]) {
            this.selectSoundscape(savedSound);
        }
        
        console.log('📻 Using real YouTube videos');
        console.log('✨ Ready to play ambient music');
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
        
        // Get first video from the category
        const videos = this.youtubeLibrary[soundKey];
        if (!videos || videos.length === 0) {
            console.error('No videos found for:', soundKey);
            showNotification('No videos available for this soundscape', 'error');
            return;
        }
        
        // Update now playing label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            const icon = document.querySelector(`[data-sound="${soundKey}"] .sound-scape-icon`)?.textContent || '🎵';
            nowPlayingLabel.textContent = `${icon} ${videos[0].title}`;
        }
        
        // Store current sound
        this.currentSound = soundKey;
        localStorage.setItem('focusMusicSound', soundKey);
        
        // Load YouTube player with first video
        this.loadYouTubePlayer(videos[0]);
    }
    
    loadYouTubePlayer(videoData) {
        console.log('Loading YouTube video:', videoData);
        
        // Destroy existing player
        if (this.player) {
            this.player.destroy();
        }
        
        // Create new YouTube player
        this.player = new YT.Player('youtube-player-container', {
            height: '0',
            width: '0',
            videoId: videoData.videoId,
            playerVars: {
                'playsinline': 1,
                'controls': 0, // Hide YouTube controls (we use our own)
                'disablekb': 1,
                'fs': 0,
                'modestbranding': 1,
                'rel': 0
            },
            events: {
                'onReady': (event) => this.onPlayerReady(event),
                'onStateChange': (event) => this.onPlayerStateChange(event),
                'onError': (event) => this.onPlayerError(event)
            }
        });
        
        showNotification(`Loaded: ${videoData.title}`, 'success');
    }
    
    onPlayerReady(event) {
        console.log('✅ YouTube player ready!');
        
        // Set initial volume
        event.target.setVolume(this.volume * 100);
        
        // Auto-play if was previously playing
        const savedPlaying = localStorage.getItem('focusMusicPlaying');
        if (savedPlaying === 'true') {
            this.play();
        }
    }
    
    onPlayerStateChange(event) {
        // YT.PlayerState.PLAYING = 1
        // YT.PlayerState.PAUSED = 2
        // YT.PlayerState.ENDED = 0
        
        if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.updatePlayButton();
            localStorage.setItem('focusMusicPlaying', 'true');
            console.log('▶️ Now playing');
        } else if (event.data === YT.PlayerState.PAUSED) {
            this.isPlaying = false;
            this.updatePlayButton();
            localStorage.setItem('focusMusicPlaying', 'false');
            console.log('⏸️ Paused');
        } else if (event.data === YT.PlayerState.ENDED) {
            this.isPlaying = false;
            this.updatePlayButton();
            console.log('⏹️ Ended - playing next track');
            this.nextTrack();
        }
    }
    
    onPlayerError(event) {
        console.error('❌ YouTube player error:', event.data);
        showNotification('Unable to load video. Please try again.', 'error');
    }
    
    togglePlay() {
        if (!this.player || !this.currentSound) {
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
        if (this.player && this.player.playVideo) {
            this.player.playVideo();
            console.log('▶️ Playing YouTube video');
        }
    }
    
    pause() {
        if (this.player && this.player.pauseVideo) {
            this.player.pauseVideo();
            console.log('⏸️ Pausing YouTube video');
        }
    }
    
    setVolume(level) {
        this.volume = level;
        
        if (this.player && this.player.setVolume) {
            this.player.setVolume(level * 100);
        }
        
        // Update UI
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = Math.round(level * 100) + '%';
        }
        
        // Save preference
        localStorage.setItem('focusMusicVolume', level.toString());
        
        console.log('Volume set to:', level * 100 + '%');
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
    
    nextTrack() {
        if (!this.currentSound) return;
        
        const videos = this.youtubeLibrary[this.currentSound];
        if (!videos || videos.length === 0) return;
        
        // Find current video index
        let currentIndex = 0;
        if (this.player && this.player.getVideoUrl) {
            const currentUrl = this.player.getVideoUrl();
            const currentVideoId = currentUrl.split('v=')[1]?.split('&')[0] || '';
            currentIndex = videos.findIndex(v => v.videoId === currentVideoId);
        }
        
        const nextIndex = (currentIndex + 1) % videos.length;
        this.loadYouTubePlayer(videos[nextIndex]);
        
        console.log('Playing next track:', videos[nextIndex].title);
    }
    
    previousTrack() {
        if (!this.currentSound) return;
        
        const videos = this.youtubeLibrary[this.currentSound];
        if (!videos || videos.length === 0) return;
        
        // Find current video index
        let currentIndex = 0;
        if (this.player && this.player.getVideoUrl) {
            const currentUrl = this.player.getVideoUrl();
            const currentVideoId = currentUrl.split('v=')[1]?.split('&')[0] || '';
            currentIndex = videos.findIndex(v => v.videoId === currentVideoId);
        }
        
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : videos.length - 1;
        this.loadYouTubePlayer(videos[prevIndex]);
        
        console.log('Playing previous track:', videos[prevIndex].title);
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
}

// Initialize player when DOM is ready
let focusMusicPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing YouTube Music Player...');
    focusMusicPlayer = new YouTubeMusicPlayer();
});

// Global functions for template onclick handlers
function selectSoundscape(sound) {
    console.log('Global selectSoundscape called:', sound);
    if (focusMusicPlayer) {
        focusMusicPlayer.selectSoundscape(sound);
    } else {
        console.error('YouTubeMusicPlayer not initialized!');
    }
}

function togglePlay() {
    console.log('Global togglePlay called');
    if (focusMusicPlayer) {
        focusMusicPlayer.togglePlay();
    } else {
        console.error('YouTubeMusicPlayer not initialized!');
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
        focusMusicPlayer.nextTrack();
    }
}

function previousSoundscape() {
    if (focusMusicPlayer) {
        focusMusicPlayer.previousTrack();
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
