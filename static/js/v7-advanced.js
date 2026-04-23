/* V7 Advanced Features JS - Ultimate Version */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Ultimate V7 Features Initialized! 🚀");
    initAnalyticsChart();
    loadKanbanTasks();
    // Use short timeout to ensure container is fully rendered for dimensions
    setTimeout(generateDynamicMindMap, 500);
});

// ============================================
// FEATURE 1: AI Auto-Delegation Kanban & Breakdown
// ============================================
async function loadKanbanTasks() {
    const columns = {
        'backlog': document.querySelector('#colBacklog .kanban-items'),
        'planner': document.querySelector('#colPlanner .kanban-items'),
        'executor': document.querySelector('#colExecutor .kanban-items'),
        'done': document.querySelector('#colDone .kanban-items')
    };
    
    Object.values(columns).forEach(col => { if(col) col.innerHTML = ''; });
    
    try {
        const response = await fetch('/api/tasks/');
        const data = await response.json();
        
        if (data.success) {
            data.tasks.forEach(task => {
                const status = task.kanban_status || 'backlog';
                const col = columns[status];
                if (col) {
                    const item = createKanbanCard(task);
                    col.appendChild(item);
                }
            });
        }
    } catch (err) {
        console.error("Error loading kanban tasks:", err);
    }
}

function createKanbanCard(task) {
    const div = document.createElement('div');
    div.className = 'kanban-item';
    div.id = `kanban-task-${task.id}`;
    div.draggable = true;
    div.setAttribute('ondragstart', 'drag(event)');
    
    div.innerHTML = `
        <div class="kanban-item-content">
            <span class="task-title">${task.title}</span>
            <div class="kanban-item-actions">
                <button class="ai-action-btn" onclick="breakdownTask(${task.id}, event)" title="AI Breakdown">
                    <i class="fas fa-magic"></i>
                </button>
            </div>
        </div>
    `;
    
    if (task.priority === 'high') div.style.borderLeftColor = '#ef4444';
    else if (task.priority === 'low') div.style.borderLeftColor = '#10b981';
    
    return div;
}

async function breakdownTask(taskId, event) {
    if (event) event.stopPropagation();
    const card = document.getElementById(`kanban-task-${taskId}`);
    if (!card) return;

    card.classList.add('ai-processing');
    const titleEl = card.querySelector('.task-title');
    const originalText = titleEl.innerText;
    titleEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> AI Architect thinking...`;

    try {
        // Real logic: In a full app, this would call an OpenAI/Groq endpoint
        // Here we simulate the AI breakdown into subtasks
        setTimeout(async () => {
            card.classList.remove('ai-processing');
            titleEl.innerText = `💡 ${originalText}`;
            
            // Show subtasks as a notification or expandable list
            if (window.showNotification) {
                window.showNotification(`AI broke down: ${originalText} into 3 subtasks`, 'success');
            }
            
            // Add visual cue
            card.style.background = "rgba(16, 185, 129, 0.05)";
            card.style.borderLeftColor = "#10b981";
        }, 1500);
    } catch (err) {
        card.classList.remove('ai-processing');
        titleEl.innerText = originalText;
    }
}

// ============================================
// FEATURE 2: Dynamic Task Mind-Map (Workable)
// ============================================
async function generateDynamicMindMap() {
    const container = document.getElementById('mindmapContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="color: #64748b; font-size: 0.9rem;">Building neural map...</div>';
    
    try {
        const response = await fetch('/api/tasks/');
        const data = await response.json();
        
        if (!data.success || data.tasks.length === 0) {
            container.innerHTML = '<div style="color: #64748b; font-size: 0.9rem;">Add tasks to generate map</div>';
            return;
        }

        container.innerHTML = '';
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Root Node
        const root = createNode('Goal: Focus Hub', centerX, centerY, ['root-node']);
        container.appendChild(root);
        
        // Take top 8 tasks to avoid clutter
        const displayTasks = data.tasks.slice(0, 8);
        const angleStep = 360 / displayTasks.length;
        
        displayTasks.forEach((task, index) => {
            const angle = index * angleStep;
            const distance = 140 + (index % 2 === 0 ? 30 : 0);
            const rad = angle * Math.PI / 180;
            const x = centerX + Math.cos(rad) * distance;
            const y = centerY + Math.sin(rad) * distance;
            
            const node = createNode(task.title, x, y, ['child-node']);
            container.appendChild(node);
            drawLine(centerX, centerY, x, y, container);
        });
    } catch (err) {
        console.error("Mindmap generation failed:", err);
    }
}

function createNode(text, x, y, extraClasses) {
    const el = document.createElement('div');
    el.className = 'mindmap-node ' + (extraClasses || []).join(' ');
    el.innerText = text.length > 20 ? text.substring(0, 17) + '...' : text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.title = text;
    
    el.onclick = function() {
        this.classList.add('pulse');
        setTimeout(() => this.classList.remove('pulse'), 1000);
    };
    
    return el;
}

function drawLine(x1, y1, x2, y2, container) {
    const length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    const angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    const line = document.createElement('div');
    line.className = 'mindmap-line';
    line.style.width = length + 'px';
    line.style.left = x1 + 'px';
    line.style.top = y1 + 'px';
    line.style.transform = `rotate(${angle}deg)`;
    
    container.insertBefore(line, container.firstChild);
}

// ============================================
// FEATURE 3: Deep Work Analytics & Heatmap
// ============================================
async function initAnalyticsChart() {
    initHeatmap();
    const ctx = document.getElementById('flowStateChart');
    if (!ctx) return;
    
    try {
        const response = await fetch('/api/analytics/detailed/');
        const data = await response.json();
        
        if (data.success) {
            renderChart(ctx, data.labels, data.data);
        }
    } catch (err) {
        console.error("Analytics fetch error:", err);
        renderChart(ctx, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [0,0,0,0,0,0,0]);
    }
}

function initHeatmap() {
    const container = document.getElementById('activityHeatmap');
    if (!container) return;
    
    container.innerHTML = '';
    const days = 140; // ~20 weeks
    
    for (let i = 0; i < days; i++) {
        const day = document.createElement('div');
        // Random activity level for demo
        const level = Math.floor(Math.random() * 4);
        day.className = 'heatmap-cell';
        day.style.cssText = `
            width: 12px;
            height: 12px;
            flex-shrink: 0;
            border-radius: 2px;
            background: ${getHeatmapColor(level)};
            transition: transform 0.2s ease;
            cursor: pointer;
        `;
        
        day.onmouseover = () => day.style.transform = 'scale(1.3)';
        day.onmouseout = () => day.style.transform = 'scale(1)';
        
        container.appendChild(day);
    }
}

function getHeatmapColor(level) {
    const colors = [
        'rgba(148, 163, 184, 0.1)', // Empty
        'rgba(99, 102, 241, 0.4)',  // Low
        'rgba(99, 102, 241, 0.7)',  // Med
        'rgba(99, 102, 241, 1)'     // High
    ];
    return colors[level];
}

// ============================================
// FEATURE 4: Brain Dump Persistence
// ============================================
const notesArea = document.getElementById('quickNotesArea');
if (notesArea) {
    // Load saved notes
    notesArea.value = localStorage.getItem('v7_brain_dump') || '';
    
    let saveTimeout;
    notesArea.oninput = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem('v7_brain_dump', notesArea.value);
            showSaveStatus();
        }, 800);
    };
}

function showSaveStatus() {
    const status = document.getElementById('noteSaveStatus');
    if (status) {
        status.style.opacity = '1';
        setTimeout(() => status.style.opacity = '0', 2000);
    }
}

function clearNotes() {
    if (confirm('Clear your brain dump?')) {
        const notesArea = document.getElementById('quickNotesArea');
        if (notesArea) {
            notesArea.value = '';
            localStorage.setItem('v7_brain_dump', '');
        }
    }
}

function renderChart(ctx, labels, dataPoints) {
    const chartExist = Chart.getChart(ctx);
    if(chartExist) chartExist.destroy();
    
    const isDark = document.body.dataset.theme === 'dark';
    const colorLine = '#6366f1';
    const colorGrid = 'rgba(148, 163, 184, 0.1)';
    const colorText = '#64748b';

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks Wrapped',
                data: dataPoints,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                borderColor: colorLine,
                tension: 0.45,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: colorLine,
                pointBorderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: colorGrid },
                    ticks: { color: colorText, stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: colorText }
                }
            }
        }
    });
}


// Kanban drag & drop handlers
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.target.classList.add('dragging');
}

async function drop(ev, columnKey) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const item = document.getElementById(data);
    const col = ev.target.closest('.kanban-col');
    
    if (item && col) {
        col.querySelector('.kanban-items').appendChild(item);
        item.classList.remove('dragging');
        const taskId = data.split('-').pop();
        await updateTaskKanbanStatus(taskId, columnKey);
    }
}

async function updateTaskKanbanStatus(taskId, status) {
    try {
        await fetch(`/api/tasks/${taskId}/update/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ kanban_status: status })
        });
    } catch (e) {
        console.error("Update failed", e);
    }
}

// ============================================
// FEATURE 5: Zen Mode (Focus Deep Work)
// ============================================
let zenTimerInterval;
function toggleZenMode() {
    const overlay = document.getElementById('zenModeOverlay');
    if (!overlay) return;
    
    const isEntering = !overlay.classList.contains('active');
    
    if (isEntering) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        startZenTimer(25); // Default 25 min Pomodoro
        document.body.classList.add('zen-active');
        if (window.showNotification) window.showNotification("Entering Deep Work Mode. Productivity boosted. 🚀", "info");
    } else {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.body.classList.remove('zen-active');
        clearInterval(zenTimerInterval);
    }
}

function startZenTimer(minutes) {
    let seconds = minutes * 60;
    const display = document.getElementById('zenTimer');
    if (!display) return;
    
    clearInterval(zenTimerInterval);
    zenTimerInterval = setInterval(() => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        display.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        
        if (seconds <= 0) {
            clearInterval(zenTimerInterval);
            if (window.showNotification) window.showNotification("Zen session complete! Take a break.", "success");
        }
        seconds--;
    }, 1000);
}

// ============================================
// FEATURE 6: Voice-to-Task Neural Journal
// ============================================
let isJournalRecording = false;
let journalRecognition;

function toggleJournalRecording() {
    const btn = document.getElementById('startJournalBtn');
    const status = document.getElementById('journalStatus');
    
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser.");
        return;
    }

    if (!isJournalRecording) {
        isJournalRecording = true;
        btn.classList.add('recording');
        if (status) status.textContent = "🧠 AI is listening to your thoughts...";
        
        journalRecognition = new webkitSpeechRecognition();
        journalRecognition.continuous = true;
        journalRecognition.interimResults = true;
        
        journalRecognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    processJournalText(event.results[i][0].transcript);
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            const stream = document.getElementById('transcriptionStream');
            if (stream) stream.textContent = interimTranscript;
        };
        
        journalRecognition.start();
    } else {
        isJournalRecording = false;
        if (btn) btn.classList.remove('recording');
        if (status) status.textContent = "Ready to transcribe";
        if (journalRecognition) journalRecognition.stop();
    }
}

function processJournalText(text) {
    const stream = document.getElementById('transcriptionStream');
    if (!stream) return;
    
    const p = document.createElement('p');
    p.className = 'journal-entry-line';
    p.style.cssText = "margin-bottom: 8px; font-size: 0.9rem; opacity: 0.8; border-left: 2px solid #6366f1; padding-left: 10px;";
    p.textContent = `📝 ${text}`;
    stream.appendChild(p);
    
    // AI Task Extraction simulation
    const lowerText = text.toLowerCase();
    if (lowerText.includes('task') || lowerText.includes('todo') || lowerText.includes('remind me') || lowerText.includes('need to')) {
        extractTaskFromJournal(text);
    }
}

function extractTaskFromJournal(text) {
    const preview = document.getElementById('extractedTasksPreview');
    if (!preview) return;
    
    const taskCard = document.createElement('div');
    taskCard.className = 'extracted-task-card';
    taskCard.style.cssText = "background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 12px; margin-top: 10px; border: 1px solid rgba(99, 102, 241, 0.2);";
    
    taskCard.innerHTML = `
        <div class="task-info">
            <span style="font-size: 0.7rem; font-weight: 700; color: #818cf8;">AI EXTRACTED</span>
            <p style="margin: 5px 0; font-size: 0.9rem;">${text}</p>
        </div>
        <button class="v7-mini-btn" onclick="confirmExtractedTask('${text.replace(/'/g, "\\'")}', this)" style="background: #6366f1; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Add to Backlog</button>
    `;
    preview.prepend(taskCard);
}

async function confirmExtractedTask(title, btn) {
    try {
        const response = await fetch('/api/tasks/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ 
                title: title,
                kanban_status: 'backlog',
                priority: 'medium'
            })
        });
        const data = await response.json();
        if (data.success) {
            btn.parentElement.innerHTML = "<span style='color: #10b981; font-weight: 700;'>✅ Added to Backlog</span>";
            if (window.loadKanbanTasks) window.loadKanbanTasks();
        }
    } catch (e) { console.error(e); }
}

// ============================================
// FEATURE 7: AI Productivity Forecast
// ============================================
async function initProductivityForecast() {
    try {
        const response = await fetch('/api/analytics/detailed/');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const totalTasks = data.data.reduce((a, b) => a + b, 0);
            const velocity = (totalTasks / 7).toFixed(1);
            
            const tasksResponse = await fetch('/api/tasks/');
            const tasksData = await tasksResponse.json();
            const remainingCount = tasksData.tasks.filter(t => !t.completed).length;
            
            const daysToClear = velocity > 0 ? Math.ceil(remainingCount / velocity) : '∞';
            const confidence = Math.min(95, Math.floor(Math.random() * 20) + 75); // Simulated confidence
            
            updateForecastUI(velocity, daysToClear, confidence);
        }
    } catch (err) {
        console.error("Forecast error:", err);
    }
}

function updateForecastUI(velocity, days, confidence) {
    const vEl = document.getElementById('forecastVelocity');
    const dEl = document.getElementById('forecastDays');
    const cEl = document.getElementById('forecastConfidence');
    const tEl = document.getElementById('forecastText');
    
    if (vEl) vEl.textContent = velocity;
    if (dEl) dEl.textContent = days;
    if (cEl) cEl.textContent = confidence + '%';
    
    if (tEl) {
        if (days === '∞') {
            tEl.textContent = "AI suggests increasing focus to start making progress.";
        } else {
            tEl.textContent = `At your current velocity, you'll reach 'Inbox Zero' in approximately ${days} days.`;
        }
    }
}

// Global initialization updates
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initProductivityForecast, 1000);
});

