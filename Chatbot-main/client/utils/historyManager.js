import { formatChatTimestamp } from './formatters.js';

export const saveChatHistory = (chatHistory, userInfo) => {
    if (!userInfo || !userInfo.email) return;
    
    const chatsToSave = chatHistory.filter(chat => {
        return chat.messages.some(msg => msg.sender === "user");
    });
    
    const userHistoryKey = `chatHistory_${userInfo.email}`;
    localStorage.setItem(userHistoryKey, JSON.stringify(chatsToSave));
};

export const loadChatHistory = (userInfo) => {
    if (!userInfo || !userInfo.email) return [];
    
    const userHistoryKey = `chatHistory_${userInfo.email}`;
    const savedHistory = localStorage.getItem(userHistoryKey);
    let allUserHistory = savedHistory ? JSON.parse(savedHistory) : [];
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoTimestamp = oneWeekAgo.getTime();
    
    const filteredHistory = allUserHistory.filter(chat => chat.lastActive && chat.lastActive >= oneWeekAgoTimestamp);
    
    if (filteredHistory.length < allUserHistory.length) {
        saveChatHistory(filteredHistory, userInfo);
    }
    
    return filteredHistory;
};

export const renderChatHistory = (historyList, chatHistory, loadChat, deleteChat) => {
    historyList.innerHTML = "";
    const sortedHistory = [...chatHistory].sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
    
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
                loadChat(chat.id);
                document.body.classList.remove("show-chat-history");
            }
        });
        
        const deleteButton = chatItem.querySelector(".delete-chat-item");
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        
        historyList.appendChild(chatItem);
    });
};