/**
 * Daily Goals Widget
 * Set and track daily objectives with progress tracking
 */

class DailyGoals {
    constructor() {
        this.goals = [];
        this.maxGoals = 6;
        
        this.init();
    }
    
    init() {
        // Load saved goals
        const savedGoals = localStorage.getItem('dailyGoals');
        if (savedGoals) {
            this.goals = JSON.parse(savedGoals);
        }
        
        // Check if it's a new day
        this.checkNewDay();
        
        this.renderGoals();
        this.updateProgress();
        
        console.log('🎯 Daily Goals initialized');
    }
    
    checkNewDay() {
        const lastDate = localStorage.getItem('dailyGoalsDate');
        const today = new Date().toDateString();
        
        if (lastDate !== today) {
            // Archive old goals
            if (this.goals.length > 0) {
                this.archiveGoals();
            }
            
            // Reset for new day
            this.goals = [];
            localStorage.setItem('dailyGoalsDate', today);
            localStorage.setItem('dailyGoals', JSON.stringify(this.goals));
            
            console.log('📅 New day started!');
        }
    }
    
    addGoal(text) {
        if (this.goals.length >= this.maxGoals) {
            showNotification(`Maximum ${this.maxGoals} goals allowed per day`, 'error');
            return false;
        }
        
        const goal = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.goals.push(goal);
        this.saveGoals();
        this.renderGoals();
        this.updateProgress();
        
        showNotification('✅ Goal added!', 'success');
        return true;
    }
    
    toggleGoal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (goal) {
            goal.completed = !goal.completed;
            this.saveGoals();
            this.renderGoals();
            this.updateProgress();
            
            if (goal.completed) {
                showNotification('🎉 Goal completed!', 'success');
                this.celebrateCompletion();
            }
        }
    }
    
    deleteGoal(id) {
        this.goals = this.goals.filter(g => g.id !== id);
        this.saveGoals();
        this.renderGoals();
        this.updateProgress();
        
        showNotification('Goal deleted', 'info');
    }
    
    saveGoals() {
        localStorage.setItem('dailyGoals', JSON.stringify(this.goals));
    }
    
    archiveGoals() {
        const archives = JSON.parse(localStorage.getItem('dailyGoalsArchive') || '[]');
        
        const archiveEntry = {
            date: localStorage.getItem('dailyGoalsDate'),
            goals: this.goals,
            completedCount: this.goals.filter(g => g.completed).length
        };
        
        archives.unshift(archiveEntry);
        
        // Keep only last 30 days
        if (archives.length > 30) {
            archives.pop();
        }
        
        localStorage.setItem('dailyGoalsArchive', JSON.stringify(archives));
        console.log('📦 Goals archived');
    }
    
    renderGoals() {
        const goalsList = document.getElementById('goalsList');
        if (!goalsList) return;
        
        if (this.goals.length === 0) {
            goalsList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; opacity: 0.7;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
                    <p style="font-size: 16px; margin-bottom: 8px;">No goals yet!</p>
                    <p style="font-size: 14px;">Add your first goal for today</p>
                </div>
            `;
            return;
        }
        
        goalsList.innerHTML = this.goals.map(goal => `
            <div class="goal-item" data-id="${goal.id}">
                <div 
                    class="goal-checkbox ${goal.completed ? 'checked' : ''}" 
                    onclick="dailyGoals.toggleGoal(${goal.id})"
                ></div>
                <div class="goal-content">
                    <div class="goal-text ${goal.completed ? 'completed' : ''}">${this.escapeHtml(goal.text)}</div>
                    <div class="goal-time">${this.timeAgo(goal.createdAt)}</div>
                </div>
            </div>
        `).join('');
    }
    
    updateProgress() {
        const completed = this.goals.filter(g => g.completed).length;
        const total = this.goals.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Update percentage text
        const percentageEl = document.getElementById('goalsPercentage');
        if (percentageEl) {
            percentageEl.textContent = `${percentage}%`;
        }
        
        // Update progress ring
        const circle = document.getElementById('progressRing');
        if (circle) {
            const radius = 20;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        
        // Update header count
        const countEl = document.getElementById('goalsCount');
        if (countEl) {
            countEl.textContent = `${completed}/${total}`;
        }
    }
    
    celebrateCompletion() {
        // Create confetti effect
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${['#f093fb', '#f5576c', '#ffd700', '#00ff88'][Math.floor(Math.random() * 4)]};
                    left: ${Math.random() * 100}%;
                    top: -10px;
                    z-index: 9999;
                    animation: fall ${1 + Math.random() * 2}s linear forwards;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 100);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }
}

// Initialize widget
let dailyGoals = null;

document.addEventListener('DOMContentLoaded', () => {
    dailyGoals = new DailyGoals();
});

// Global functions for template
function showAddGoalModal() {
    const modal = document.getElementById('addGoalModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('goalInput').focus();
    }
}

function closeAddGoalModal() {
    const modal = document.getElementById('addGoalModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function submitGoal() {
    const input = document.getElementById('goalInput');
    const text = input.value.trim();
    
    if (text && dailyGoals) {
        if (dailyGoals.addGoal(text)) {
            input.value = '';
            closeAddGoalModal();
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Modal close on outside click
    document.getElementById('addGoalModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'addGoalModal') {
            closeAddGoalModal();
        }
    });
    
    // Enter key to submit
    document.getElementById('goalInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitGoal();
        }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAddGoalModal();
        }
    });
});

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

// Add CSS animation for confetti
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
