/**
 * Real-time Notifications System
 * Dropdown UI, notifications management
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    init() {
        this.loadNotifications();
        this.setupNotificationDropdown();
        this.setupAutoRefresh();
        console.log('✅ Notification System initialized');
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        // For now, use sample notifications
        // Can be enhanced with API endpoint
        this.notifications = this.getSampleNotifications();
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateBadge();
    }

    /**
     * Setup notification dropdown
     */
    setupNotificationDropdown() {
        const bellBtn = document.querySelector('.icon-btn .fa-bell')?.parentElement;
        if (!bellBtn) return;

        // Create dropdown
        this.createDropdown(bellBtn);

        // Toggle dropdown
        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close on outside click
        document.addEventListener('click', () => {
            this.closeDropdown();
        });
    }

    /**
     * Create dropdown HTML
     */
    createDropdown(bellBtn) {
        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.id = 'notificationDropdown';

        dropdown.innerHTML = `
            <div class="notification-dropdown-header">
                <div class="notification-dropdown-title">
                    <i class="fas fa-bell"></i>
                    Notifications
                    <span class="notification-badge-count" id="notifBadgeCount">${this.unreadCount}</span>
                </div>
                <div class="notification-dropdown-actions">
                    <button class="notification-action-btn" onclick="window.notificationSystem.markAllRead()">
                        Mark all read
                    </button>
                </div>
            </div>
            <div class="notification-list" id="notificationList">
                ${this.renderNotifications()}
            </div>
            <div class="notification-dropdown-footer">
                <a href="#" class="notification-view-all">View all notifications</a>
            </div>
        `;

        bellBtn.style.position = 'relative';
        bellBtn.appendChild(dropdown);
    }

    /**
     * Render notifications
     */
    renderNotifications() {
        if (this.notifications.length === 0) {
            return `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
        }

        return this.notifications.map(notif => `
            <div class="notification-item ${notif.unread ? 'unread' : ''} ${notif.isNew ? 'new' : ''}" 
                 onclick="window.notificationSystem.handleNotificationClick(${notif.id})">
                <div class="notification-item-header">
                    <div class="notification-icon ${notif.type}">
                        <i class="fas ${notif.icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-message">${notif.message}</div>
                        <div class="notification-time">${notif.time}</div>
                    </div>
                </div>
                ${notif.actions ? `
                    <div class="notification-item-actions">
                        ${notif.actions.map(action => `
                            <button class="notification-item-btn" onclick="event.stopPropagation(); ${action.handler}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Toggle dropdown
     */
    toggleDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
            
            // Add pulse animation to bell
            const bell = document.querySelector('.fa-bell');
            if (bell && this.unreadCount > 0) {
                bell.parentElement.classList.add('notification-bell-pulse');
                setTimeout(() => {
                    bell.parentElement.classList.remove('notification-bell-pulse');
                }, 2000);
            }
        }
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }

    /**
     * Handle notification click
     */
    handleNotificationClick(notifId) {
        const notif = this.notifications.find(n => n.id === notifId);
        if (!notif) return;

        // Mark as read
        notif.read = true;
        notif.unread = false;
        this.unreadCount = this.notifications.filter(n => n.unread).length;
        this.updateBadge();

        // Update UI
        const list = document.getElementById('notificationList');
        if (list) {
            list.innerHTML = this.renderNotifications();
        }

        // Handle action
        if (notif.action) {
            notif.action();
            this.closeDropdown();
        }
    }

    /**
     * Mark all as read
     */
    markAllRead() {
        this.notifications.forEach(n => {
            n.read = true;
            n.unread = false;
        });
        this.unreadCount = 0;
        this.updateBadge();

        const list = document.getElementById('notificationList');
        if (list) {
            list.innerHTML = this.renderNotifications();
        }
    }

    /**
     * Update badge count
     */
    updateBadge() {
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        });

        const badgeCount = document.getElementById('notifBadgeCount');
        if (badgeCount) {
            badgeCount.textContent = this.unreadCount;
        }
    }

    /**
     * Add new notification
     */
    addNotification(notif) {
        const newNotif = {
            id: Date.now(),
            title: notif.title,
            message: notif.message,
            type: notif.type || 'info',
            icon: notif.icon || 'fa-info-circle',
            time: 'Just now',
            unread: true,
            isNew: true,
            action: notif.action || null,
            actions: notif.actions || []
        };

        this.notifications.unshift(newNotif);
        this.unreadCount++;
        this.updateBadge();

        // Update UI
        const list = document.getElementById('notificationList');
        if (list) {
            list.innerHTML = this.renderNotifications();
        }

        // Show toast
        if (window.dashboard) {
            window.dashboard.showNotification(`${newNotif.title}: ${newNotif.message}`, newNotif.type);
        }
    }

    /**
     * Setup auto-refresh (polling for new notifications)
     */
    setupAutoRefresh() {
        // Poll every 30 seconds
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000);
    }

    /**
     * Check for new notifications
     */
    async checkForNewNotifications() {
        // This would call an API endpoint
        // For now, randomly add a notification for demo
        if (Math.random() > 0.7) {
            const sampleNotifs = [
                {
                    title: 'Task Due Soon',
                    message: 'You have 3 tasks due tomorrow',
                    type: 'warning',
                    icon: 'fa-clock',
                    action: () => window.location.href = '/tasks/'
                },
                {
                    title: 'Goal Progress',
                    message: 'You\'re 75% towards your weekly goal!',
                    type: 'success',
                    icon: 'fa-trophy',
                    action: () => window.location.href = '/dashboard/'
                }
            ];

            const randomNotif = sampleNotifs[Math.floor(Math.random() * sampleNotifs.length)];
            this.addNotification(randomNotif);
        }
    }

    /**
     * Sample notifications
     */
    getSampleNotifications() {
        return [
            {
                id: 1,
                title: 'Task Created',
                message: 'AI created a new task: "Finish dashboard design"',
                type: 'task',
                icon: 'fa-plus-circle',
                time: '5 minutes ago',
                unread: true,
                isNew: false,
                action: () => window.location.href = '/tasks/'
            },
            {
                id: 2,
                title: 'Reminder',
                message: 'Team meeting in 30 minutes',
                type: 'warning',
                icon: 'fa-clock',
                time: '25 minutes ago',
                unread: true,
                isNew: false,
                actions: [
                    { label: 'Snooze', handler: 'window.notificationSystem.showNotification("Snoozed for 15 min", "info")' },
                    { label: 'Dismiss', handler: 'window.notificationSystem.showNotification("Dismissed", "info")' }
                ]
            },
            {
                id: 3,
                title: 'Task Completed',
                message: 'Great job! You completed 10 tasks today',
                type: 'success',
                icon: 'fa-check-circle',
                time: '1 hour ago',
                unread: false,
                isNew: false
            },
            {
                id: 4,
                title: 'Weekly Report',
                message: 'Your productivity increased by 15% this week',
                type: 'info',
                icon: 'fa-chart-line',
                time: '2 hours ago',
                unread: false,
                isNew: false,
                action: () => window.location.href = '/analytics/'
            }
        ];
    }

    /**
     * Show notification (wrapper for dashboard.showNotification)
     */
    showNotification(message, type = 'info') {
        if (window.dashboard) {
            window.dashboard.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem = new NotificationSystem();
});
