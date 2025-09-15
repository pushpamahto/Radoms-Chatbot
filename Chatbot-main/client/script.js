import {
    state,
    handleOutgoingMessage,
    loadChat,
    startNewChat,
    setupVoiceRecognition,
    clearCurrentChat
} from './modules/chatHandler.js';
import {
    saveChatHistory,
    loadChatHistory,
    renderChatHistory,
    deleteAllHistory
} from './modules/chatHistory.js';
import {
    isValidEmail,
    isValidPhone,
    formatFileSize
} from './modules/utils.js';
import {
    initCountrySelector,
    injectHistoryStyles,
    clearPdfPreview,
    initialInputHeight
} from './modules/uiManager.js';
import * as DOMElements from './modules/domElements.js';
import {
    saveUserData
} from './modules/api.js';

// ---- INITIAL SETUP ----

injectHistoryStyles();
setupVoiceRecognition({
    handleOutgoingMessage
});
initCountrySelector();


// ---- EVENT LISTENERS ----

// User Info Form Validation and Submission
DOMElements.userEmailInput.addEventListener("input", () => {
    const email = DOMElements.userEmailInput.value.trim();
    if (email && !isValidEmail(email)) {
        DOMElements.userEmailInput.classList.add("error");
        DOMElements.emailError.style.display = "block";
    } else {
        DOMElements.userEmailInput.classList.remove("error");
        DOMElements.emailError.style.display = "none";
    }
});

DOMElements.userPhoneInput.addEventListener("input", () => {
    const phone = DOMElements.userPhoneInput.value.trim();
    if (phone && !isValidPhone(phone)) {
        DOMElements.userPhoneInput.classList.add("error");
        DOMElements.phoneError.style.display = "block";
    } else {
        DOMElements.userPhoneInput.classList.remove("error");
        DOMElements.phoneError.style.display = "none";
    }
});

DOMElements.userInfoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = DOMElements.userNameInput.value.trim();
    const email = DOMElements.userEmailInput.value.trim();
    const phone = DOMElements.userPhoneInput.value.trim();
    const countryDialCode = document.querySelector('#country-selector .country-code').textContent;


    if (!isValidEmail(email)) {
        DOMElements.userEmailInput.classList.add("error");
        DOMElements.emailError.style.display = "block";
        DOMElements.userEmailInput.focus();
        return;
    }

    if (!isValidPhone(phone)) {
        DOMElements.userPhoneInput.classList.add("error");
        DOMElements.phoneError.style.display = "block";
        DOMElements.userPhoneInput.focus();
        return;
    }

    if (!name || !email || !phone) return;

    state.userInfo = {
        name,
        email,
        phone: countryDialCode + phone,
        countryCode: countryDialCode
    };

    saveUserData(state.userInfo);

    loadChatHistory(state);
    document.body.classList.remove("show-user-form");
    document.body.classList.add("show-chatbot");
    DOMElements.userNameInput.value = "";
    DOMElements.userEmailInput.value = "";
    DOMElements.userPhoneInput.value = "";
    DOMElements.userEmailInput.classList.remove("error");
    DOMElements.emailError.style.display = "none";
    DOMElements.userPhoneInput.classList.remove("error");
    DOMElements.phoneError.style.display = "none";


    if (state.chatHistory.length > 0) {
        renderChatHistory(state, {
            loadChat,
            startNewChat
        });
        const sortedHistory = [...state.chatHistory].sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
        loadChat(sortedHistory[0].id);
    } else {
        startNewChat();
    }
});

// Chat Toggler and Closing
DOMElements.chatbotToggler.addEventListener("click", () => {
    const isAnythingOpen = document.body.classList.contains("show-user-form") || document.body.classList.contains("show-chatbot");
    document.body.classList.toggle("show-user-form", !isAnythingOpen && !state.userInfo);
    document.body.classList.toggle("show-chatbot", !isAnythingOpen && state.userInfo);
});

DOMElements.closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

// Message Input and Sending
DOMElements.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 768) {
        handleOutgoingMessage(e);
    }
});

DOMElements.messageInput.addEventListener("input", () => {
    DOMElements.messageInput.style.height = `${initialInputHeight}px`;
    DOMElements.messageInput.style.height = `${DOMElements.messageInput.scrollHeight}px`;
    DOMElements.chatForm.style.borderRadius = DOMElements.messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

DOMElements.chatForm.addEventListener("submit", handleOutgoingMessage);
DOMElements.sendMessageButton.addEventListener("click", handleOutgoingMessage);


// File and Emoji Handling
DOMElements.fileInput.addEventListener("change", () => {
    const file = DOMElements.fileInput.files[0];
    if (!file) return;

    clearPdfPreview(state);
    DOMElements.fileUploadWrapper.classList.remove("file-uploaded");
    state.userData.file = {
        data: null,
        mime_type: null,
        uri: null,
        rawFile: null
    };

    if (file.type === "application/pdf") {
        state.pendingPdfFile = file;
        DOMElements.pdfPreviewContainer.innerHTML = `
            <div class="preview-content">
                <span class="material-symbols-rounded preview-icon">picture_as_pdf</span>
                <div class="preview-info">
                    <div class="preview-name">${file.name}</div>
                    <div class="preview-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="material-symbols-rounded preview-cancel-btn">close</button>
        `;
        DOMElements.pdfPreviewContainer.style.display = 'flex';
        DOMElements.pdfPreviewContainer.querySelector(".preview-cancel-btn").addEventListener("click", () => clearPdfPreview(state));

    } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
            DOMElements.fileUploadWrapper.querySelector("img").src = e.target.result;
            DOMElements.fileUploadWrapper.classList.add("file-uploaded");
            const base64String = e.target.result.split(",")[1];
            state.userData.file = {
                data: base64String,
                mime_type: file.type,
                uri: null,
                rawFile: null
            };
        };
        reader.readAsDataURL(file);
    } else {
        alert("Unsupported file type. Please select an image or a PDF.");
    }
    DOMElements.fileInput.value = "";
});

DOMElements.fileCancelButton.addEventListener("click", () => {
    state.userData.file = {
        data: null,
        mime_type: null,
        uri: null,
        rawFile: null
    };
    DOMElements.fileUploadWrapper.classList.remove("file-uploaded");
});

const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const {
            selectionStart: start,
            selectionEnd: end
        } = DOMElements.messageInput;
        DOMElements.messageInput.setRangeText(emoji.native, start, end, "end");
        DOMElements.messageInput.focus();
        DOMElements.messageInput.dispatchEvent(new Event("input"));
    },
    onClickOutside: (e) => {
        if (e.target.id !== "emoji-picker") {
            document.body.classList.remove("show-emoji-picker");
        }
    }
});

DOMElements.chatForm.appendChild(picker);
DOMElements.fileUploadButton.addEventListener("click", () => DOMElements.fileInput.click());
DOMElements.emojiPickerButton.addEventListener("click", (e) => {
    e.stopPropagation();
    document.body.classList.toggle("show-emoji-picker");
});


// Header Menu and History Sidebar
DOMElements.menuToggler.addEventListener("click", (e) => {
    e.stopPropagation();
    DOMElements.dropdownMenu.classList.toggle("show");
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-actions")) DOMElements.dropdownMenu.classList.remove("show");
    if (!e.target.closest("em-emoji-picker") && e.target.id !== "emoji-picker") {
        document.body.classList.remove("show-emoji-picker");
    }
});

DOMElements.chatHistoryButton.addEventListener("click", () => {
    DOMElements.dropdownMenu.classList.remove("show");
    document.body.classList.toggle("show-chat-history");
    renderChatHistory(state, {
        loadChat,
        startNewChat
    });
});

DOMElements.closeHistoryButton.addEventListener("click", () => document.body.classList.remove("show-chat-history"));
DOMElements.clearChatButton.addEventListener("click", () => {
    DOMElements.dropdownMenu.classList.remove("show");
    clearCurrentChat();
});
DOMElements.newChatButton.addEventListener("click", () => {
    DOMElements.dropdownMenu.classList.remove("show");
    startNewChat();
});

DOMElements.deleteAllHistoryButton.addEventListener("click", () => deleteAllHistory(state, {
    loadChat,
    startNewChat
}));

// Voice Assistant
DOMElements.voiceAssistButton.addEventListener("click", () => {
    if (state.isListening) {
        state.recognition.stop();
    } else {
        DOMElements.messageInput.value = "";
        DOMElements.messageInput.focus();
        try {
            state.recognition.start();
        } catch (error) {
            console.error("Error starting speech recognition:", error);
            alert("Could not start voice assistant. Check permissions.");
        }
    }
});












































