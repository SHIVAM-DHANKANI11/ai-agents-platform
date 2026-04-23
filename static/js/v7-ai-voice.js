/* V7 AI Voice Assistant JS */

class AIVoiceAssistant {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.synth = window.speechSynthesis;
        this.initRecognition();
    }

    initRecognition() {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!window.SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateUI(true);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateUI(false);
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log("Voice Transcript:", transcript);
            this.processCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            this.isListening = false;
            this.updateUI(false);
        };
    }

    toggle() {
        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (e) {
                console.error("RE-start error", e);
            }
        }
    }

    updateUI(isListening) {
        const btn = document.getElementById('voiceAssistantBtn');
        const wave = document.getElementById('voiceWaveform');
        if (btn) {
            btn.classList.toggle('listening', isListening);
            btn.innerHTML = isListening ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
        }
        if (wave) {
            wave.classList.toggle('active', isListening);
        }
        
        if (isListening) {
            this.showNotification("AI is listening...", "info");
        }
    }

    processCommand(text) {
        if (text.includes('add task') || text.includes('new task')) {
            const taskTitle = text.replace(/add task|new task|create task/g, '').trim();
            if (taskTitle) {
                this.speak(`Adding task: ${taskTitle}`);
                this.autoCreateTask(taskTitle);
            } else {
                this.speak("What is the task title?");
                openTaskModal();
            }
        } 
        else if (text.includes('show analytics') || text.includes('open analytics')) {
            this.speak("Opening flow state analytics");
            document.querySelector('.deeply-analytics-widget').scrollIntoView({ behavior: 'smooth' });
        }
        else if (text.includes('show mind map') || text.includes('open mind map')) {
            this.speak("Opening task mind map");
            document.querySelector('.mindmap-widget').scrollIntoView({ behavior: 'smooth' });
        }
        else if (text.includes('play music') || text.includes('start music') || text.includes('turn on music')) {
            this.speak("Starting focus music from your library.");
            if (window.togglePlay) {
                window.togglePlay();
            } else {
                this.speak("Music player not ready yet.");
            }
        }
        else if (text.includes('stop music') || text.includes('pause music')) {
            this.speak("Pausing music.");
            if (window.togglePlay) {
                window.togglePlay();
            }
        }
        else if (text.includes('next song') || text.includes('change music')) {
            this.speak("Playing next track.");
            if (window.nextSoundscape) {
                window.nextSoundscape();
            }
        }
        else if (text.includes('hi') || text.includes('hello')) {
            this.speak("Hello! How can I help you today?");
        }
        else {
            this.speak("I heard " + text + ". Try commands like 'play music', 'add task', or 'open mind map'.");
        }
    }

    async autoCreateTask(title) {
        const priority = 'medium';
        const due_date = new Date().toISOString().split('T')[0];
        
        try {
            const response = await fetch('/api/tasks/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({
                    title: title,
                    description: "Created via AI Voice Assistant",
                    priority: priority,
                    due_date: due_date
                })
            });
            
            const data = await response.json();
            if (data.success) {
                this.showNotification(`Task Created: ${title}`, 'success');
                if (window.renderSmartTasks) window.renderSmartTasks();
            }
        } catch (error) {
            console.error("Failed to auto-create task:", error);
        }
    }

    speak(text) {
        if (!this.synth) return;
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = 1;
        utter.rate = 1;
        this.synth.speak(utter);
    }

    showNotification(message, type) {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
}

// Global initialization
let aiVoice;
document.addEventListener('DOMContentLoaded', () => {
    aiVoice = new AIVoiceAssistant();
});

function toggleVoiceAssistant() {
    if (aiVoice) aiVoice.toggle();
}
