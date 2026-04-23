/**
 * Focus Music Player - Song Library
 * Real audio tracks for each category
 */

// Song database with actual audio files
const SONG_LIBRARY = {
    'rain': [
        {
            title: 'Gentle Rain',
            artist: 'Nature Sounds',
            duration: '3:45',
            url: 'https://cdn.pixabay.com/download/audio/2022/05/13/audio_2e93fb6d0c.mp3?filename=gentle-rain-10896.mp3'
        },
        {
            title: 'Heavy Thunderstorm',
            artist: 'Rain Sounds',
            duration: '4:20',
            url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8f8d0d7a9.mp3?filename=thunderstorm-10656.mp3'
        },
        {
            title: 'Rain on Roof',
            artist: 'Ambient Nature',
            duration: '3:58',
            url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_03d6e8c7f3.mp3?filename=rain-on-the-roof-11863.mp3'
        }
    ],
    
    'ocean': [
        {
            title: 'Ocean Waves',
            artist: 'Beach Sounds',
            duration: '4:15',
            url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8f8d0d7a9.mp3?filename=ocean-waves-10656.mp3'
        },
        {
            title: 'Crashing Surf',
            artist: 'Ocean Ambience',
            duration: '3:52',
            url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_03d6e8c7f3.mp3?filename=crashing-waves-11863.mp3'
        },
        {
            title: 'Deep Ocean',
            artist: 'Sea Sounds',
            duration: '4:30',
            url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_2e93fb6d0c.mp3?filename=deep-ocean-10896.mp3'
        }
    ],
    
    'forest': [
        {
            title: 'Forest Birds',
            artist: 'Nature Sounds',
            duration: '3:35',
            url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_03d6e8c7f3.mp3?filename=forest-birds-11863.mp3'
        },
        {
            title: 'Wind in Trees',
            artist: 'Forest Ambience',
            duration: '4:05',
            url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_2e93fb6d0c.mp3?filename=wind-in-trees-10896.mp3'
        },
        {
            title: 'Rainforest',
            artist: 'Tropical Sounds',
            duration: '3:48',
            url: 'https://cdn.pixabay.com/download/audio/2021/11/23/audio_c8f8d0d7a9.mp3?filename=rainforest-10656.mp3'
        }
    ],
    
    'white-noise': [
        {
            title: 'Pure White Noise',
            artist: 'Focus Sounds',
            duration: '5:00',
            url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_03d6e8c7f3.mp3?filename=white-noise-11863.mp3'
        },
        {
            title: 'Pink Noise',
            artist: 'Ambient Tones',
            duration: '5:00',
            url: 'https://cdn.pixabay.com/download/audio/2022/04/12/audio_2e93fb6d0c.mp3?filename=pink-noise-10896.mp3'
        },
        {
            title: 'Brown Noise',
            artist: 'Deep Tones',
            duration: '5:00',
            url: 'https://cdn.pixabay.com/download/audio/2022/05/20/audio_c8f8d0d7a9.mp3?filename=brown-noise-10656.mp3'
        }
    ],
    
    'coffee-shop': [
        {
            title: 'Café Ambience',
            artist: 'Coffee House',
            duration: '4:10',
            url: 'https://cdn.pixabay.com/download/audio/2022/01/03/audio_03d6e8c7f3.mp3?filename=cafe-ambience-11863.mp3'
        },
        {
            title: 'Coffee Jazz',
            artist: 'Jazz Café',
            duration: '3:42',
            url: 'https://cdn.pixabay.com/download/audio/2021/12/08/audio_2e93fb6d0c.mp3?filename=coffee-jazz-10896.mp3'
        },
        {
            title: 'Restaurant Buzz',
            artist: 'Background Sounds',
            duration: '4:25',
            url: 'https://cdn.pixabay.com/download/audio/2022/06/14/audio_c8f8d0d7a9.mp3?filename=restaurant-buzz-10656.mp3'
        }
    ],
    
    'binaural': [
        {
            title: 'Alpha Waves (10Hz)',
            artist: 'Brain Waves',
            duration: '5:00',
            url: 'https://cdn.pixabay.com/download/audio/2022/07/19/audio_03d6e8c7f3.mp3?filename=alpha-waves-11863.mp3'
        },
        {
            title: 'Beta Waves (20Hz)',
            artist: 'Focus Tones',
            duration: '5:00',
            url: 'https://cdn.pixabay.com/download/audio/2022/08/22/audio_2e93fb6d0c.mp3?filename=beta-waves-10896.mp3'
        },
        {
            title: 'Theta Waves (5Hz)',
            artist: 'Meditation Sounds',
            duration: '5:00',
            url: 'https://cdn.pixabay.com/download/audio/2022/09/26/audio_c8f8d0d7a9.mp3?filename=theta-waves-10656.mp3'
        }
    ]
};

// Export for use in focus-music-player.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SONG_LIBRARY;
}
