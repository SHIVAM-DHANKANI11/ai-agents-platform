/**
 * Focus Music Player - Song Library
 * Real audio tracks for each category
 */

// Song database with actual audio files
const SONG_LIBRARY = {
    'rain': [
        {
            title: 'Extreme Rain & Thunder',
            artist: 'Nature Sounds',
            duration: '10:00:00',
            youtubeId: 'q76bMs-NwRk'
        },
        {
            title: 'Soft Rain on Window',
            artist: 'Ambient World',
            duration: '3:00:00',
            youtubeId: 'mPZkdNFqePs'
        },
        {
            title: 'Rainforest Rainfall',
            artist: 'Tropical Rain',
            duration: '2:00:00',
            youtubeId: '8mzXNo6lW5E'
        }
    ],
    
    'ocean': [
        {
            title: 'Calm Ocean Waves',
            artist: 'Beach Ambience',
            duration: '8:00:00',
            youtubeId: 'nep79C_S-80'
        },
        {
            title: 'Deep Blue Sea',
            artist: 'Ocean Depth',
            duration: '3:00:00',
            youtubeId: 'vPhg6sc1Mk4'
        },
        {
            title: 'Sunset Beach',
            artist: 'Summer Waves',
            duration: '1:00:00',
            youtubeId: 'LsP_3-Kx-Sg'
        }
    ],
    
    'forest': [
        {
            title: 'Ancient Forest Birds',
            artist: 'Deep Woods',
            duration: '3:00:00',
            youtubeId: 'xNN7iTA57jM'
        },
        {
            title: 'Bamboo Forest',
            artist: 'Zen Garden',
            duration: '2:00:00',
            youtubeId: '7YV6id_Yv20'
        },
        {
            title: 'Night Forest Sounds',
            artist: 'Moonlit Woods',
            duration: '1:30:00',
            youtubeId: 'nSjkshT6390'
        }
    ],
    
    'white-noise': [
        {
            title: 'Starship Engine Room',
            artist: 'Sci-Fi Focus',
            duration: '10:00:00',
            youtubeId: 'ZPoqNeR3_UA'
        },
        {
            title: 'Pure White Noise',
            artist: 'Deep Focus',
            duration: '12:00:00',
            youtubeId: 'nMfPqeZjc2c'
        },
        {
            title: 'Heavy Brown Noise',
            artist: 'Deep Sleep',
            duration: '10:00:00',
            youtubeId: 'hX9_p140UvY'
        }
    ],
    
    'coffee-shop': [
        {
            title: 'Cozy Paris Café',
            artist: 'City Life',
            duration: '3:00:00',
            youtubeId: 'h2zgB93KANE'
        },
        {
            title: 'Lofi Hip Hop Radio',
            artist: 'Lofi Girl',
            duration: 'LIVE',
            youtubeId: 'jfKfPfyJRdk'
        },
        {
            title: 'Rainy Night Coffee',
            artist: 'Jazz Café',
            duration: '4:00:00',
            youtubeId: 'c0_ejQQcrwI'
        }
    ],
    
    'binaural': [
        {
            title: 'Super Intelligence',
            artist: 'Binaural Beats',
            duration: '3:00:00',
            youtubeId: 'L8E_N0_D5tQ'
        },
        {
            title: 'Focus & Concentration',
            artist: 'Alpha Waves',
            duration: '1:00:00',
            youtubeId: 'WPni755-Krg'
        },
        {
            title: 'Deep Meditation',
            artist: 'Theta Waves',
            duration: '1:30:00',
            youtubeId: 'YvstH3Q1tA8'
        }
    ]
};

// Export for use in focus-music-player.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SONG_LIBRARY;
}
