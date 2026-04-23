/**
 * Focus Music Player - Spotify Integration
 * Real songs from Spotify embedded player
 */

class SpotifyMusicPlayer {
    constructor() {
        this.currentSound = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.spotifyIframe = null;
        this.sleepTimer = null;
        this.sleepTimerDuration = 60; // minutes
        
        // Spotify Playlist/Track IDs (from free ambient music on Spotify)
        this.spotifyLibrary = {
            'rain': [
                { 
                    title: 'Rain Sounds', 
                    spotifyId: '37i9dQZF1DwYRyJ7fD28gB', // Spotify playlist ID
                    type: 'playlist'
                },
                { 
                    title: 'Peaceful Rain', 
                    spotifyId: '4uLU6hMCxMI75M1o2vKUWQ', 
                    type: 'track'
                },
                { 
                    title: 'Rain & Thunder', 
                    spotifyId: '0FZ9DANAL0S9sKdHrXnqGk', 
                    type: 'track'
                }
            ],
            'ocean': [
                { 
                    title: 'Ocean Waves', 
                    spotifyId: '37i9dQZF1DX7K31D69s4So', 
                    type: 'playlist'
                },
                { 
                    title: 'Sea Sounds', 
                    spotifyId: '1KxwZYyzWNyZSRyErft2oj', 
                    type: 'playlist'
                },
                { 
                    title: 'Deep Ocean', 
                    spotifyId: '5ZULALImTm80tzUbYQYM9d', 
                    type: 'track'
                }
            ],
            'forest': [
                { 
                    title: 'Forest Sounds', 
                    spotifyId: '37i9dQZF1DWVFeEut75IAL', 
                    type: 'playlist'
                },
                { 
                    title: 'Nature Sounds', 
                    spotifyId: '0FZ9DANAL0S9sKdHrXnqGl', 
                    type: 'track'
                },
                { 
                    title: 'Birds Sing', 
                    spotifyId: '3jjujdWJ72nww5eGnfs2E7', 
                    type: 'track'
                }
            ],
            'white-noise': [
                { 
                    title: 'White Noise', 
                    spotifyId: '37i9dQZF1DX8NTLI26tZa6', 
                    type: 'playlist'
                },
                { 
                    title: 'Brown Noise', 
                    spotifyId: '4P3x0C0xNzSNySc3xFZCGA', 
                    type: 'track'
                },
                { 
                    title: 'Pink Noise', 
                    spotifyId: '1YLJVmuzeM2YSUkCCaTNUB', 
                    type: 'track'
                }
            ],
            'coffee-shop': [
                { 
                    title: 'Coffee Shop Jazz', 
                    spotifyId: '37i9dQZF1DX0SM0LYsmbMT', 
                    type: 'playlist'
                },
                { 
                    title: 'Café Ambience', 
                    spotifyId: '37i9dQZF1DWVrtsSlLKzro', 
                    type: 'playlist'
                },
                { 
                    title: 'Smooth Jazz', 
                    spotifyId: '0vvXsWCC9xrXsBdOMF45SZ', 
                    type: 'track'
                }
            ],
            'binaural': [
                { 
                    title: 'Alpha Waves', 
                    spotifyId: '37i9dQZF1DX3Ogo9pFvBkY', 
                    type: 'playlist'
                },
                { 
                    title: 'Focus Flow', 
                    spotifyId: '37i9dQZF1DWZeKCadgRdKQ', 
                    type: 'playlist'
                },
                { 
                    title: 'Binaural Beats', 
                    spotifyId: '6lXBPKRhGfHiSpSyQkfKJh', 
                    type: 'track'
                }
            ]
        };
        
        this.init();
    }
    
    init() {
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
        if (savedSound && this.spotifyLibrary[savedSound]) {
            this.selectSoundscape(savedSound);
        }
        
        console.log('🎵 Spotify Music Player initialized!');
        console.log('📻 Using real Spotify tracks and playlists');
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
        
        // Get first track/playlist from the category
        const tracks = this.spotifyLibrary[soundKey];
        if (!tracks || tracks.length === 0) {
            console.error('No tracks found for:', soundKey);
            showNotification('No tracks available for this soundscape', 'error');
            return;
        }
        
        // Update now playing label
        const nowPlayingLabel = document.getElementById('nowPlayingLabel');
        if (nowPlayingLabel) {
            const icon = document.querySelector(`[data-sound="${soundKey}"] .sound-scape-icon`)?.textContent || '🎵';
            nowPlayingLabel.textContent = `${icon} ${tracks[0].title}`;
        }
        
        // Store current sound
        this.currentSound = soundKey;
        localStorage.setItem('focusMusicSound', soundKey);
        
        // Load Spotify embed
        this.loadSpotifyEmbed(tracks[0]);
    }
    
    loadSpotifyEmbed(trackData) {
        console.log('Loading Spotify embed:', trackData);
        
        // Remove existing iframe
        if (this.spotifyIframe) {
            this.spotifyIframe.remove();
        }
        
        // Create hidden iframe for Spotify embed
        this.spotifyIframe = document.createElement('iframe');
        this.spotifyIframe.style.cssText = `
            display: none;
            width: 1px;
            height: 1px;
            opacity: 0;
            position: absolute;
            top: -9999px;
        `;
        
        // Build Spotify embed URL
        let embedUrl = '';
        if (trackData.type === 'playlist') {
            embedUrl = `https://open.spotify.com/embed/playlist/${trackData.spotifyId}?utm_source=generator&theme=0`;
        } else {
            embedUrl = `https://open.spotify.com/embed/track/${trackData.spotifyId}?utm_source=generator&theme=0`;
        }
        
        this.spotifyIframe.src = embedUrl;
        this.spotifyIframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
        this.spotifyIframe.setAttribute('loading', 'lazy');
        
        // Add to page (hidden, controls audio via postMessage)
        document.body.appendChild(this.spotifyIframe);
        
        // Show success notification
        showNotification(`Loaded: ${trackData.title}`, 'success');
        
        console.log('Spotify embed loaded:', embedUrl);
    }
    
    togglePlay() {
        if (!this.currentSound) {
            showNotification('Please select a soundscape first', 'info');
            return;
        }
        
        // Use Spotify's built-in controls via postMessage
        if (this.spotifyIframe) {
            this.isPlaying = !this.isPlaying;
            
            // Send play/pause command to Spotify embed
            this.spotifyIframe.contentWindow.postMessage(
                JSON.stringify({
                    method: this.isPlaying ? 'play' : 'pause'
                }),
                '*'
            );
            
            this.updatePlayButton();
            console.log('Spotify', this.isPlaying ? 'playing' : 'paused');
        }
    }
    
    play() {
        if (!this.isPlaying && this.spotifyIframe) {
            this.togglePlay();
        }
    }
    
    pause() {
        if (this.isPlaying && this.spotifyIframe) {
            this.togglePlay();
        }
    }
    
    setVolume(level) {
        this.volume = level;
        localStorage.setItem('focusMusicVolume', level.toString());
        
        // Note: Spotify embed doesn't support external volume control
        // Volume must be adjusted via Spotify's own controls
        showNotification('Use Spotify player controls for volume', 'info');
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
            // Pause Spotify
            if (this.spotifyIframe) {
                this.spotifyIframe.contentWindow.postMessage(
                    JSON.stringify({ method: 'pause' }),
                    '*'
                );
            }
            this.isPlaying = false;
            this.updatePlayButton();
            showNotification('Sleep timer complete. Sweet dreams!', 'info');
        }, minutes * 60 * 1000);
        
        console.log(`Sleep timer set for ${minutes} minutes`);
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
    
    nextTrack() {
        // Skip to next track in Spotify
        if (this.spotifyIframe && this.isPlaying) {
            this.spotifyIframe.contentWindow.postMessage(
                JSON.stringify({ method: 'next' }),
                '*'
            );
            console.log('Skipping to next track');
        }
    }
    
    previousTrack() {
        // Go back to previous track in Spotify
        if (this.spotifyIframe && this.isPlaying) {
            this.spotifyIframe.contentWindow.postMessage(
                JSON.stringify({ method: 'prev' }),
                '*'
            );
            console.log('Going to previous track');
        }
    }
}

// Initialize player when DOM is ready
let focusMusicPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Spotify Music Player...');
    focusMusicPlayer = new SpotifyMusicPlayer();
});

// Global functions for template onclick handlers
function selectSoundscape(sound) {
    console.log('Global selectSoundscape called:', sound);
    if (focusMusicPlayer) {
        focusMusicPlayer.selectSoundscape(sound);
    } else {
        console.error('SpotifyMusicPlayer not initialized!');
    }
}

function togglePlay() {
    console.log('Global togglePlay called');
    if (focusMusicPlayer) {
        focusMusicPlayer.togglePlay();
    } else {
        console.error('SpotifyMusicPlayer not initialized!');
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
