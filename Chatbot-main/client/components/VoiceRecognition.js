export class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.voiceAssistButton = document.querySelector("#voice-assist");
        this.messageInput = document.querySelector(".message-input");
    }

    setup() {
        if (!('webkitSpeechRecognition' in window)) {
            this.voiceAssistButton.style.display = "none";
            return;
        }
        
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.voiceAssistButton.classList.add("listening");
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '',
                finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalTranscript += transcript;
                else interimTranscript += transcript;
            }
            this.messageInput.value = finalTranscript || interimTranscript;
            this.messageInput.dispatchEvent(new Event("input"));
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.voiceAssistButton.classList.remove("listening");
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.voiceAssistButton.classList.remove("listening");
        };
        
        this.voiceAssistButton.addEventListener("click", () => this.toggleListening());
    }

    toggleListening() {
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.messageInput.value = "";
            this.messageInput.focus();
            try {
                this.recognition.start();
            } catch (error) {
                console.error("Error starting speech recognition:", error);
                alert("Could not start voice assistant. Check permissions.");
            }
        }
    }
}