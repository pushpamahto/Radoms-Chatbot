import { renderChatHistory, saveChatHistory, loadChatHistory } from '../utils/historyManager.js';
import { formatMessageTime } from '../utils/formatters.js';

export class ChatHistoryManager {
    constructor(userInfo, chatHistory, currentChatId, loadChat) {
        this.userInfo = userInfo;
        this.chatHistory = chatHistory;
        this.currentChatId = currentChatId;
        this.loadChat = loadChat;
        
        this.chatHistoryButton = document.querySelector("#chat-history");
        this.chatHistorySidebar = document.querySelector(".chat-history-sidebar");
        this.closeHistoryButton = document.querySelector("#close-history");
        this.historyList = document.querySelector(".history-list");
        this.deleteAllHistoryButton = document.querySelector("#delete-all-history");
    }

    setupEventListeners() {
        this.chatHistoryButton.addEventListener("click", () => this.toggleHistorySidebar());
        this.closeHistoryButton.addEventListener("click", () => this.closeHistorySidebar());
        this.deleteAllHistoryButton.addEventListener("click", () => this.deleteAllHistory());
    }

    toggleHistorySidebar() {
        document.querySelector(".dropdown-menu").classList.remove("show");
        document.body.classList.toggle("show-chat-history");
        this.renderChatHistory();
    }

    closeHistorySidebar() {
        document.body.classList.remove("show-chat-history");
    }

    renderChatHistory() {
        renderChatHistory(this.historyList, this.chatHistory, this.loadChat, this.deleteChat.bind(this));
    }

    deleteChat(idToDelete) {
        const chatIndex = this.chatHistory.findIndex(chat => chat.id === idToDelete);
        if (chatIndex !== -1) {
            this.chatHistory.splice(chatIndex, 1);
            saveChatHistory(this.chatHistory, this.userInfo);
            this.renderChatHistory();
            
            if (this.currentChatId === idToDelete) {
                this.startNewChat();
            }
        }
    }

    deleteAllHistory() {
        let alertDiv = document.querySelector(".delete-confirmation-alert");
        if (!alertDiv) {
            alertDiv = document.createElement("div");
            alertDiv.className = "delete-confirmation-alert";
            alertDiv.innerHTML = `<p>Are you sure you want to delete all your chat history?</p><div class="delete-confirmation-buttons"><button class="confirm-delete">Delete</button><button class="cancel-delete">Cancel</button></div>`;
            this.deleteAllHistoryButton.parentNode.insertBefore(alertDiv, this.deleteAllHistoryButton);
            
            alertDiv.querySelector(".confirm-delete").addEventListener("click", () => {
                if (!this.userInfo || !this.userInfo.email) return;
                this.chatHistory = [];
                localStorage.removeItem(`chatHistory_${this.userInfo.email}`);
                this.renderChatHistory();
                this.startNewChat();
                alertDiv.classList.remove("show");
            });
            
            alertDiv.querySelector(".cancel-delete").addEventListener("click", () => {
                alertDiv.classList.remove("show");
            });
        }
        alertDiv.classList.add("show");
    }

    startNewChat() {
        // Implementation would be in the main Chatbot component
    }
}