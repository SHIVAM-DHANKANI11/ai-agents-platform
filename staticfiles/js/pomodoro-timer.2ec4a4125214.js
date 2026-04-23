/**
 * Pomodoro Timer Widget
 * Classic productivity technique with customizable intervals
 */

class PomodoroTimer {
    constructor() {
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.isRunning = false;
        this.timerInterval = null;
        this.currentMode = 'pomodoro'; // pomodoro, shortBreak, longBreak
        this.completedPomodoros = 0;
        this.totalFocusTime = 0;
        
        // Settings (in minutes)
        this.modes = {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15
        };
        
        this.init();
    }
    
    init() {
        // Load saved stats
        const savedStats = localStorage.getItem('pomodoroStats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            this.completedPomodoros = stats.completedPomodoros || 0;
            this.totalFocusTime = stats.totalFocusTime || 0;
        }
        
        this.updateDisplay();
        this.updateStats();
        console.log('🍅 Pomodoro Timer initialized');
    }
    
    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updatePlayButton();
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeTimer();
            }
            
            // Update page title
            document.title = `${this.formatTime(this.timeLeft)} - ${this.currentMode === 'pomodoro' ? 'Focus' : 'Break'}`;
        }, 1000);
        
        console.log('▶️ Timer started');
    }
    
    pauseTimer() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.updatePlayButton();
        document.title = 'Paused - Pomodoro Timer';
        
        console.log('⏸️ Timer paused');
    }
    
    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.modes[this.currentMode] * 60;
        this.updateDisplay();
        document.title = 'Pomodoro Timer';
        
        console.log('🔄 Timer reset');
    }
    
    completeTimer() {
        this.pauseTimer();
        
        // Play notification sound
        this.playNotificationSound();
        
        if (this.currentMode === 'pomodoro') {
            this.completedPomodoros++;
            this.totalFocusTime += this.modes.pomodoro;
            this.saveStats();
            
            // Show notification
            showNotification('🍅 Pomodoro complete! Take a break!', 'success');
            
            // Auto-suggest break
            if (this.completedPomodoros % 4 === 0) {
                this.switchMode('longBreak');
            } else {
                this.switchMode('shortBreak');
            }
        } else {
            showNotification('☕ Break over! Ready to focus?', 'success');
            this.switchMode('pomodoro');
        }
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        this.timeLeft = this.modes[mode] * 60;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update mode display
        const modeNames = {
            pomodoro: '🍅 Focus Time',
            shortBreak: '☕ Short Break',
            longBreak: '🌟 Long Break'
        };
        
        const modeElement = document.getElementById('currentMode');
        if (modeElement) {
            modeElement.textContent = modeNames[mode];
        }
        
        this.updateDisplay();
        console.log('Switched to:', mode);
    }
    
    updateDisplay() {
        const timerElement = document.getElementById('timerDisplay');
        if (timerElement) {
            timerElement.textContent = this.formatTime(this.timeLeft);
        }
        
        this.updateProgress();
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateProgress() {
        const totalTime = this.modes[this.currentMode] * 60;
        const progress = ((totalTime - this.timeLeft) / totalTime) * 100;
        
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }
    
    updateStats() {
        const completedEl = document.getElementById('completedPomodoros');
        const focusTimeEl = document.getElementById('totalFocusTime');
        
        if (completedEl) {
            completedEl.textContent = this.completedPomodoros;
        }
        
        if (focusTimeEl) {
            const hours = Math.floor(this.totalFocusTime / 60);
            const mins = this.totalFocusTime % 60;
            focusTimeEl.textContent = `${hours}h ${mins}m`;
        }
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('playPauseBtn');
        if (playBtn) {
            playBtn.innerHTML = this.isRunning ? 
                '<span>⏸️</span> Pause' : 
                '<span>▶️</span> Start';
        }
    }
    
    saveStats() {
        localStorage.setItem('pomodoroStats', JSON.stringify({
            completedPomodoros: this.completedPomodoros,
            totalFocusTime: this.totalFocusTime
        }));
    }
    
    playNotificationSound() {
        // Create pleasant notification sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Play second beep
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            
            gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.5);
        }, 600);
    }
}

// Initialize widget
let pomodoroTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    pomodoroTimer = new PomodoroTimer();
});

// Global functions for template
function startPomodoro() {
    if (pomodoroTimer) {
        pomodoroTimer.startTimer();
    }
}

function pausePomodoro() {
    if (pomodoroTimer) {
        pomodoroTimer.pauseTimer();
    }
}

function resetPomodoro() {
    if (pomodoroTimer) {
        pomodoroTimer.resetTimer();
    }
}

function switchPomodoroMode(mode) {
    if (pomodoroTimer) {
        pomodoroTimer.switchMode(mode);
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
