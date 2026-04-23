/**
 * Modern Dashboard UI - JavaScript
 * Handles theme toggling, animations, and interactive features
 */

class ModernDashboard {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeToggle();
        this.setupAnimations();
        this.setupSidebar();
        this.setupFloatingButton();
        this.setupSearch();
        console.log('✅ Modern Dashboard initialized');
    }

    /**
     * Theme Management
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.classList.toggle('dark', theme === 'dark');
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Show notification
        this.showNotification(
            `${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`,
            'info'
        );
    }

    setupThemeToggle() {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Keyboard shortcut: Ctrl+Shift+D
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Smooth Animations
     */
    setupAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-up');
                    entry.target.style.opacity = '1';
                }
            });
        }, observerOptions);

        // Observe all cards
        document.querySelectorAll('.stat-card, .task-card, .glass-card').forEach(card => {
            card.style.opacity = '0';
            observer.observe(card);
        });

        // Stagger animation for stat cards
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    /**
     * Sidebar Management
     */
    setupSidebar() {
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.modern-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                if (overlay) {
                    overlay.classList.toggle('active');
                }
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar?.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        // Close sidebar on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
                sidebar.classList.remove('open');
                overlay?.classList.remove('active');
            }
        });
    }

    /**
     * Floating AI Button
     */
    setupFloatingButton() {
        const floatingBtn = document.querySelector('.floating-ai-btn');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => {
                // Navigate to chat or open AI assistant
                const chatUrl = floatingBtn.dataset.chatUrl || '/chat/';
                window.location.href = chatUrl;
            });

            // Pulse animation on first visit
            if (!localStorage.getItem('ai-btn-intro')) {
                floatingBtn.style.animation = 'pulse 2s ease-in-out 3';
                localStorage.setItem('ai-btn-intro', 'true');
            }
        }
    }

    /**
     * Search Functionality
     */
    setupSearch() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });

        // Keyboard shortcut: Ctrl+K
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    handleSearch(query) {
        if (!query || query.length < 2) return;
        
        console.log('Searching for:', query);
        // Implement search logic here
        // Could filter tasks, navigate to results, etc.
    }

    /**
     * Notification System
     */
    showNotification(message, type = 'info') {
        const container = document.querySelector('.notification-container') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `modern-notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        container.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('notification-exit');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
        return container;
    }

    /**
     * Utility Functions
     */
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        
        return d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
        });
    }

    /**
     * Performance Monitoring
     */
    static measurePerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = performance.getEntriesByType('navigation')[0];
                    const loadTime = Math.round(timing.loadEventEnd - timing.startTime);
                    console.log(`⚡ Page loaded in ${loadTime}ms`);
                }, 0);
            });
        }
    }
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .modern-notification {
        background: var(--bg-glass);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 16px 20px;
        min-width: 300px;
        max-width: 400px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        animation: slideInRight 0.3s ease;
    }

    .notification-info {
        border-left: 4px solid var(--info);
    }

    .notification-success {
        border-left: 4px solid var(--success);
    }

    .notification-warning {
        border-left: 4px solid var(--warning);
    }

    .notification-error {
        border-left: 4px solid var(--danger);
    }

    .notification-message {
        flex: 1;
        font-size: 14px;
        color: var(--text-primary);
        font-weight: 500;
    }

    .notification-close {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        transition: color 0.2s;
    }

    .notification-close:hover {
        color: var(--text-primary);
    }

    .notification-exit {
        animation: slideOutRight 0.3s ease forwards;
    }

    @keyframes slideOutRight {
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(notificationStyles);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ModernDashboard();
    ModernDashboard.measurePerformance();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernDashboard;
}
