// import  {Chatbot}  from './components/Chatbot';
import { Chatbot } from './Chatbot.js';

// Initialize the chatbot when DOM is loaded
alert("beware");
document.addEventListener('DOMContentLoaded', function() {
    const chatbot = new Chatbot();
    chatbot.init();
});