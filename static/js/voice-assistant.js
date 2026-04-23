/**
 * Voice Assistant - Speech Recognition & Commands
 * Integrates with Web Speech API for voice input
 */

class VoiceAssistant {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.transcript = '';
        this.synth = window.speechSynthesis;
        this.init();
    }

    init() {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('⚠️ Speech recognition not supported');
            this.showNotSupported();
            return;
        }

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.setupEventListeners();
        this.setupVoiceButtons();
        
        console.log('✅ Voice Assistant initialized');
    }

    setupEventListeners() {
        // Start recording
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateUI();
            console.log('🎤 Recording started');
        };

        // End recording
        this.recognition.onend = () => {
            this.isRecording = false;
            this.updateUI();
            console.log('⏹️ Recording ended');
        };

        // Results
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            this.transcript = finalTranscript || interimTranscript;
            this.updateTranscription(this.transcript, !finalTranscript);

            if (finalTranscript) {
                this.processVoiceCommand(finalTranscript);
            }
        };

        // Error handling
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showError(event.error);
        };
    }

    setupVoiceButtons() {
        // Voice buttons in chat/input areas
        document.addEventListener('click', (e) => {
            if (e.target.closest('.voice-btn')) {
                e.preventDefault();
                this.toggleRecording();
            }
        });

        // Keyboard shortcut: Ctrl+Shift+V
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.toggleRecording();
            }
        });
    }

    /**
     * Toggle recording state
     */
    toggleRecording() {
        if (!this.recognition) {
            this.showNotSupported();
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        try {
            this.transcript = '';
            this.recognition.start();
            this.showVoiceModal();
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.showError('Failed to start recording');
        }
    }

    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
            this.hideVoiceModal();
        }
    }

    /**
     * Process voice commands
     */
    processVoiceCommand(command) {
        const lowerCommand = command.toLowerCase().trim();
        console.log('🎯 Processing command:', lowerCommand);

        // Task creation commands
        if (lowerCommand.includes('create task') || lowerCommand.includes('add task') || lowerCommand.includes('new task')) {
            this.extractAndCreateTask(lowerCommand);
        }
        // Show tasks
        else if (lowerCommand.includes('show tasks') || lowerCommand.includes('my tasks')) {
            this.navigateTo('/tasks/');
            this.speak('Opening your tasks');
        }
        // Show analytics
        else if (lowerCommand.includes('show analytics') || lowerCommand.includes('analytics')) {
            this.navigateTo('/analytics/');
            this.speak('Opening analytics dashboard');
        }
        // Show calendar
        else if (lowerCommand.includes('show calendar') || lowerCommand.includes('calendar')) {
            this.navigateTo('/calendar/');
            this.speak('Opening calendar');
        }
        // Show dashboard
        else if (lowerCommand.includes('go to dashboard') || lowerCommand.includes('home')) {
            this.navigateTo('/dashboard/');
            this.speak('Going to dashboard');
        }
        // Create event
        else if (lowerCommand.includes('create event') || lowerCommand.includes('schedule meeting')) {
            this.speak('Opening calendar to create event');
            this.navigateTo('/calendar/');
        }
        // Help
        else if (lowerCommand.includes('help') || lowerCommand.includes('what can i say')) {
            this.showHelp();
        }
        // Default: send to chat
        else {
            this.sendToChat(command);
        }
    }

    /**
     * Extract task details and create task
     */
    extractAndCreateTask(command) {
        // Simple extraction - can be enhanced with NLP
        let title = command
            .replace(/create task|add task|new task|to|the|for|me|please|a|an/gi, '')
            .trim();

        if (title.length > 5) {
            this.createTask(title);
        } else {
            this.speak('Please provide more details for the task');
            this.showResponse('Task Creation', 'Please provide more details. Example: "Create a task to finish the dashboard design by Friday"');
        }
    }

    /**
     * Create task via API
     */
    async createTask(title) {
        try {
            const response = await fetch('/api/tasks/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    title: title,
                    priority: 'medium'
                })
            });

            const data = await response.json();

            if (data.success) {
                this.speak(`Task created: ${title}`);
                this.showResponse('Task Created', title);
            } else {
                this.speak('Failed to create task');
                this.showResponse('Error', 'Failed to create task. Please try again.');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            this.speak('Error creating task');
        }
    }

    /**
     * Send message to chat
     */
    async sendToChat(message) {
        try {
            // Get or create chat session
            const sessionResponse = await fetch('/api/chat/sessions/new/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            const sessionData = await sessionResponse.json();
            
            // Send message
            const chatResponse = await fetch('/api/chat/send/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    message: message,
                    session_id: sessionData.session_id
                })
            });

            const chatData = await chatResponse.json();

            if (chatData.success) {
                this.speak(chatData.response || 'Message sent');
                this.showResponse('AI Response', chatData.response || 'Processing your request');
                
                // Navigate to chat after delay
                setTimeout(() => {
                    this.navigateTo('/chat/');
                }, 2000);
            }
        } catch (error) {
            console.error('Error sending to chat:', error);
            this.speak('Error processing request');
        }
    }

    /**
     * Text-to-Speech
     */
    speak(text) {
        if (!this.synth) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Try to use a good voice
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => 
            v.name.includes('Google') || v.name.includes('Microsoft')
        );
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        this.synth.speak(utterance);
    }

    /**
     * UI Updates
     */
    showVoiceModal() {
        let modal = document.querySelector('.voice-modal');
        if (!modal) {
            this.createVoiceModal();
            modal = document.querySelector('.voice-modal');
        }
        modal.classList.add('active');
        this.updateUI();
    }

    hideVoiceModal() {
        const modal = document.querySelector('.voice-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    createVoiceModal() {
        const modal = document.createElement('div');
        modal.className = 'voice-modal';
        modal.innerHTML = `
            <div class="voice-modal-content">
                <div class="voice-modal-header">
                    <h2><i class="fas fa-microphone"></i> Voice Assistant</h2>
                    <p>Speak naturally to control your dashboard</p>
                </div>

                <div class="voice-visualizer" id="voiceVisualizer">
                    ${Array(9).fill('<div class="voice-wave"></div>').join('')}
                </div>

                <div class="voice-transcription">
                    <div class="label">Transcription</div>
                    <div class="text listening" id="voiceTranscription">
                        Listening...
                    </div>
                </div>

                <div id="voiceResponseContainer"></div>

                <div class="voice-status">
                    <span class="status-dot active" id="voiceStatusDot"></span>
                    <span id="voiceStatusText">Listening</span>
                </div>

                <div class="voice-actions">
                    <button class="voice-action-btn secondary" onclick="window.voiceAssistant.stopRecording()">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                    <button class="voice-action-btn primary" onclick="window.voiceAssistant.clearAndRestart()">
                        <i class="fas fa-redo"></i> Clear & Restart
                    </button>
                </div>

                <div class="voice-commands-help">
                    <h3><i class="fas fa-info-circle"></i> Voice Commands</h3>
                    <div class="voice-commands-list">
                        <div class="voice-command-item">
                            <code>Create task to...</code>
                            <span>Add new task</span>
                        </div>
                        <div class="voice-command-item">
                            <code>Show tasks</code>
                            <span>View all tasks</span>
                        </div>
                        <div class="voice-command-item">
                            <code>Show analytics</code>
                            <span>Open analytics</span>
                        </div>
                        <div class="voice-command-item">
                            <code>Show calendar</code>
                            <span>View calendar</span>
                        </div>
                        <div class="voice-command-item">
                            <code>Go to dashboard</code>
                            <span>Go home</span>
                        </div>
                        <div class="voice-command-item">
                            <code>Help</code>
                            <span>Show commands</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.stopRecording();
            }
        });

        // Activate wave animation
        this.updateWaveAnimation(true);
    }

    updateWaveAnimation(active) {
        const waves = document.querySelectorAll('.voice-wave');
        waves.forEach(wave => {
            if (active) {
                wave.classList.add('active');
            } else {
                wave.classList.remove('active');
            }
        });
    }

    updateUI() {
        // Update buttons
        const buttons = document.querySelectorAll('.voice-btn');
        buttons.forEach(btn => {
            if (this.isRecording) {
                btn.classList.add('recording');
            } else {
                btn.classList.remove('recording');
            }
        });

        // Update status
        const statusDot = document.getElementById('voiceStatusDot');
        const statusText = document.getElementById('voiceStatusText');
        
        if (statusDot) {
            statusDot.className = this.isRecording ? 'status-dot active' : 'status-dot';
        }
        if (statusText) {
            statusText.textContent = this.isRecording ? 'Listening' : 'Stopped';
        }

        // Update wave animation
        this.updateWaveAnimation(this.isRecording);
    }

    updateTranscription(text, isInterim) {
        const element = document.getElementById('voiceTranscription');
        if (element) {
            element.textContent = text || 'Listening...';
            element.className = isInterim ? 'text listening' : 'text';
        }
    }

    showResponse(title, text) {
        const container = document.getElementById('voiceResponseContainer');
        if (container) {
            container.innerHTML = `
                <div class="voice-response">
                    <div class="response-header">
                        <div class="response-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="response-title">${title}</div>
                    </div>
                    <div class="response-text">${text}</div>
                </div>
            `;
        }
    }

    showError(error) {
        let message = 'An error occurred';
        
        switch(error) {
            case 'not-allowed':
                message = 'Microphone access denied. Please allow microphone access.';
                break;
            case 'no-speech':
                message = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                message = 'No microphone found. Please check your microphone.';
                break;
            case 'network':
                message = 'Network error. Please check your connection.';
                break;
        }

        const statusText = document.getElementById('voiceStatusText');
        if (statusText) {
            statusText.textContent = message;
        }

        const statusDot = document.getElementById('voiceStatusDot');
        if (statusDot) {
            statusDot.className = 'status-dot error';
        }
    }

    showNotSupported() {
        alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
    }

    showHelp() {
        this.speak('You can say: Create task, Show tasks, Show analytics, Show calendar, or Go to dashboard');
        this.showResponse('Voice Commands', 'Try: "Create a task to finish the report", "Show my tasks", "Open analytics"');
    }

    clearAndRestart() {
        this.transcript = '';
        this.updateTranscription('', false);
        document.getElementById('voiceResponseContainer').innerHTML = '';
        
        if (!this.isRecording) {
            this.startRecording();
        }
    }

    navigateTo(url) {
        setTimeout(() => {
            window.location.href = url;
        }, 1500);
    }

    getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.voiceAssistant = new VoiceAssistant();
    
    // Load voices
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
});
