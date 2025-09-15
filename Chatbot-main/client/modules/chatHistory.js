import {
    historyList,
    deleteAllHistoryButton
} from './domElements.js';
import {
    formatChatTimestamp
} from './utils.js';

export const saveChatHistory = (state) => {
    if (!state.userInfo || !state.userInfo.email) return;
    const chatsToSave = state.chatHistory.filter(chat => {
        return chat.messages.some(msg => msg.sender === "user");
    });
    const userHistoryKey = `chatHistory_${state.userInfo.email}`;
    localStorage.setItem(userHistoryKey, JSON.stringify(chatsToSave));
};

export const loadChatHistory = (state) => {
    if (!state.userInfo || !state.userInfo.email) {
        state.chatHistory = [];
        return;
    }
    const userHistoryKey = `chatHistory_${state.userInfo.email}`;
    const savedHistory = localStorage.getItem(userHistoryKey);
    let allUserHistory = savedHistory ? JSON.parse(savedHistory) : [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoTimestamp = oneWeekAgo.getTime();
    state.chatHistory = allUserHistory.filter(chat => chat.lastActive && chat.lastActive >= oneWeekAgoTimestamp);
    if (state.chatHistory.length < allUserHistory.length) {
        saveChatHistory(state);
    }
};

export const renderChatHistory = (state, callbacks) => {
    historyList.innerHTML = "";
    const sortedHistory = [...state.chatHistory].sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
    sortedHistory.forEach(chat => {
        const chatItem = document.createElement("li");
        chatItem.setAttribute("data-chat-id", chat.id);
        const firstUserMessage = chat.messages.find(msg => msg.sender === "user" && (msg.type === "text" || msg.type === "pdf"));
        let chatTitleText = "New Chat";
        if (firstUserMessage) {
            if (firstUserMessage.type === 'pdf') {
                chatTitleText = firstUserMessage.fileName || "PDF Document";
            } else {
                chatTitleText = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "");
            }
        } else if (chat.messages.length > 0 && chat.messages[0].content) {
            chatTitleText = chat.messages[0].content.substring(0, 30) + (chat.messages[0].content.length > 30 ? "..." : "");
        }
        const chatTime = formatChatTimestamp(chat.lastActive);
        chatItem.innerHTML = `<div class="chat-history-item-content"><span class="chat-title">${chatTitleText}</span><span class="chat-time">${chatTime}</span></div><button class="material-symbols-rounded delete-chat-item">delete</button>`;
        chatItem.addEventListener("click", (e) => {
            if (!e.target.closest(".delete-chat-item")) {
                callbacks.loadChat(chat.id);
                document.body.classList.remove("show-chat-history");
            }
        });
        const deleteButton = chatItem.querySelector(".delete-chat-item");
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteChat(chat.id, state, callbacks);
        });
        historyList.appendChild(chatItem);
    });
};

const deleteChat = (idToDelete, state, callbacks) => {
    const chatIndex = state.chatHistory.findIndex(chat => chat.id === idToDelete);
    if (chatIndex !== -1) {
        state.chatHistory.splice(chatIndex, 1);
        saveChatHistory(state);
        renderChatHistory(state, callbacks);
        if (state.currentChatId === idToDelete) {
            callbacks.startNewChat();
        }
    }
};

export const deleteAllHistory = (state, callbacks) => {
    let alertDiv = document.querySelector(".delete-confirmation-alert");
    if (!alertDiv) {
        alertDiv = document.createElement("div");
        alertDiv.className = "delete-confirmation-alert";
        alertDiv.innerHTML = `<p>Are you sure you want to delete all your chat history?</p><div class="delete-confirmation-buttons"><button class="confirm-delete">Delete</button><button class="cancel-delete">Cancel</button></div>`;
        deleteAllHistoryButton.parentNode.insertBefore(alertDiv, deleteAllHistoryButton);
        alertDiv.querySelector(".confirm-delete").addEventListener("click", () => {
            if (!state.userInfo || !state.userInfo.email) return;
            state.chatHistory = [];
            localStorage.removeItem(`chatHistory_${state.userInfo.email}`);
            renderChatHistory(state, callbacks);
            callbacks.startNewChat();
            alertDiv.classList.remove("show");
        });
        alertDiv.querySelector(".cancel-delete").addEventListener("click", () => {
            alertDiv.classList.remove("show");
        });
    }
    alertDiv.classList.add("show");
};