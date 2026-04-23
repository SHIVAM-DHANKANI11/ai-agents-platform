/**
 * Enhanced Task Management
 * Drag-and-drop, subtasks, filtering, bulk actions
 */

class TaskManager {
    constructor() {
        this.tasks = [];
        this.selectedTasks = new Set();
        this.draggedTask = null;
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupDragAndDrop();
        this.setupFilters();
        this.setupBulkActions();
        console.log('✅ Task Manager initialized');
    }

    /**
     * Load tasks from API
     */
    async loadTasks() {
        try {
            const response = await fetch('/api/tasks/');
            const data = await response.json();
            
            if (data.success) {
                this.tasks = data.tasks;
                this.renderTasks();
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    /**
     * Render tasks in board view
     */
    renderTasks() {
        const todoColumn = document.getElementById('todoTasks');
        const progressColumn = document.getElementById('progressTasks');
        const doneColumn = document.getElementById('doneTasks');

        if (!todoColumn || !progressColumn || !doneColumn) return;

        // Clear columns
        todoColumn.innerHTML = '';
        progressColumn.innerHTML = '';
        doneColumn.innerHTML = '';

        // Filter and render tasks
        const filteredTasks = this.applyFilters(this.tasks);

        filteredTasks.forEach(task => {
            const taskCard = this.createTaskCard(task);
            
            if (task.completed) {
                doneColumn.appendChild(taskCard);
            } else if (task.in_progress) {
                progressColumn.appendChild(taskCard);
            } else {
                todoColumn.appendChild(taskCard);
            }
        });

        // Update counts
        this.updateColumnCounts();
    }

    /**
     * Create task card element
     */
    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card-enhanced';
        card.draggable = true;
        card.dataset.taskId = task.id;

        const subtaskProgress = this.calculateSubtaskProgress(task);
        const isOverdue = this.isTaskOverdue(task);

        card.innerHTML = `
            <div class="task-header">
                <span class="task-drag-handle" title="Drag to reorder">
                    <i class="fas fa-grip-vertical"></i>
                </span>
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="event.stopPropagation(); window.taskManager.toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-title">${this.escapeHtml(task.title)}</div>
            </div>
            
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            
            <div class="task-meta-enhanced">
                <span class="task-badge-enhanced priority-${task.priority}">${task.priority}</span>
                ${task.category ? `<span class="task-badge-enhanced category">${task.category}</span>` : ''}
                ${task.due_date ? `<span class="task-badge-enhanced due-date ${isOverdue ? 'overdue' : ''}"><i class="fas fa-calendar"></i> ${this.formatDate(task.due_date)}</span>` : ''}
            </div>
            
            ${task.subtasks && task.subtasks.length > 0 ? `
                <div class="task-subtasks">
                    <div class="subtask-progress">
                        <div class="subtask-progress-bar">
                            <div class="subtask-progress-fill" style="width: ${subtaskProgress}%"></div>
                        </div>
                        <span class="subtask-progress-text">${subtaskProgress}%</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="task-footer">
                <div class="task-assignee">
                    <div class="task-assignee-avatar">${task.user ? task.user.charAt(0).toUpperCase() : 'U'}</div>
                    <span class="task-assignee-name">${task.user || 'Unassigned'}</span>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="event.stopPropagation(); window.taskManager.editTask(${task.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn" onclick="event.stopPropagation(); window.taskManager.deleteTask(${task.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Click to open task details
        card.addEventListener('click', () => this.openTaskModal(task));

        return card;
    }

    /**
     * Setup drag and drop
     */
    setupDragAndDrop() {
        const columns = document.querySelectorAll('.task-column');
        
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.style.background = 'var(--bg-glass-hover)';
            });

            column.addEventListener('dragleave', () => {
                column.style.background = 'var(--bg-glass)';
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.style.background = 'var(--bg-glass)';
                
                if (this.draggedTask) {
                    this.handleDrop(this.draggedTask, column);
                }
            });
        });

        // Task card drag events
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card-enhanced')) {
                this.draggedTask = e.target;
                e.target.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card-enhanced')) {
                e.target.classList.remove('dragging');
                this.draggedTask = null;
            }
        });
    }

    /**
     * Handle task drop
     */
    async handleDrop(taskCard, column) {
        const taskId = parseInt(taskCard.dataset.taskId);
        const columnId = column.id;

        let updates = {};

        if (columnId === 'todoTasks') {
            updates = { completed: false, in_progress: false };
        } else if (columnId === 'progressTasks') {
            updates = { completed: false, in_progress: true };
        } else if (columnId === 'doneTasks') {
            updates = { completed: true, in_progress: false };
        }

        await this.updateTask(taskId, updates);
    }

    /**
     * Toggle task completion
     */
    async toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        await this.updateTask(taskId, { completed: !task.completed });
    }

    /**
     * Update task via API
     */
    async updateTask(taskId, updates) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/update/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (data.success) {
                await this.loadTasks();
                this.showNotification('Task updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showNotification('Failed to update task', 'error');
        }
    }

    /**
     * Setup filters
     */
    setupFilters() {
        const filterInputs = document.querySelectorAll('.filter-select, .filter-input');
        
        filterInputs.forEach(input => {
            input.addEventListener('change', () => this.renderTasks());
            input.addEventListener('input', () => this.renderTasks());
        });
    }

    /**
     * Apply filters to tasks
     */
    applyFilters(tasks) {
        let filtered = [...tasks];

        // Priority filter
        const priorityFilter = document.getElementById('filterPriority');
        if (priorityFilter && priorityFilter.value) {
            filtered = filtered.filter(t => t.priority === priorityFilter.value);
        }

        // Category filter
        const categoryFilter = document.getElementById('filterCategory');
        if (categoryFilter && categoryFilter.value) {
            filtered = filtered.filter(t => t.category === categoryFilter.value);
        }

        // Search filter
        const searchFilter = document.getElementById('filterSearch');
        if (searchFilter && searchFilter.value) {
            const search = searchFilter.value.toLowerCase();
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(search) ||
                (t.description && t.description.toLowerCase().includes(search))
            );
        }

        return filtered;
    }

    /**
     * Setup bulk actions
     */
    setupBulkActions() {
        // This would be enhanced with multi-select checkboxes
    }

    /**
     * Open task modal
     */
    openTaskModal(task) {
        // Create or show task detail modal
        this.showTaskDetails(task);
    }

    /**
     * Show task details
     */
    showTaskDetails(task) {
        const modal = document.createElement('div');
        modal.className = 'task-modal active';
        modal.innerHTML = `
            <div class="task-modal-content">
                <div class="task-modal-header">
                    <h2 class="task-modal-title">${this.escapeHtml(task.title)}</h2>
                    <button class="task-modal-close" onclick="this.closest('.task-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="task-form-group">
                    <label class="task-form-label">Description</label>
                    <textarea class="task-form-textarea" readonly>${task.description || 'No description'}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="task-form-group">
                        <label class="task-form-label">Priority</label>
                        <input class="task-form-input" value="${task.priority}" readonly>
                    </div>
                    <div class="task-form-group">
                        <label class="task-form-label">Category</label>
                        <input class="task-form-input" value="${task.category || 'None'}" readonly>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="task-form-group">
                        <label class="task-form-label">Due Date</label>
                        <input class="task-form-input" value="${task.due_date || 'No due date'}" readonly>
                    </div>
                    <div class="task-form-group">
                        <label class="task-form-label">Status</label>
                        <input class="task-form-input" value="${task.completed ? 'Completed' : task.in_progress ? 'In Progress' : 'Todo'}" readonly>
                    </div>
                </div>
                
                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div class="task-form-group">
                        <label class="task-form-label">Subtasks</label>
                        <div class="subtask-list">
                            ${task.subtasks.map(st => `
                                <div class="subtask-item">
                                    <div class="subtask-checkbox ${st.completed ? 'checked' : ''}"></div>
                                    <span class="subtask-text ${st.completed ? 'completed' : ''}">${this.escapeHtml(st.title)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Edit task
     */
    editTask(taskId) {
        // Navigate to task edit page or open edit modal
        this.showNotification('Edit task feature - coming soon', 'info');
    }

    /**
     * Delete task
     */
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}/delete/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            const data = await response.json();

            if (data.success) {
                await this.loadTasks();
                this.showNotification('Task deleted', 'success');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showNotification('Failed to delete task', 'error');
        }
    }

    /**
     * Calculate subtask progress
     */
    calculateSubtaskProgress(task) {
        if (!task.subtasks || task.subtasks.length === 0) return 0;
        
        const completed = task.subtasks.filter(st => st.completed).length;
        return Math.round((completed / task.subtasks.length) * 100);
    }

    /**
     * Check if task is overdue
     */
    isTaskOverdue(task) {
        if (!task.due_date || task.completed) return false;
        
        const dueDate = new Date(task.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return dueDate < today;
    }

    /**
     * Update column counts
     */
    updateColumnCounts() {
        const todoCount = document.getElementById('todoCount');
        const progressCount = document.getElementById('progressCount');
        const doneCount = document.getElementById('doneCount');

        if (todoCount) {
            const count = this.tasks.filter(t => !t.completed && !t.in_progress).length;
            todoCount.textContent = count;
        }

        if (progressCount) {
            const count = this.tasks.filter(t => t.in_progress && !t.completed).length;
            progressCount.textContent = count;
        }

        if (doneCount) {
            const count = this.tasks.filter(t => t.completed).length;
            doneCount.textContent = count;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.dashboard) {
            window.dashboard.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = date - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        if (days === -1) return 'Yesterday';
        if (days > 0 && days < 7) return `In ${days} days`;
        if (days < 0 && days > -7) return `${Math.abs(days)} days ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('todoTasks')) {
        window.taskManager = new TaskManager();
    }
});
