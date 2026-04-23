/**
 * Advanced Analytics Dashboard
 * Renders interactive charts and visualizations using Chart.js
 */

class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.currentPeriod = 'week';
        this.init();
    }

    init() {
        this.loadAnalyticsData();
        console.log('✅ Analytics Dashboard initialized');
    }

    /**
     * Load analytics data from API
     */
    async loadAnalyticsData() {
        try {
            // Fetch data from API
            const response = await fetch('/api/analytics/stats/');
            const data = await response.json();
            
            if (data.success) {
                this.renderAllCharts(data.stats);
            } else {
                this.renderChartsWithSampleData();
            }
        } catch (error) {
            console.log('Using sample data for charts');
            this.renderChartsWithSampleData();
        }
    }

    /**
     * Render all charts with sample data
     */
    renderChartsWithSampleData() {
        const sampleData = {
            task_completion: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                completed: [5, 8, 6, 9, 7, 4, 3],
                created: [7, 10, 8, 11, 9, 5, 4]
            },
            productivity_trend: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                scores: [72, 78, 85, 88]
            },
            category_distribution: {
                labels: ['Work', 'Personal', 'Health', 'Learning', 'Shopping'],
                values: [35, 25, 20, 15, 5]
            },
            priority_breakdown: {
                labels: ['Urgent', 'High', 'Medium', 'Low'],
                values: [15, 30, 40, 15]
            },
            weekly_hours: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                hours: [6.5, 7.2, 5.8, 8.1, 6.9, 3.2, 2.1]
            },
            stats: {
                total_tasks: 156,
                completed_tasks: 98,
                completion_rate: 63,
                active_projects: 12,
                hours_saved: 47
            }
        };

        this.renderAllCharts(sampleData);
    }

    /**
     * Render all charts
     */
    renderAllCharts(data) {
        this.renderTaskCompletionChart(data.task_completion);
        this.renderProductivityTrendChart(data.productivity_trend);
        this.renderCategoryDistributionChart(data.category_distribution);
        this.renderPriorityBreakdownChart(data.priority_breakdown);
        this.renderWeeklyHoursChart(data.weekly_hours);
        this.updateStatsSummary(data.stats);
        this.renderActivityHeatmap();
        this.renderProgressRings(data.stats);
    }

    /**
     * Task Completion Chart (Bar Chart)
     */
    renderTaskCompletionChart(taskData) {
        const ctx = document.getElementById('taskCompletionChart');
        if (!ctx) return;

        this.charts.taskCompletion = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: taskData.labels,
                datasets: [
                    {
                        label: 'Completed',
                        data: taskData.completed,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    },
                    {
                        label: 'Created',
                        data: taskData.created,
                        backgroundColor: 'rgba(118, 75, 162, 0.8)',
                        borderColor: 'rgba(118, 75, 162, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12, weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 11 },
                            stepSize: 2
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 11, weight: '600' }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * Productivity Trend Chart (Line Chart)
     */
    renderProductivityTrendChart(trendData) {
        const ctx = document.getElementById('productivityTrendChart');
        if (!ctx) return;

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');

        this.charts.productivityTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Productivity Score',
                    data: trendData.scores,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `Score: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) { return value + '%'; },
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11, weight: '600' } }
                    }
                }
            }
        });
    }

    /**
     * Category Distribution (Doughnut Chart)
     */
    renderCategoryDistributionChart(categoryData) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(72, 187, 120, 0.8)',
                        'rgba(237, 137, 54, 0.8)',
                        'rgba(245, 101, 101, 0.8)'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12, weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Priority Breakdown (Pie Chart)
     */
    renderPriorityBreakdownChart(priorityData) {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;

        this.charts.priority = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: priorityData.labels,
                datasets: [{
                    data: priorityData.values,
                    backgroundColor: [
                        'rgba(245, 101, 101, 0.9)',
                        'rgba(237, 137, 54, 0.9)',
                        'rgba(102, 126, 234, 0.9)',
                        'rgba(72, 187, 120, 0.9)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12, weight: '600' }
                        }
                    }
                }
            }
        });
    }

    /**
     * Weekly Hours (Area Chart)
     */
    renderWeeklyHoursChart(hoursData) {
        const ctx = document.getElementById('weeklyHoursChart');
        if (!ctx) return;

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(72, 187, 120, 0.4)');
        gradient.addColorStop(1, 'rgba(72, 187, 120, 0)');

        this.charts.weeklyHours = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hoursData.labels,
                datasets: [{
                    label: 'Hours Worked',
                    data: hoursData.hours,
                    borderColor: 'rgba(72, 187, 120, 1)',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(72, 187, 120, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} hours`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) { return value + 'h'; },
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11, weight: '600' } }
                    }
                }
            }
        });
    }

    /**
     * Update Stats Summary
     */
    updateStatsSummary(stats) {
        if (!stats) return;

        const elements = {
            'totalTasks': stats.total_tasks,
            'completedTasks': stats.completed_tasks,
            'completionRate': stats.completion_rate + '%',
            'activeProjects': stats.active_projects,
            'hoursSaved': stats.hours_saved + 'h'
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
    }

    /**
     * Render Activity Heatmap
     */
    renderActivityHeatmap() {
        const container = document.getElementById('activityHeatmap');
        if (!container) return;

        // Generate sample heatmap data (last 90 days)
        const days = 90;
        const today = new Date();
        let html = '<div class="heatmap-grid">';

        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Random activity level (0-5)
            const level = Math.floor(Math.random() * 6);
            const activityCount = level * 3;
            
            html += `
                <div class="heatmap-cell level-${level}">
                    <div class="tooltip">
                        ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: 
                        ${activityCount} tasks
                    </div>
                </div>
            `;
        }

        html += '</div>';
        html += `
            <div class="heatmap-legend">
                <span>Less</span>
                <div class="legend-cell" style="background: var(--border-color)"></div>
                <div class="legend-cell" style="background: rgba(102, 126, 234, 0.2)"></div>
                <div class="legend-cell" style="background: rgba(102, 126, 234, 0.4)"></div>
                <div class="legend-cell" style="background: rgba(102, 126, 234, 0.6)"></div>
                <div class="legend-cell" style="background: rgba(102, 126, 234, 0.8)"></div>
                <div class="legend-cell" style="background: rgba(102, 126, 234, 1)"></div>
                <span>More</span>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render Progress Rings
     */
    renderProgressRings(stats) {
        // This would be enhanced with SVG animations
        // For now, we'll use simple percentage displays
    }

    /**
     * Update chart period
     */
    updatePeriod(period) {
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Reload data for new period
        this.loadAnalyticsData();
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('taskCompletionChart')) {
        window.analyticsDashboard = new AnalyticsDashboard();
    }
});
