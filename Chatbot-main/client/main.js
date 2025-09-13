import { Chatbot } from './components/Chatbot.js';

// Initialize the chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const chatbot = new Chatbot();
    chatbot.init();
});