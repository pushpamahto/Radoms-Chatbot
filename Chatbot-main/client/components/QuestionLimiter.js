import { MAX_QUESTIONS_PER_DAY } from '../config/constants.js';

export class QuestionLimiter {
    constructor() {
        this.userQuestionCount = 0;
        this.lastQuestionDate = null;
    }

    checkQuestionLimit() {
        const today = new Date(Date.now()).toDateString();

        // If it's a new day, reset the counter
        if (this.lastQuestionDate !== today) {
            this.userQuestionCount = 0;
            this.lastQuestionDate = today;
        }
        
        // Check if user has exceeded the daily limit
        return this.userQuestionCount < MAX_QUESTIONS_PER_DAY;
    }

    incrementQuestionCount() {
        this.userQuestionCount++;
        
        // Show warning when only 1 question remains
        if (this.userQuestionCount === MAX_QUESTIONS_PER_DAY - 1) {
            this.showQuestionWarning();
        }
    }

    showLimitExceededMessage() {
        const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024"><path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path>
            </svg>
    <div class="message-text" id="limit-exceed">
        You've reached your daily limit of ${MAX_QUESTIONS_PER_DAY} questions. 
        Please come back tomorrow to ask more questions.
    </div>`;
        
        const limitMessageDiv = this.createMessageElement(messageContent, "bot-message");
        document.querySelector(".chat-body").appendChild(limitMessageDiv);
        
        document.querySelector(".chat-body").scrollTo({
            top: document.querySelector(".chat-body").scrollHeight,
            behavior: "smooth"
        });
    }

    showQuestionWarning() {
        // Remove any existing warning
        const existingWarning = document.querySelector('.question-warning-popup');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        const warningPopup = document.createElement('div');
        warningPopup.className = 'question-warning-popup';
        warningPopup.innerHTML = `
            <span class="material-symbols-rounded warning-icon">warning</span>
            <div class="warning-content">
                <div class="warning-title">Only 1 Question Left!</div>
                <div class="warning-message">You can ask only 1 more question today.</div>
            </div>
        `;
        
        document.body.appendChild(warningPopup);
        
        // Remove the warning after 3 seconds
        setTimeout(() => {
            if (warningPopup.parentNode) {
                warningPopup.parentNode.removeChild(warningPopup);
            }
        }, 3000);
    }

    createMessageElement(content, ...classes) {
        const div = document.createElement("div");
        div.classList.add("message", ...classes);
        div.innerHTML = content;
        return div;
    }
}