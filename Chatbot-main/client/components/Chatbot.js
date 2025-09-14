import { UserInfoForm } from './UserInfoForm.js';
import { ChatHistoryManager } from './ChatHistory.js';
import { FileUpload } from './FileUpload.js';
import { VoiceRecognition } from './VoiceRecognition.js';
import { CountrySelector } from './CountrySelector.js';
import { QuestionLimiter } from './QuestionLimiter.js';
import { generateBotResponse } from '../utils/api.js';
import { saveChatHistory, loadChatHistory } from '../utils/historyManager.js';
import { formatMessageTime } from '../utils/formatters.js';
import { createPdfUploadElement, renderPdfMessageFromHistory } from '../utils/fileProcessor.js';

export default class Chatbot {
    constructor() {
        this.chatBody = document.querySelector(".chat-body");
        this.messageInput = document.querySelector(".message-input");
        this.sendMessageButton = document.querySelector("#send-message");
        this.chatbotToggler = document.querySelector("#chatbot-toggler");
        this.closeChatbot = document.querySelector("#close-chatbot");
        this.menuToggler = document.querySelector("#menu-toggler");
        this.dropdownMenu = document.querySelector(".dropdown-menu");
        this.emojiPickerButton = document.querySelector("#emoji-picker");
        
        this.userInfo = null;
        this.currentChatId = null;
        this.chatHistory = [];
        this.userData = {
            message: null,
            file: {
                data: null,
                mime_type: null,
                uri: null,
                rawFile: null
            }
        };
        
        this.initialInputHeight = this.messageInput.scrollHeight;
        
        // Initialize components
        this.userInfoForm = new UserInfoForm();
        this.fileUpload = new FileUpload(
            this.userData, 
            this.chatBody, 
            this.getCurrentChat.bind(this), 
            this.saveChatHistory.bind(this), 
            this.renderChatHistory.bind(this)
        );
        this.voiceRecognition = new VoiceRecognition();
        this.countrySelector = new CountrySelector();
        this.questionLimiter = new QuestionLimiter();
        this.chatHistoryManager = new ChatHistoryManager(
            this.userInfo,
            this.chatHistory,
            this.currentChatId,
            this.loadChat.bind(this)
        );
    }

    init() {
        this.setupEventListeners();
        this.injectHistoryStyles();
        this.voiceRecognition.setup();
        this.countrySelector.init();
        this.userInfoForm.setupEventListeners();
        this.fileUpload.setupEventListeners();
        this.chatHistoryManager.setupEventListeners();
        
        // Load emoji picker
        this.setupEmojiPicker();
    }

    setupEventListeners() {
        this.chatbotToggler.addEventListener("click", () => this.toggleChatbot());
        this.closeChatbot.addEventListener("click", () => this.closeChatbotWindow());
        
        this.messageInput.addEventListener("keydown", (e) => this.handleKeydown(e));
        this.messageInput.addEventListener("input", () => this.adjustInputHeight());
        
        this.sendMessageButton.addEventListener("click", (e) => this.handleOutgoingMessage(e));
        document.querySelector(".chat-form").addEventListener("submit", (e) => this.handleOutgoingMessage(e));
        
        this.menuToggler.addEventListener("click", (e) => this.toggleMenu(e));
        document.addEventListener("click", (e) => this.handleDocumentClick(e));
        
        document.querySelector("#clear-chat").addEventListener("click", () => this.clearChat());
        document.querySelector("#new-chat").addEventListener("click", () => this.startNewChat());
    }

    toggleChatbot() {
        const isAnythingOpen = document.body.classList.contains("show-user-form") || document.body.classList.contains("show-chatbot");
        document.body.classList.toggle("show-user-form", !isAnythingOpen && !this.userInfo);
        document.body.classList.toggle("show-chatbot", !isAnythingOpen && this.userInfo);
    }

    closeChatbotWindow() {
        document.body.classList.remove("show-chatbot");
    }

    handleKeydown(e) {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 768) {
            this.handleOutgoingMessage(e);
        }
    }

    adjustInputHeight() {
        this.messageInput.style.height = `${this.initialInputHeight}px`;
        this.messageInput.style.height = `${this.messageInput.scrollHeight}px`;
        document.querySelector(".chat-form").style.borderRadius = this.messageInput.scrollHeight > this.initialInputHeight ? "15px" : "32px";
    }

    async handleOutgoingMessage(e) {
        e.preventDefault();
        this.userData.message = this.messageInput.value.trim();

        if (!this.userData.message && !this.userData.file.data && !this.fileUpload.pendingPdfFile) return;

        // Check daily question limit
        if (!this.questionLimiter.checkQuestionLimit()) {
            this.questionLimiter.showLimitExceededMessage();
            return;
        }
        
        this.questionLimiter.incrementQuestionCount();

        // Ensure we have a current chat
        let currentChat = this.getCurrentChat();
        if (!currentChat) {
            this.startNewChat();
            currentChat = this.getCurrentChat();
        }

        if (this.fileUpload.pendingPdfFile) {
            await this.fileUpload.handlePdfUpload(this.userData.message);
            this.messageInput.value = "";
            this.messageInput.dispatchEvent(new Event("input"));
        } else {
            currentChat.messages.push({
                sender: "user",
                type: this.userData.file.data ? "image" : "text",
                content: this.userData.message,
                fileData: this.userData.file.data,
                mimeType: this.userData.file.mime_type,
                timestamp: Date.now()
            });

            const messageHTML = `
                ${this.userData.message ? `<div class="message-text">${this.userData.message}</div>` : ''}
                ${this.userData.file.data ? `<img src="data:${this.userData.file.mime_type};base64,${this.userData.file.data}" class="attachment" />` : ""}
                <div class="user-message-time">${formatMessageTime(Date.now())}</div>`;

            const outgoingMessageDiv = this.createMessageElement(messageHTML, "user-message");
            this.chatBody.appendChild(outgoingMessageDiv);

            this.handleBotResponse();

            this.messageInput.value = "";
            this.fileUpload.fileUploadWrapper.classList.remove("file-uploaded");
            this.messageInput.dispatchEvent(new Event("input"));
        }

        currentChat.lastActive = Date.now();
        this.saveChatHistory();
        this.renderChatHistory();

        this.chatBody.scrollTo({
            top: this.chatBody.scrollHeight,
            behavior: "smooth"
        });
    }

    handleBotResponse() {
        setTimeout(() => {
            const thinkingMessageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
            
             <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path>

            </svg><div class="message-text"><div class="thinking-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
            const incomingMessageDiv = this.createMessageElement(thinkingMessageContent, "bot-message", "thinking");
            this.chatBody.appendChild(incomingMessageDiv);
            this.chatBody.scrollTo({
                top: this.chatBody.scrollHeight,
                behavior: "smooth"
            });
            
            generateBotResponse(
                this.userData, 
                incomingMessageDiv, 
                this.getCurrentChat(), 
                this.saveChatHistory.bind(this), 
                this.renderChatHistory.bind(this)
            );
        }, 600);
    }

    toggleMenu(e) {
        e.stopPropagation();
        this.dropdownMenu.classList.toggle("show");
    }

    handleDocumentClick(e) {
        if (!e.target.closest(".header-actions")) this.dropdownMenu.classList.remove("show");
        if (!e.target.closest("em-emoji-picker") && e.target.id !== "emoji-picker") {
            document.body.classList.remove("show-emoji-picker");
        }
    }

    clearChat() {
        this.dropdownMenu.classList.remove("show");
        const chatToClearId = this.currentChatId;
        const currentChat = this.getCurrentChat();
        if (currentChat) {
            currentChat.messages = currentChat.messages.filter(msg => msg.sender === "bot" && msg.content.includes("Hey there "));
        }
        this.clearChatMessages();
        this.createWelcomeMessage();
        this.saveChatHistory();
        this.renderChatHistory();
    }

    startNewChat() {
        // Only create new chat if current chat has user messages or doesn't exist
        const currentChat = this.getCurrentChat();
        const shouldCreateNew = !currentChat || currentChat.messages.some(msg => msg.sender === "user");

        if (shouldCreateNew) {
            this.currentChatId = Date.now().toString();
            this.chatHistory.unshift({
                id: this.currentChatId,
                messages: [],
                lastActive: Date.now()
            });
        }
        
        this.clearChatMessages();
        this.createWelcomeMessage();
    }

    clearChatMessages() {
        this.chatBody.innerHTML = "";
        this.userData.message = null;
        this.userData.file = {
            data: null,
            mime_type: null,
            uri: null,
            rawFile: null
        };
        this.fileUpload.pendingPdfFile = null;
        this.fileUpload.pdfPreviewContainer.style.display = 'none';
        this.fileUpload.pdfPreviewContainer.innerHTML = '';
        this.fileUpload.fileUploadWrapper.classList.remove("file-uploaded");
        this.messageInput.value = "";
        this.messageInput.style.height = `${this.initialInputHeight}px`;
        document.querySelector(".chat-form").style.borderRadius = "32px";
    }

    createWelcomeMessage() {
        const welcomeMessageContent = "Hey there 👋 <br> How can I help you today?";
        const welcomeMessageHTML = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
        <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path>
        </svg><div class="message-text">${welcomeMessageContent}</div>`;
        const welcomeDiv = this.createMessageElement(welcomeMessageHTML, "bot-message");
        this.chatBody.appendChild(welcomeDiv);
        const currentChat = this.getCurrentChat();
        if (currentChat && currentChat.messages.length === 0) {
            currentChat.messages.push({
                sender: "bot",
                type: "text",
                content: welcomeMessageContent,
                formattedContent: welcomeMessageContent
            });
            currentChat.lastActive = Date.now();
            this.saveChatHistory();
            this.renderChatHistory();
        }
    }

    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (!chat) {
            this.startNewChat();
            return;
        }
        this.currentChatId = chatId;
        this.chatBody.innerHTML = "";
        chat.messages.forEach(msg => {
            let messageDiv;
            if (msg.sender === "bot") {
                let messageContent = msg.formattedContent || msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                const content = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024"><path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path>
            </svg><div class="message-text">${messageContent}</div>`;
                messageDiv = this.createMessageElement(content, "bot-message");
            } else {
                if (msg.type === 'pdf') {
                    const content = renderPdfMessageFromHistory(msg, formatMessageTime);
                    messageDiv = this.createMessageElement(content, "user-message");
                } else {
                    const content = `
                        ${msg.content ? `<div class="message-text">${msg.content}</div>` : ''}
                        ${msg.type === "image" && msg.fileData ? `<img src="data:${msg.mimeType};base64,${msg.fileData}" class="attachment" />` : ""}
                        <div class="user-message-time">${formatMessageTime(msg.timestamp)}</div>`;
                    messageDiv = this.createMessageElement(content, "user-message");
                }
            }
            this.chatBody.appendChild(messageDiv);
        });
        this.chatBody.scrollTo({
            top: this.chatBody.scrollHeight,
            behavior: "smooth"
        });
    }

    getCurrentChat() {
        return this.chatHistory.find(chat => chat.id === this.currentChatId);
    }

    saveChatHistory() {
        saveChatHistory(this.chatHistory, this.userInfo);
    }

    renderChatHistory() {
        this.chatHistoryManager.renderChatHistory();
    }

    createMessageElement(content, ...classes) {
        const div = document.createElement("div");
        div.classList.add("message", ...classes);
        div.innerHTML = content;
        return div;
    }

    injectHistoryStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .chat-history-item-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            .chat-time { font-size: 0.75rem; color: #6c757d; flex-shrink: 0; margin-left: 10px; }
            .user-message-time { font-size: 0.7rem; color: #888; text-align: right; margin-top: 5px; padding-right: 10px; }
        `;
        document.head.appendChild(style);
    }

    setupEmojiPicker() {
        const picker = new EmojiMart.Picker({
            theme: "light",
            skinTonePosition: "none",
            previewPosition: "none",
            onEmojiSelect: (emoji) => {
                const {
                    selectionStart: start,
                    selectionEnd: end
                } = this.messageInput;
                this.messageInput.setRangeText(emoji.native, start, end, "end");
                this.messageInput.focus();
                this.messageInput.dispatchEvent(new Event("input"));
            },
            onClickOutside: (e) => {
                if (e.target.id !== "emoji-picker") {
                    document.body.classList.remove("show-emoji-picker");
                }
            }
        });

        document.querySelector(".chat-form").appendChild(picker);
        this.emojiPickerButton.addEventListener("click", (e) => {
            e.stopPropagation();
            document.body.classList.toggle("show-emoji-picker");
        });
    }
}