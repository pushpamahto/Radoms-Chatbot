import {
    generateBotResponse,
    startPdfUploadProcess
} from './api.js';
import {
    chatBody,
    messageInput,
    pdfPreviewContainer,
    fileUploadWrapper,
    voiceAssistButton // Added this import
} from './domElements.js';
import {
    createMessageElement,
    createPdfUploadElement,
    renderPdfMessageFromHistory,
    showLimitExceededMessage,
    showQuestionWarning,
    initialInputHeight
} from './uiManager.js';
import {
    saveChatHistory,
    renderChatHistory
} from './chatHistory.js';
import {
    formatMessageTime
} from './utils.js';
import {
    MAX_QUESTIONS_PER_DAY
} from './config.js';

// Application state
export const state = {
    currentChatId: null,
    chatHistory: [],
    userInfo: null,
    pendingPdfFile: null,
    userData: {
        message: null,
        file: {
            data: null,
            mime_type: null,
            uri: null,
            rawFile: null
        }
    },
    recognition: null,
    isListening: false,
    activePdfUploads: {},
    userQuestionCount: 0,
    lastQuestionDate: null
};

const checkQuestionLimit = () => {
    const today = new Date(Date.now()).toDateString();
    if (state.lastQuestionDate !== today) {
        state.userQuestionCount = 0;
        state.lastQuestionDate = today;
    }
    return state.userQuestionCount < MAX_QUESTIONS_PER_DAY;
};

const clearChatMessages = () => {
    chatBody.innerHTML = "";
    state.userData.message = null;
    state.userData.file = {
        data: null,
        mime_type: null,
        uri: null,
        rawFile: null
    };
    state.pendingPdfFile = null;
    pdfPreviewContainer.style.display = 'none';
    pdfPreviewContainer.innerHTML = '';
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.value = "";
    messageInput.style.height = `${initialInputHeight}px`;
    document.querySelector(".chat-form").style.borderRadius = "32px";
};

const createWelcomeMessage = () => {
    const welcomeMessageContent = "Hey there 👋 <br> How can I help you today?";
    const welcomeMessageHTML = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024"><path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path></svg><div class="message-text">${welcomeMessageContent}</div>`;
    const welcomeDiv = createMessageElement(welcomeMessageHTML, "bot-message");
    chatBody.appendChild(welcomeDiv);
    const currentChat = state.chatHistory.find(chat => chat.id === state.currentChatId);
    if (currentChat && currentChat.messages.length === 0) {
        currentChat.messages.push({
            sender: "bot",
            type: "text",
            content: welcomeMessageContent,
            formattedContent: welcomeMessageContent
        });
        currentChat.lastActive = Date.now();
        saveChatHistory(state);
        renderChatHistory(state, callbacks);
    }
};

export const startNewChat = () => {
    const currentChat = state.chatHistory.find(chat => chat.id === state.currentChatId);
    const shouldCreateNew = !currentChat || currentChat.messages.some(msg => msg.sender === "user");

    if (shouldCreateNew) {
        state.currentChatId = Date.now().toString();
        state.chatHistory.unshift({
            id: state.currentChatId,
            messages: [],
            lastActive: Date.now()
        });
    }

    clearChatMessages();
    createWelcomeMessage();
};

export const loadChat = (chatId) => {
    const chat = state.chatHistory.find(c => c.id === chatId);
    if (!chat) {
        startNewChat();
        return;
    }
    state.currentChatId = chatId;
    chatBody.innerHTML = "";
    chat.messages.forEach(msg => {
        let messageDiv;
        if (msg.sender === "bot") {
            let messageContent = msg.formattedContent || msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            const content = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024"><path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path></svg><div class="message-text">${messageContent}</div>`;
            messageDiv = createMessageElement(content, "bot-message");
        } else {
            if (msg.type === 'pdf') {
                messageDiv = renderPdfMessageFromHistory(msg);
            } else {
                const content = `
                        ${msg.content ? `<div class="message-text">${msg.content}</div>` : ''}
                        ${msg.type === "image" && msg.fileData ? `<img src="data:${msg.mimeType};base64,${msg.fileData}" class="attachment" />` : ""}
                        <div class="user-message-time">${formatMessageTime(msg.timestamp)}</div>`;
                messageDiv = createMessageElement(content, "user-message");
            }
        }
        chatBody.appendChild(messageDiv);
    });
    chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
    });
};

export const handleBotResponse = () => {
    setTimeout(() => {
        const thinkingMessageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024"><path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path></svg><div class="message-text"><div class="thinking-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
        const incomingMessageDiv = createMessageElement(thinkingMessageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({
            top: chatBody.scrollHeight,
            behavior: "smooth"
        });
        const botResponseCallbacks = {
            onComplete: (botResponseText, formattedResponse) => {
                const currentChat = state.chatHistory.find(chat => chat.id === state.currentChatId);
                if (currentChat) {
                    currentChat.messages.push({
                        sender: "bot",
                        type: "text",
                        content: botResponseText,
                        formattedContent: formattedResponse
                    });
                    currentChat.lastActive = Date.now();
                    saveChatHistory(state);
                    renderChatHistory(state, callbacks);
                }
                state.userData.file = {
                    data: null,
                    mime_type: null,
                    uri: null,
                    rawFile: null
                };
            }
        };
        generateBotResponse(incomingMessageDiv, state, botResponseCallbacks);
    }, 600);
};

export const handleOutgoingMessage = (e) => {
    e.preventDefault();
    state.userData.message = messageInput.value.trim();

    if (!state.userData.message && !state.userData.file.data && !state.pendingPdfFile) return;

    if (!checkQuestionLimit()) {
        showLimitExceededMessage();
        return;
    }
    state.userQuestionCount++;
    if (state.userQuestionCount === MAX_QUESTIONS_PER_DAY - 1) {
        showQuestionWarning();
    }

    let currentChat = state.chatHistory.find(chat => chat.id === state.currentChatId);
    if (!currentChat) {
        startNewChat();
        currentChat = state.chatHistory.find(chat => chat.id === state.currentChatId);
    }

    if (state.pendingPdfFile) {
        const messageId = `msg_${Date.now()}`;
        const messageData = {
            id: messageId,
            sender: "user",
            type: "pdf",
            content: state.userData.message,
            fileName: state.pendingPdfFile.name,
            fileSize: state.pendingPdfFile.size,
            fileUri: null,
            timestamp: Date.now()
        };
        currentChat.messages.push(messageData);

        const pdfUploadHTML = createPdfUploadElement(messageId, state.pendingPdfFile.name, state.pendingPdfFile.size);
        const messageHTML = `
            ${state.userData.message ? `<div class="message-text">${state.userData.message}</div>` : ''}
            ${pdfUploadHTML}
            <div class="user-message-time">${formatMessageTime(Date.now())}</div>`;

        const outgoingMessageDiv = createMessageElement(messageHTML, "user-message");
        chatBody.appendChild(outgoingMessageDiv);

        const pdfUploadCallbacks = {
            onSuccess: (fileUri, userQuery, file) => {
                const msgToUpdate = currentChat?.messages.find(msg => msg.id === messageId);
                if (msgToUpdate) {
                    msgToUpdate.fileUri = fileUri;
                    saveChatHistory(state);
                }
                state.userData.message = userQuery || `The user uploaded a file named "${file.name}". Please provide a brief summary of this document.`;
                state.userData.file = {
                    uri: fileUri,
                    mime_type: file.type,
                    data: null,
                    rawFile: null
                };
                setTimeout(() => {
                    chatBody.scrollTo({
                        top: chatBody.scrollHeight,
                        behavior: "smooth"
                    });
                }, 100);
                handleBotResponse();
            }
        };
        startPdfUploadProcess(state.pendingPdfFile, messageId, state.userData.message, state, pdfUploadCallbacks);
        state.pendingPdfFile = null;
        pdfPreviewContainer.style.display = 'none';
        pdfPreviewContainer.innerHTML = '';
        messageInput.value = "";
        messageInput.dispatchEvent(new Event("input"));
    } else {
        currentChat.messages.push({
            sender: "user",
            type: state.userData.file.data ? "image" : "text",
            content: state.userData.message,
            fileData: state.userData.file.data,
            mimeType: state.userData.file.mime_type,
            timestamp: Date.now()
        });
        const messageHTML = `
            ${state.userData.message ? `<div class="message-text">${state.userData.message}</div>` : ''}
            ${state.userData.file.data ? `<img src="data:${state.userData.file.mime_type};base64,${state.userData.file.data}" class="attachment" />` : ""}
            <div class="user-message-time">${formatMessageTime(Date.now())}</div>`;
        const outgoingMessageDiv = createMessageElement(messageHTML, "user-message");
        chatBody.appendChild(outgoingMessageDiv);
        handleBotResponse();
        messageInput.value = "";
        fileUploadWrapper.classList.remove("file-uploaded");
        messageInput.dispatchEvent(new Event("input"));
    }

    currentChat.lastActive = Date.now();
    saveChatHistory(state);
    renderChatHistory(state, {
        loadChat,
        startNewChat
    });
    chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
    });
};


// ========================================================
// START: CORRECTED VOICE RECOGNITION CODE
// ========================================================

/**
 * Sets up the Web Speech API for voice recognition.
 * This function should be called once when the application initializes.
 */
export const setupVoiceRecognition = () => {
    // Check if the browser supports the Web Speech API
    if (!('webkitSpeechRecognition' in window)) {
        voiceAssistButton.style.display = "none"; // Hide button if not supported
        return;
    }

    // Initialize the recognition object from the state
    state.recognition = new webkitSpeechRecognition();
    state.recognition.continuous = false; // Stop listening after the user stops speaking
    state.recognition.interimResults = true; // Get results as the user speaks
    state.recognition.lang = 'en-US';

    // Event handler for when recognition starts
    state.recognition.onstart = () => {
        state.isListening = true;
        // Add 'listening' class to the button for the blinking red effect
        voiceAssistButton.classList.add("listening");
    };

    // Event handler for when a speech result is received
    state.recognition.onresult = (event) => {
        let interimTranscript = '',
            finalTranscript = '';

        // Loop through the results to build the final transcript
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update the message input with the transcribed text
        messageInput.value = finalTranscript || interimTranscript;
        messageInput.dispatchEvent(new Event("input")); // Trigger input event to resize textarea
    };

    // Event handler for speech recognition errors
    state.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        state.isListening = false;
        voiceAssistButton.classList.remove("listening");
    };

    // Event handler for when recognition ends
    state.recognition.onend = () => {
        state.isListening = false;
        // Remove 'listening' class to stop the blinking effect
        voiceAssistButton.classList.remove("listening");

        // Automatically send the message if there is transcribed text or a file
        if (messageInput.value.trim() !== "" || state.pendingPdfFile || state.userData.file.data) {
            handleOutgoingMessage(new Event("submit"));
        }
    };
};

/**
 * Toggles the voice recognition on and off.
 * This function should be called by the click event listener of the voice button.
 */
export const toggleVoiceRecognition = () => {
    if (state.isListening) {
        // If already listening, stop it
        state.recognition.stop();
    } else {
        // If not listening, clear the input and start recognition
        messageInput.value = "";
        messageInput.focus();
        try {
            state.recognition.start();
        } catch (error) {
            console.error("Error starting speech recognition:", error);
            alert("Could not start voice assistant. Please check microphone permissions.");
        }
    }
};

// ========================================================
// END: CORRECTED VOICE RECOGNITION CODE
// ========================================================


export const clearCurrentChat = () => {
    const chatToClearId = state.currentChatId;
    const currentChat = state.chatHistory.find(chat => chat.id === chatToClearId);
    if (currentChat) {
        currentChat.messages = currentChat.messages.filter(msg => msg.sender === "bot" && msg.content.includes("Hey there "));
    }
    clearChatMessages();
    createWelcomeMessage();
    saveChatHistory(state);
    renderChatHistory(state, {
        loadChat,
        startNewChat
    });
};

// Expose callbacks for chat history module
const callbacks = {
    loadChat,
    startNewChat
};













