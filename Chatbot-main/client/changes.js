const RADOMS_INFO = `
General Business Information:
Company Name: Radoms Digital
Website: radomsdigital.com
Industry: Digital Solutions & IT Services
Founded: 2022
Happy Customers: 50+ satisfied clients globally
Google Rating: 5.0/5 ⭐

About Us:
Radoms Digital is a premier IT company specializing in website development, mobile app creation, UI/UX design, and digital marketing. We are dedicated to transforming innovative ideas into powerful, scalable, and impactful digital experiences that drive growth.

Tagline: "Transforming Ideas into Digital Reality"

Working Hours:
Monday to Saturday: 10:00 AM to 7:00 PM (IST)
Sunday: Closed

Contact Information:
Email: info@radomsdigital.com
WhatsApp Number: +91 94157 70571
Phone: 120-5150892
Address: 12th Floor, O-1234, Greater Noida W Rd, Gaur City 1, center, Greater Noida, Ghaziabad, Uttar Pradesh 201318

Social Media Links:
LinkedIn: linkedin.com/company/radomsdigital/

Core Services:
IOS App Development
Android App Development
Software Development
Ideation & Design
Mobile App Dev
Research & Innovation
Digital Transformation
AI Agent

FAQs:
General:

What services does Radoms Digital offer?
We offer web development, mobile app development, artificial intelligence solutions, digital marketing, and software development services. If you have any specific needs or questions about these services, feel free to ask!

Can I see your portfolio?
Yes! You can view our extensive work on our website.

What technologies do you use for web development?
We use technologies like Next.js, React, Tailwind CSS, Node.js, and MongoDB for web development. If you have any more questions about our tech stack, feel free to ask!

Do you provide free consultations?
Yes, we offer a free 30-minute consultation to discuss your project needs.

How can I track my project progress?
We follow a customer-centric approach, ensuring clear communication and project management throughout the development process. This allows you to stay updated on your project's progress. If you have any specific concerns or questions, feel free to ask!

What if I need changes during development?
We maintain clear communication throughout the development process, so if you need changes, we can discuss them and adjust accordingly. Your feedback is important to us!

How can i contact regarding project?
You can reach us via phone at +91 94157 70571 or email us at info@radomsdigital.com. Feel free to get in touch with us regarding your project!
`;

// Configuration Constants
const CONFIG = {
  API_KEY: "AIzaSyDGK5n3BJtfuy32Jtn5DhLHyJo0GfS6gos",
  BASE_URL: "http://localhost:3007",
  MAX_QUESTIONS_PER_DAY: 10,
  CHAT_HISTORY_RETENTION_DAYS: 7
};

// API Endpoints
const API_ENDPOINTS = {
  GEMINI: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${CONFIG.API_KEY}`,
  FILE_UPLOAD: `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${CONFIG.API_KEY}`,
  SAVE_USER: `${CONFIG.BASE_URL}/save-user`
};

// DOM Elements
const DOM_ELEMENTS = {
  chatBody: document.querySelector(".chat-body"),
  messageInput: document.querySelector(".message-input"),
  sendMessageButton: document.querySelector("#send-message"),
  fileInput: document.querySelector("#file-input"),
  pdfPreviewContainer: document.querySelector("#pdf-preview"),
  fileUploadWrapper: document.querySelector(".file-upload-wrapper"),
  fileCancelButton: document.querySelector("#file-cancel"),
  chatbotToggler: document.querySelector("#chatbot-toggler"),
  closeChatbot: document.querySelector("#close-chatbot"),
  userInfoPopup: document.querySelector(".user-info-popup"),
  userInfoForm: document.querySelector("#user-info-form"),
  userNameInput: document.querySelector("#user-name"),
  userEmailInput: document.querySelector("#user-email"),
  emailError: document.querySelector("#email-error"),
  userPhoneInput: document.querySelector("#user-phone"),
  phoneError: document.querySelector("#phone-error"),
  chatHistoryButton: document.querySelector("#chat-history"),
  chatHistorySidebar: document.querySelector(".chat-history-sidebar"),
  closeHistoryButton: document.querySelector("#close-history"),
  historyList: document.querySelector(".history-list"),
  deleteAllHistoryButton: document.querySelector("#delete-all-history"),
  voiceAssistButton: document.querySelector("#voice-assist")
};

// Application State
const APP_STATE = {
  currentChatId: null,
  chatHistory: [],
  userInfo: null,
  pendingPdfFile: null,
  userQuestionCount: 0,
  lastQuestionDate: null,
  activePdfUploads: {},
  recognition: null,
  isListening: false
};

// User Data Structure
const USER_DATA = {
  message: null,
  file: {
    data: null,
    mime_type: null,
    uri: null,
    rawFile: null
  }
};

// Utility Functions
const Utils = {
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhone: (phone) => {
    const phoneRegex = /^[+]?[0-9]{8,15}$/;
    return phoneRegex.test(phone);
  },

  formatChatTimestamp: (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    
    if (isNaN(date.getTime())) return "";
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const targetDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (targetDateOnly.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (targetDateOnly.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short'
      });
    }
  },

  formatMessageTime: (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },

  createMessageElement: (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
  }
};

// Question Limit Management
const QuestionManager = {
  checkQuestionLimit: () => {
    const today = new Date(Date.now()).toDateString();

    if (APP_STATE.lastQuestionDate !== today) {
      APP_STATE.userQuestionCount = 0;
      APP_STATE.lastQuestionDate = today;
    }
    
    return APP_STATE.userQuestionCount < CONFIG.MAX_QUESTIONS_PER_DAY;
  },

  showLimitExceededMessage: () => {
    const messageContent = `
      <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
        <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path>
      </svg>
      <div class="message-text" id="limit-exceed">
        You've reached your daily limit of ${CONFIG.MAX_QUESTIONS_PER_DAY} questions. 
        Please come back tomorrow to ask more questions.
      </div>`;
    
    const limitMessageDiv = Utils.createMessageElement(messageContent, "bot-message");
    DOM_ELEMENTS.chatBody.appendChild(limitMessageDiv);
    
    DOM_ELEMENTS.chatBody.scrollTo({
      top: DOM_ELEMENTS.chatBody.scrollHeight,
      behavior: "smooth"
    });
  },

  showQuestionWarning: () => {
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
      </div>`;
    
    document.body.appendChild(warningPopup);
    
    setTimeout(() => {
      if (warningPopup.parentNode) {
        warningPopup.parentNode.removeChild(warningPopup);
      }
    }, 3000);
  }
};

// Chat History Management
const ChatHistoryManager = {
  saveChatHistory: () => {
    if (!APP_STATE.userInfo || !APP_STATE.userInfo.email) return;
    
    const chatsToSave = APP_STATE.chatHistory.filter(chat => {
      return chat.messages.some(msg => msg.sender === "user");
    });
    
    const userHistoryKey = `chatHistory_${APP_STATE.userInfo.email}`;
    localStorage.setItem(userHistoryKey, JSON.stringify(chatsToSave));
  },

  loadChatHistory: () => {
    if (!APP_STATE.userInfo || !APP_STATE.userInfo.email) {
      APP_STATE.chatHistory = [];
      return;
    }
    
    const userHistoryKey = `chatHistory_${APP_STATE.userInfo.email}`;
    const savedHistory = localStorage.getItem(userHistoryKey);
    let allUserHistory = savedHistory ? JSON.parse(savedHistory) : [];
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - CONFIG.CHAT_HISTORY_RETENTION_DAYS);
    const oneWeekAgoTimestamp = oneWeekAgo.getTime();
    
    APP_STATE.chatHistory = allUserHistory.filter(chat => 
      chat.lastActive && chat.lastActive >= oneWeekAgoTimestamp
    );
    
    if (APP_STATE.chatHistory.length < allUserHistory.length) {
      ChatHistoryManager.saveChatHistory();
    }
  },

  renderChatHistory: () => {
    DOM_ELEMENTS.historyList.innerHTML = "";
    const sortedHistory = [...APP_STATE.chatHistory].sort((a, b) => 
      (b.lastActive || 0) - (a.lastActive || 0)
    );
    
    sortedHistory.forEach(chat => {
      const chatItem = document.createElement("li");
      chatItem.setAttribute("data-chat-id", chat.id);
      
      const firstUserMessage = chat.messages.find(msg => 
        msg.sender === "user" && (msg.type === "text" || msg.type === "pdf")
      );
      
      let chatTitleText = "New Chat";
      if (firstUserMessage) {
        if (firstUserMessage.type === 'pdf') {
          chatTitleText = firstUserMessage.fileName || "PDF Document";
        } else {
          chatTitleText = firstUserMessage.content.substring(0, 30) + 
            (firstUserMessage.content.length > 30 ? "..." : "");
        }
      } else if (chat.messages.length > 0 && chat.messages[0].content) {
        chatTitleText = chat.messages[0].content.substring(0, 30) + 
          (chat.messages[0].content.length > 30 ? "..." : "");
      }
      
      const chatTime = Utils.formatChatTimestamp(chat.lastActive);
      chatItem.innerHTML = `
        <div class="chat-history-item-content">
          <span class="chat-title">${chatTitleText}</span>
          <span class="chat-time">${chatTime}</span>
        </div>
        <button class="material-symbols-rounded delete-chat-item">delete</button>
      `;
      
      chatItem.addEventListener("click", (e) => {
        if (!e.target.closest(".delete-chat-item")) {
          ChatManager.loadChat(chat.id);
          document.body.classList.remove("show-chat-history");
        }
      });
      
      const deleteButton = chatItem.querySelector(".delete-chat-item");
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        ChatHistoryManager.deleteChat(chat.id);
      });
      
      DOM_ELEMENTS.historyList.appendChild(chatItem);
    });
  },

  deleteChat: (idToDelete) => {
    const chatIndex = APP_STATE.chatHistory.findIndex(chat => chat.id === idToDelete);
    if (chatIndex !== -1) {
      APP_STATE.chatHistory.splice(chatIndex, 1);
      ChatHistoryManager.saveChatHistory();
      ChatHistoryManager.renderChatHistory();
      
      if (APP_STATE.currentChatId === idToDelete) {
        ChatManager.startNewChat();
      }
    }
  },

  deleteAllHistory: () => {
    let alertDiv = document.querySelector(".delete-confirmation-alert");
    if (!alertDiv) {
      alertDiv = document.createElement("div");
      alertDiv.className = "delete-confirmation-alert";
      alertDiv.innerHTML = `
        <p>Are you sure you want to delete all your chat history?</p>
        <div class="delete-confirmation-buttons">
          <button class="confirm-delete">Delete</button>
          <button class="cancel-delete">Cancel</button>
        </div>`;
      
      DOM_ELEMENTS.deleteAllHistoryButton.parentNode.insertBefore(alertDiv, DOM_ELEMENTS.deleteAllHistoryButton);
      
      alertDiv.querySelector(".confirm-delete").addEventListener("click", () => {
        if (!APP_STATE.userInfo || !APP_STATE.userInfo.email) return;
        APP_STATE.chatHistory = [];
        localStorage.removeItem(`chatHistory_${APP_STATE.userInfo.email}`);
        ChatHistoryManager.renderChatHistory();
        ChatManager.startNewChat();
        alertDiv.classList.remove("show");
      });
      
      alertDiv.querySelector(".cancel-delete").addEventListener("click", () => {
        alertDiv.classList.remove("show");
      });
    }
    
    alertDiv.classList.add("show");
  }
};

// PDF Handling
const PDFManager = {
  createPdfUploadElement: (messageId, fileName, fileSize, isCompleted = false, fileUri = null) => {
    const formattedSize = Utils.formatFileSize(fileSize);
    const statusContent = isCompleted ?
      `<span class="upload-status"><span class="material-symbols-rounded completed-check">check_circle</span> Completed</span>` :
      `<span class="file-size">${formattedSize}</span><span class="upload-status">Uploading...</span>`;

    const fileNameContent = isCompleted ?
      `<a href="${fileUri}" target="_blank" style="text-decoration: none; color: #fff;"><div class="file-name">${fileName}</div></a>` :
      `<div class="file-name">${fileName}</div>`;

    return `
      <div class="pdf-upload-container ${isCompleted ? 'completed' : ''}" id="pdf-${messageId}">
        <span class="material-symbols-rounded pdf-icon">picture_as_pdf</span>
        <div class="file-info">
          ${fileNameContent}
          <div class="progress-details">${statusContent}</div>
          ${!isCompleted ? '<div class="progress-bar"><div class="progress"></div></div>' : ''}
        </div>
      </div>`;
  },

  startPdfUploadProcess: async (file, messageId, userQuery) => {
    const ui = {
      container: document.getElementById(`pdf-${messageId}`),
      progressBar: document.querySelector(`#pdf-${messageId} .progress`),
      statusText: document.querySelector(`#pdf-${messageId} .upload-status`),
    };

    DOM_ELEMENTS.chatBody.scrollTo({
      top: DOM_ELEMENTS.chatBody.scrollHeight,
      behavior: "smooth"
    });

    try {
      const startResponse = await fetch(API_ENDPOINTS.FILE_UPLOAD, {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': file.size,
          'X-Goog-Upload-Header-Content-Type': file.type,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'file': {
            'display_name': file.name
          }
        })
      });
      
      if (!startResponse.ok) throw new Error(`API Error: ${startResponse.statusText}`);
      const uploadUrl = startResponse.headers.get('X-Goog-Upload-Url');
      if (!uploadUrl) throw new Error("Could not get upload URL.");

      const xhr = new XMLHttpRequest();
      APP_STATE.activePdfUploads[messageId] = xhr;
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
      xhr.setRequestHeader('Content-Type', file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          ui.progressBar.style.width = percentComplete + '%';
          ui.statusText.textContent = `${Math.round(percentComplete)}% uploaded`;
          
          DOM_ELEMENTS.chatBody.scrollTo({
            top: DOM_ELEMENTS.chatBody.scrollHeight,
            behavior: "smooth"
          });
        }
      };

      xhr.onload = () => {
        delete APP_STATE.activePdfUploads[messageId];
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const fileUri = response.file.uri;

          ui.container.classList.add('completed');
          ui.progressBar.parentElement.style.display = 'none';
          ui.statusText.innerHTML = `<span class="material-symbols-rounded completed-check">check_circle</span> Completed`;

          const currentChat = APP_STATE.chatHistory.find(chat => chat.id === APP_STATE.currentChatId);
          const msgToUpdate = currentChat?.messages.find(msg => msg.id === messageId);
          
          if (msgToUpdate) {
            msgToUpdate.fileUri = fileUri;
            ChatHistoryManager.saveChatHistory();
          }

          USER_DATA.message = userQuery || `The user uploaded a file named "${file.name}". Please provide a brief summary of this document.`;
          USER_DATA.file = {
            uri: fileUri,
            mime_type: file.type,
            data: null,
            rawFile: null
          };
          
          setTimeout(() => {
            DOM_ELEMENTS.chatBody.scrollTo({
              top: DOM_ELEMENTS.chatBody.scrollHeight,
              behavior: "smooth"
            });
          }, 100);
          
          ChatManager.handleBotResponse();
        } else {
          throw new Error(`Upload failed: ${xhr.statusText}`);
        }
      };

      xhr.onerror = () => {
        delete APP_STATE.activePdfUploads[messageId];
        ui.statusText.textContent = "Upload failed.";
        ui.statusText.style.color = "#d93025";
        
        DOM_ELEMENTS.chatBody.scrollTo({
          top: DOM_ELEMENTS.chatBody.scrollHeight,
          behavior: "smooth"
        });
      };
      
      xhr.send(file);
    } catch (error) {
      console.error("PDF Upload Error:", error);
      if (ui.statusText) {
        ui.statusText.textContent = "Error!";
        ui.statusText.style.color = "#d93025";
        DOM_ELEMENTS.chatBody.scrollTo({
          top: DOM_ELEMENTS.chatBody.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  },

  renderPdfMessageFromHistory: (msg) => {
    const content = `
      ${msg.content ? `<div class="message-text">${msg.content}</div>` : ''}
      ${PDFManager.createPdfUploadElement(msg.id, msg.fileName, msg.fileSize, true, msg.fileUri)}
      <div class="user-message-time">${Utils.formatMessageTime(msg.timestamp)}</div>`;
    
    return Utils.createMessageElement(content, "user-message");
  },

  clearPdfPreview: () => {
    APP_STATE.pendingPdfFile = null;
    DOM_ELEMENTS.pdfPreviewContainer.innerHTML = '';
    DOM_ELEMENTS.pdfPreviewContainer.style.display = 'none';
    DOM_ELEMENTS.fileInput.value = '';
  }
};

// Chat Management
const ChatManager = {
  loadChat: (chatId) => {
    const chat = APP_STATE.chatHistory.find(c => c.id === chatId);
    if (!chat) {
      ChatManager.startNewChat();
      return;
    }
    
    APP_STATE.currentChatId = chatId;
    DOM_ELEMENTS.chatBody.innerHTML = "";
    
    chat.messages.forEach(msg => {
      let messageDiv;
      
      if (msg.sender === "bot") {
        let messageContent = msg.formattedContent || 
          msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
            
        const content = `
          <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
            <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path>
          </svg>
          <div class="message-text">${messageContent}</div>`;
        
        messageDiv = Utils.createMessageElement(content, "bot-message");
      } else {
        if (msg.type === 'pdf') {
          messageDiv = PDFManager.renderPdfMessageFromHistory(msg);
        } else {
          const content = `
            ${msg.content ? `<div class="message-text">${msg.content}</div>` : ''}
            ${msg.type === "image" && msg.fileData ? 
              `<img src="data:${msg.mimeType};base64,${msg.fileData}" class="attachment" />` : ""}
            <div class="user-message-time">${Utils.formatMessageTime(msg.timestamp)}</div>`;
          
          messageDiv = Utils.createMessageElement(content, "user-message");
        }
      }
      
      DOM_ELEMENTS.chatBody.appendChild(messageDiv);
    });
    
    DOM_ELEMENTS.chatBody.scrollTo({
      top: DOM_ELEMENTS.chatBody.scrollHeight,
      behavior: "smooth"
    });
  },

  startNewChat: () => {
    const currentChat = APP_STATE.chatHistory.find(chat => chat.id === APP_STATE.currentChatId);
    const shouldCreateNew = !currentChat || currentChat.messages.some(msg => msg.sender === "user");

    if (shouldCreateNew) {
      APP_STATE.currentChatId = Date.now().toString();
      APP_STATE.chatHistory.unshift({
        id: APP_STATE.currentChatId,
        messages: [],
        lastActive: Date.now()
      });
    }
    
    ChatManager.clearChatMessages();
    ChatManager.createWelcomeMessage();
  },

  clearChatMessages: () => {
    DOM_ELEMENTS.chatBody.innerHTML = "";
    USER_DATA.message = null;
    USER_DATA.file = {
      data: null,
      mime_type: null,
      uri: null,
      rawFile: null
    };
    
    APP_STATE.pendingPdfFile = null;
    DOM_ELEMENTS.pdfPreviewContainer.style.display = 'none';
    DOM_ELEMENTS.pdfPreviewContainer.innerHTML = '';
    DOM_ELEMENTS.fileUploadWrapper.classList.remove("file-uploaded");
    DOM_ELEMENTS.messageInput.value = "";
    
    const initialInputHeight = DOM_ELEMENTS.messageInput.scrollHeight;
    DOM_ELEMENTS.messageInput.style.height = `${initialInputHeight}px`;
    document.querySelector(".chat-form").style.borderRadius = "32px";
  },

  createWelcomeMessage: () => {
    const welcomeMessageContent = "Hey there 👋 <br> How can I help you today?";
    const welcomeMessageHTML = `
      <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
        <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path>
      </svg>
      <div class="message-text">${welcomeMessageContent}</div>`;
    
    const welcomeDiv = Utils.createMessageElement(welcomeMessageHTML, "bot-message");
    DOM_ELEMENTS.chatBody.appendChild(welcomeDiv);
    
    const currentChat = APP_STATE.chatHistory.find(chat => chat.id === APP_STATE.currentChatId);
    if (currentChat && currentChat.messages.length === 0) {
      currentChat.messages.push({
        sender: "bot",
        type: "text",
        content: welcomeMessageContent,
        formattedContent: welcomeMessageContent
      });
      
      currentChat.lastActive = Date.now();
      ChatHistoryManager.saveChatHistory();
      ChatHistoryManager.renderChatHistory();
    }
  },

  generateBotResponse: async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");
    const parts = [];
    
    if (USER_DATA.message) parts.push({ text: USER_DATA.message });
    
    if (USER_DATA.file.uri) {
      parts.push({
        file_data: {
          mime_type: USER_DATA.file.mime_type,
          file_uri: USER_DATA.file.uri
        }
      });
    } else if (USER_DATA.file.data) {
      parts.push({
        inline_data: {
          mime_type: USER_DATA.file.mime_type,
          data: USER_DATA.file.data
        }
      });
    }
    
    const systemInstruction = {
      parts: [{
        text: `You are a customer support chatbot for Radoms Digital. Below is information about the company. Use this information to answer any questions about Radoms Digital:

${RADOMS_INFO}

For any questions about Radoms Digital, respond based on the information above. For other questions, respond normally.`
      }]
    };
    
    const requestBody = {
      contents: [{ parts }],
      systemInstruction: systemInstruction
    };
    
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    };
    
    let botResponseText = "";
    let formattedResponse = "";
    
    try {
      const response = await fetch(API_ENDPOINTS.GEMINI, requestOptions);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || `API Error: ${response.status}`);
      }
      
      const data = await response.json();
      let rawText = data.candidates[0]?.content?.parts[0]?.text || "Sorry, I couldn't process that.";
      
      formattedResponse = rawText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/#+\s*(.*?)(?:\n|$)/g, '<strong>$1</strong>')
        .replace(/- /g, '• ')
        .replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre>$1</pre>')
        .replace(/\`(.*?)\`/g, '<code>$1</code>');
      
      botResponseText = rawText;
      messageElement.innerHTML = formattedResponse;
    } catch (error) {
      console.error("API Error:", error);
      botResponseText = `Oops! Something went wrong: ${error.message}. Please check your API key and try again.`;
      formattedResponse = botResponseText;
      messageElement.innerText = botResponseText;
      messageElement.style.color = "#ff0000";
    } finally {
      const currentChat = APP_STATE.chatHistory.find(chat => chat.id === APP_STATE.currentChatId);
      if (currentChat) {
        currentChat.messages.push({
          sender: "bot",
          type: "text",
          content: botResponseText,
          formattedContent: formattedResponse
        });
        
        currentChat.lastActive = Date.now();
        ChatHistoryManager.saveChatHistory();
        ChatHistoryManager.renderChatHistory();
      }
      
      USER_DATA.file = { data: null, mime_type: null, uri: null, rawFile: null };
      incomingMessageDiv.classList.remove("thinking");
      
      DOM_ELEMENTS.chatBody.scrollTo({
        top: DOM_ELEMENTS.chatBody.scrollHeight,
        behavior: "smooth"
      });
    }
  },

  handleBotResponse: () => {
    setTimeout(() => {
      const thinkingMessageContent = `
        <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
          <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z" fill="#fff"></path>
        </svg>
        <div class="message-text">
          <div class="thinking-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>`;
      
      const incomingMessageDiv = Utils.createMessageElement(thinkingMessageContent, "bot-message", "thinking");
      DOM_ELEMENTS.chatBody.appendChild(incomingMessageDiv);
      
      DOM_ELEMENTS.chatBody.scrollTo({
        top: DOM_ELEMENTS.chatBody.scrollHeight,
        behavior: "smooth"
      });
      
      ChatManager.generateBotResponse(incomingMessageDiv);
    }, 600);
  },

  handleOutgoingMessage: (e) => {
    e.preventDefault();
    USER_DATA.message = DOM_ELEMENTS.messageInput.value.trim();

    if (!USER_DATA.message && !USER_DATA.file.data && !APP_STATE.pendingPdfFile) return;

    if (!QuestionManager.checkQuestionLimit()) {
      QuestionManager.showLimitExceededMessage();
      return;
    }
    
    APP_STATE.userQuestionCount++;
    
    if (APP_STATE.userQuestionCount === CONFIG.MAX_QUESTIONS_PER_DAY - 1) {
      QuestionManager.showQuestionWarning();
    }

    let currentChat = APP_STATE.chatHistory.find(chat => chat.id === APP_STATE.currentChatId);
    if (!currentChat) {
      ChatManager.startNewChat();
      currentChat = APP_STATE.chatHistory.find(chat => chat.id === APP_STATE.currentChatId);
    }

    if (APP_STATE.pendingPdfFile) {
      const messageId = `msg_${Date.now()}`;
      const messageData = {
        id: messageId,
        sender: "user",
        type: "pdf",
        content: USER_DATA.message,
        fileName: APP_STATE.pendingPdfFile.name,
        fileSize: APP_STATE.pendingPdfFile.size,
        fileUri: null,
        timestamp: Date.now()
      };
      
      currentChat.messages.push(messageData);

      const pdfUploadHTML = PDFManager.createPdfUploadElement(
        messageId, 
        APP_STATE.pendingPdfFile.name, 
        APP_STATE.pendingPdfFile.size
      );
      
      const messageHTML = `
        ${USER_DATA.message ? `<div class="message-text">${USER_DATA.message}</div>` : ''}
        ${pdfUploadHTML}
        <div class="user-message-time">${Utils.formatMessageTime(Date.now())}</div>`;

      const outgoingMessageDiv = Utils.createMessageElement(messageHTML, "user-message");
      DOM_ELEMENTS.chatBody.appendChild(outgoingMessageDiv);

      PDFManager.startPdfUploadProcess(APP_STATE.pendingPdfFile, messageId, USER_DATA.message);
      APP_STATE.pendingPdfFile = null;
      
      DOM_ELEMENTS.pdfPreviewContainer.style.display = 'none';
      DOM_ELEMENTS.pdfPreviewContainer.innerHTML = '';
      DOM_ELEMENTS.messageInput.value = "";
      DOM_ELEMENTS.messageInput.dispatchEvent(new Event("input"));
    } else {
      currentChat.messages.push({
        sender: "user",
        type: USER_DATA.file.data ? "image" : "text",
        content: USER_DATA.message,
        fileData: USER_DATA.file.data,
        mimeType: USER_DATA.file.mime_type,
        timestamp: Date.now()
      });

      const messageHTML = `
        ${USER_DATA.message ? `<div class="message-text">${USER_DATA.message}</div>` : ''}
        ${USER_DATA.file.data ? 
          `<img src="data:${USER_DATA.file.mime_type};base64,${USER_DATA.file.data}" class="attachment" />` : ""}
        <div class="user-message-time">${Utils.formatMessageTime(Date.now())}</div>`;

      const outgoingMessageDiv = Utils.createMessageElement(messageHTML, "user-message");
      DOM_ELEMENTS.chatBody.appendChild(outgoingMessageDiv);

      ChatManager.handleBotResponse();

      DOM_ELEMENTS.messageInput.value = "";
      DOM_ELEMENTS.fileUploadWrapper.classList.remove("file-uploaded");
      DOM_ELEMENTS.messageInput.dispatchEvent(new Event("input"));
    }

    currentChat.lastActive = Date.now();
    ChatHistoryManager.saveChatHistory();
    ChatHistoryManager.renderChatHistory();

    DOM_ELEMENTS.chatBody.scrollTo({
      top: DOM_ELEMENTS.chatBody.scrollHeight,
      behavior: "smooth"
    });
  }
};

// Voice Recognition
const VoiceManager = {
  setupVoiceRecognition: () => {
    if (!('webkitSpeechRecognition' in window)) {
      DOM_ELEMENTS.voiceAssistButton.style.display = "none";
      return;
    }
    
    APP_STATE.recognition = new webkitSpeechRecognition();
    APP_STATE.recognition.continuous = false;
    APP_STATE.recognition.interimResults = true;
    APP_STATE.recognition.lang = 'en-US';
    
    APP_STATE.recognition.onstart = () => {
      APP_STATE.isListening = true;
      DOM_ELEMENTS.voiceAssistButton.classList.add("listening");
    };
    
    APP_STATE.recognition.onresult = (event) => {
      let interimTranscript = '',
          finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      
      DOM_ELEMENTS.messageInput.value = finalTranscript || interimTranscript;
      DOM_ELEMENTS.messageInput.dispatchEvent(new Event("input"));
    };
    
    APP_STATE.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      APP_STATE.isListening = false;
      DOM_ELEMENTS.voiceAssistButton.classList.remove("listening");
    };
    
    APP_STATE.recognition.onend = () => {
      APP_STATE.isListening = false;
      DOM_ELEMENTS.voiceAssistButton.classList.remove("listening");
      
      if (DOM_ELEMENTS.messageInput.value.trim() !== "" || 
          APP_STATE.pendingPdfFile || 
          USER_DATA.file.data) {
        ChatManager.handleOutgoingMessage(new Event("submit"));
      }
    };
  },

  toggleVoiceRecognition: () => {
    if (APP_STATE.isListening) {
      APP_STATE.recognition.stop();
    } else {
      DOM_ELEMENTS.messageInput.value = "";
      DOM_ELEMENTS.messageInput.focus();
      
      try {
        APP_STATE.recognition.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        alert("Could not start voice assistant. Check permissions.");
      }
    }
  }
};

// Country Selector
const CountryManager = {
   countries : 
[
    { code: "us", name: "United States", dialCode: "+1", flag: "https://flagcdn.com/w40/us.png" },
    { code: "gb", name: "United Kingdom", dialCode: "+44", flag: "https://flagcdn.com/w40/gb.png" },
    { code: "ca", name: "Canada", dialCode: "+1", flag: "https://flagcdn.com/w40/ca.png" },
    { code: "au", name: "Australia", dialCode: "+61", flag: "https://flagcdn.com/w40/au.png" },
    { code: "de", name: "Germany", dialCode: "+49", flag: "https://flagcdn.com/w40/de.png" },
    { code: "fr", name: "France", dialCode: "+33", flag: "https://flagcdn.com/w40/fr.png" },
    { code: "it", name: "Italy", dialCode: "+39", flag: "https://flagcdn.com/w40/it.png" },
    { code: "es", name: "Spain", dialCode: "+34", flag: "https://flagcdn.com/w40/es.png" },
    { code: "in", name: "India", dialCode: "+91", flag: "https://flagcdn.com/w40/in.png" },
    { code: "cn", name: "China", dialCode: "+86", flag: "https://flagcdn.com/w40/cn.png" },
    { code: "jp", name: "Japan", dialCode: "+81", flag: "https://flagcdn.com/w40/jp.png" },
    { code: "br", name: "Brazil", dialCode: "+55", flag: "https://flagcdn.com/w40/br.png" },
    { code: "ru", name: "Russia", dialCode: "+7", flag: "https://flagcdn.com/w40/ru.png" },
    { code: "mx", name: "Mexico", dialCode: "+52", flag: "https://flagcdn.com/w40/mx.png" },
    { code: "za", name: "South Africa", dialCode: "+27", flag: "https://flagcdn.com/w40/za.png" },
    { code: "kr", name: "South Korea", dialCode: "+82", flag: "https://flagcdn.com/w40/kr.png" },
    { code: "id", name: "Indonesia", dialCode: "+62", flag: "https://flagcdn.com/w40/id.png" },
    { code: "tr", name: "Turkey", dialCode: "+90", flag: "https://flagcdn.com/w40/tr.png" },
    { code: "sa", name: "Saudi Arabia", dialCode: "+966", flag: "https://flagcdn.com/w40/sa.png" },
    { code: "nl", name: "Netherlands", dialCode: "+31", flag: "https://flagcdn.com/w40/nl.png" },
    { code: "ch", name: "Switzerland", dialCode: "+41", flag: "https://flagcdn.com/w40/ch.png" },
    { code: "se", name: "Sweden", dialCode: "+46", flag: "https://flagcdn.com/w40/se.png" },
    { code: "no", name: "Norway", dialCode: "+47", flag: "https://flagcdn.com/w40/no.png" },
    { code: "dk", name: "Denmark", dialCode: "+45", flag: "https://flagcdn.com/w40/dk.png" },
    { code: "fi", name: "Finland", dialCode: "+358", flag: "https://flagcdn.com/w40/fi.png" },
    { code: "pl", name: "Poland", dialCode: "+48", flag: "https://flagcdn.com/w40/pl.png" },
    { code: "be", name: "Belgium", dialCode: "+32", flag: "https://flagcdn.com/w40/be.png" },
    { code: "at", name: "Austria", dialCode: "+43", flag: "https://flagcdn.com/w40/at.png" },
    { code: "ie", name: "Ireland", dialCode: "+353", flag: "https://flagcdn.com/w40/ie.png" },
    { code: "pt", name: "Portugal", dialCode: "+351", flag: "https://flagcdn.com/w40/pt.png" },
    { code: "gr", name: "Greece", dialCode: "+30", flag: "https://flagcdn.com/w40/gr.png" },
    { code: "cz", name: "Czech Republic", dialCode: "+420", flag: "https://flagcdn.com/w40/cz.png" },
    { code: "hu", name: "Hungary", dialCode: "+36", flag: "https://flagcdn.com/w40/hu.png" },
    { code: "ro", name: "Romania", dialCode: "+40", flag: "https://flagcdn.com/w40/ro.png" },
    { code: "sg", name: "Singapore", dialCode: "+65", flag: "https://flagcdn.com/w40/sg.png" },
    { code: "my", name: "Malaysia", dialCode: "+60", flag: "https://flagcdn.com/w40/my.png" },
    { code: "th", name: "Thailand", dialCode: "+66", flag: "https://flagcdn.com/w40/th.png" },
    { code: "vn", name: "Vietnam", dialCode: "+84", flag: "https://flagcdn.com/w40/vn.png" },
    { code: "ph", name: "Philippines", dialCode: "+63", flag: "https://flagcdn.com/w40/ph.png" },
    { code: "ar", name: "Argentina", dialCode: "+54", flag: "https://flagcdn.com/w40/ar.png" },
    { code: "cl", name: "Chile", dialCode: "+56", flag: "https://flagcdn.com/w40/cl.png" },
    { code: "co", name: "Colombia", dialCode: "+57", flag: "https://flagcdn.com/w40/co.png" },
    { code: "pe", name: "Peru", dialCode: "+51", flag: "https://flagcdn.com/w40/pe.png" },
    { code: "ve", name: "Venezuela", dialCode: "+58", flag: "https://flagcdn.com/w40/ve.png" },
    { code: "ng", name: "Nigeria", dialCode: "+234", flag: "https://flagcdn.com/w40/ng.png" },
    { code: "eg", name: "Egypt", dialCode: "+20", flag: "https://flagcdn.com/w40/eg.png" },
    { code: "ma", name: "Morocco", dialCode: "+212", flag: "https://flagcdn.com/w40/ma.png" },
    { code: "dz", name: "Algeria", dialCode: "+213", flag: "https://flagcdn.com/w40/dz.png" },
    { code: "ke", name: "Kenya", dialCode: "+254", flag: "https://flagcdn.com/w40/ke.png" },
    { code: "gh", name: "Ghana", dialCode: "+233", flag: "https://flagcdn.com/w40/gh.png" },
    { code: "et", name: "Ethiopia", dialCode: "+251", flag: "https://flagcdn.com/w40/et.png" },
    { code: "tz", name: "Tanzania", dialCode: "+255", flag: "https://flagcdn.com/w40/tz.png" },
    { code: "ug", name: "Uganda", dialCode: "+256", flag: "https://flagcdn.com/w40/ug.png" },
    { code: "zm", name: "Zambia", dialCode: "+260", flag: "https://flagcdn.com/w40/zm.png" },
    { code: "zw", name: "Zimbabwe", dialCode: "+263", flag: "https://flagcdn.com/w40/zw.png" },
    { code: "na", name: "Namibia", dialCode: "+264", flag: "https://flagcdn.com/w40/na.png" },
    { code: "mw", name: "Malawi", dialCode: "+265", flag: "https://flagcdn.com/w40/mw.png" },
    { code: "mz", name: "Mozambique", dialCode: "+258", flag: "https://flagcdn.com/w40/mz.png" },
    { code: "ao", name: "Angola", dialCode: "+244", flag: "https://flagcdn.com/w40/ao.png" },
    { code: "cm", name: "Cameroon", dialCode: "+237", flag: "https://flagcdn.com/w40/cm.png" },
    { code: "ci", name: "Ivory Coast", dialCode: "+225", flag: "https://flagcdn.com/w40/ci.png" },
    { code: "sn", name: "Senegal", dialCode: "+221", flag: "https://flagcdn.com/w40/sn.png" },
    { code: "mg", name: "Madagascar", dialCode: "+261", flag: "https://flagcdn.com/w40/mg.png" },
    { code: "ne", name: "Niger", dialCode: "+227", flag: "https://flagcdn.com/w40/ne.png" },
    { code: "bf", name: "Burkina Faso", dialCode: "+226", flag: "https://flagcdn.com/w40/bf.png" },
    { code: "ml", name: "Mali", dialCode: "+223", flag: "https://flagcdn.com/w40/ml.png" },
    { code: "tn", name: "Tunisia", dialCode: "+216", flag: "https://flagcdn.com/w40/tn.png" },
    { code: "ly", name: "Libya", dialCode: "+218", flag: "https://flagcdn.com/w40/ly.png" },
    { code: "sd", name: "Sudan", dialCode: "+249", flag: "https://flagcdn.com/w40/sd.png" },
    { code: "so", name: "Somalia", dialCode: "+252", flag: "https://flagcdn.com/w40/so.png" },
    { code: "er", name: "Eritrea", dialCode: "+291", flag: "https://flagcdn.com/w40/er.png" },
    { code: "dj", name: "Djibouti", dialCode: "+253", flag: "https://flagcdn.com/w40/dj.png" },
    { code: "mr", name: "Mauritania", dialCode: "+222", flag: "https://flagcdn.com/w40/mr.png" },
    { code: "gm", name: "Gambia", dialCode: "+220", flag: "https://flagcdn.com/w40/gm.png" },
    { code: "gn", name: "Guinea", dialCode: "+224", flag: "https://flagcdn.com/w40/gn.png" },
    { code: "lr", name: "Liberia", dialCode: "+231", flag: "https://flagcdn.com/w40/lr.png" },
    { code: "sl", name: "Sierra Leone", dialCode: "+232", flag: "https://flagcdn.com/w40/sl.png" },
    { code: "tg", name: "Togo", dialCode: "+228", flag: "https://flagcdn.com/w40/tg.png" },
    { code: "bj", name: "Benin", dialCode: "+229", flag: "https://flagcdn.com/w40/bj.png" },
    { code: "cv", name: "Cape Verde", dialCode: "+238", flag: "https://flagcdn.com/w40/cv.png" },
    { code: "gw", name: "Guinea-Bissau", dialCode: "+245", flag: "https://flagcdn.com/w40/gw.png" },
    { code: "st", name: "Sao Tome and Principe", dialCode: "+239", flag: "https://flagcdn.com/w40/st.png" },
    { code: "gq", name: "Equatorial Guinea", dialCode: "+240", flag: "https://flagcdn.com/w40/gq.png" },
    { code: "ga", name: "Gabon", dialCode: "+241", flag: "https://flagcdn.com/w40/ga.png" },
    { code: "cg", name: "Congo", dialCode: "+242", flag: "https://flagcdn.com/w40/cg.png" },
    { code: "cd", name: "DR Congo", dialCode: "+243", flag: "https://flagcdn.com/w40/cd.png" },
    { code: "rw", name: "Rwanda", dialCode: "+250", flag: "https://flagcdn.com/w40/rw.png" },
    { code: "bi", name: "Burundi", dialCode: "+257", flag: "https://flagcdn.com/w40/bi.png" },
    { code: "ss", name: "South Sudan", dialCode: "+211", flag: "https://flagcdn.com/w40/ss.png" },
    { code: "cf", name: "Central African Republic", dialCode: "+236", flag: "https://flagcdn.com/w40/cf.png" },
    { code: "td", name: "Chad", dialCode: "+235", flag: "https://flagcdn.com/w40/td.png" },
    { code: "km", name: "Comoros", dialCode: "+269", flag: "https://flagcdn.com/w40/km.png" },
    { code: "sc", name: "Seychelles", dialCode: "+248", flag: "https://flagcdn.com/w40/sc.png" },
    { code: "mu", name: "Mauritius", dialCode: "+230", flag: "https://flagcdn.com/w40/mu.png" },
    { code: "re", name: "Reunion", dialCode: "+262", flag: "https://flagcdn.com/w40/re.png" },
    { code: "yt", name: "Mayotte", dialCode: "+262", flag: "https://flagcdn.com/w40/yt.png" },
    { code: "sh", name: "Saint Helena", dialCode: "+290", flag: "https://flagcdn.com/w40/sh.png" },
    { code: "io", name: "British Indian Ocean Territory", dialCode: "+246", flag: "https://flagcdn.com/w40/io.png" },
    { code: "tf", name: "French Southern Territories", dialCode: "+262", flag: "https://flagcdn.com/w40/tf.png" },
    { code: "aq", name: "Antarctica", dialCode: "+672", flag: "https://flagcdn.com/w40/aq.png" },
    { code: "gs", name: "South Georgia", dialCode: "+500", flag: "https://flagcdn.com/w40/gs.png" },
    { code: "fk", name: "Falkland Islands", dialCode: "+500", flag: "https://flagcdn.com/w40/fk.png" },
    { code: "bv", name: "Bouvet Island", dialCode: "+47", flag: "https://flagcdn.com/w40/bv.png" },
    { code: "hm", name: "Heard Island and McDonald Islands", dialCode: "+672", flag: "https://flagcdn.com/w40/hm.png" },
    { code: "um", name: "United States Minor Outlying Islands", dialCode: "+1", flag: "https://flagcdn.com/w40/um.png" },
    { code: "as", name: "American Samoa", dialCode: "+1", flag: "https://flagcdn.com/w40/as.png" },
    { code: "gu", name: "Guam", dialCode: "+1", flag: "https://flagcdn.com/w40/gu.png" },
    { code: "mp", name: "Northern Mariana Islands", dialCode: "+1", flag: "https://flagcdn.com/w40/mp.png" },
    { code: "pr", name: "Puerto Rico", dialCode: "+1", flag: "https://flagcdn.com/w40/pr.png" },
    { code: "vi", name: "U.S. Virgin Islands", dialCode: "+1", flag: "https://flagcdn.com/w40/vi.png" },
    { code: "vg", name: "British Virgin Islands", dialCode: "+1", flag: "https://flagcdn.com/w40/vg.png" },
    { code: "ai", name: "Anguilla", dialCode: "+1", flag: "https://flagcdn.com/w40/ai.png" },
    { code: "ag", name: "Antigua and Barbuda", dialCode: "+1", flag: "https://flagcdn.com/w40/ag.png" },
    { code: "dm", name: "Dominica", dialCode: "+1", flag: "https://flagcdn.com/w40/dm.png" },
    { code: "gd", name: "Grenada", dialCode: "+1", flag: "https://flagcdn.com/w40/gd.png" },
    { code: "kn", name: "Saint Kitts and Nevis", dialCode: "+1", flag: "https://flagcdn.com/w40/kn.png" },
    { code: "lc", name: "Saint Lucia", dialCode: "+1", flag: "https://flagcdn.com/w40/lc.png" },
    { code: "vc", name: "Saint Vincent and the Grenadines", dialCode: "+1", flag: "https://flagcdn.com/w40/vc.png" },
    { code: "bb", name: "Barbados", dialCode: "+1", flag: "https://flagcdn.com/w40/bb.png" },
    { code: "tt", name: "Trinidad and Tobago", dialCode: "+1", flag: "https://flagcdn.com/w40/tt.png" },
    { code: "jm", name: "Jamaica", dialCode: "+1", flag: "https://flagcdn.com/w40/jm.png" },
    { code: "bs", name: "Bahamas", dialCode: "+1", flag: "https://flagcdn.com/w40/bs.png" },
    { code: "ky", name: "Cayman Islands", dialCode: "+1", flag: "https://flagcdn.com/w40/ky.png" },
    { code: "bm", name: "Bermuda", dialCode: "+1", flag: "https://flagcdn.com/w40/bm.png" },
    { code: "aw", name: "Aruba", dialCode: "+297", flag: "https://flagcdn.com/w40/aw.png" },
    { code: "cw", name: "Curacao", dialCode: "+599", flag: "https://flagcdn.com/w40/cw.png" },
    { code: "sx", name: "Sint Maarten", dialCode: "+1", flag: "https://flagcdn.com/w40/sx.png" },
    { code: "mf", name: "Saint Martin", dialCode: "+590", flag: "https://flagcdn.com/w40/mf.png" },
    { code: "bl", name: "Saint Barthelemy", dialCode: "+590", flag: "https://flagcdn.com/w40/bl.png" },
    { code: "gp", name: "Guadeloupe", dialCode: "+590", flag: "https://flagcdn.com/w40/gp.png" },
    { code: "mq", name: "Martinique", dialCode: "+596", flag: "https://flagcdn.com/w40/mq.png" },
    { code: "gf", name: "French Guiana", dialCode: "+594", flag: "https://flagcdn.com/w40/gf.png" },
    { code: "sr", name: "Suriname", dialCode: "+597", flag: "https://flagcdn.com/w40/sr.png" },
    { code: "gy", name: "Guyana", dialCode: "+592", flag: "https://flagcdn.com/w40/gy.png" },
    { code: "ec", name: "Ecuador", dialCode: "+593", flag: "https://flagcdn.com/w40/ec.png" },
    { code: "bo", name: "Bolivia", dialCode: "+591", flag: "https://flagcdn.com/w40/bo.png" },
    { code: "py", name: "Paraguay", dialCode: "+595", flag: "https://flagcdn.com/w40/py.png" },
    { code: "uy", name: "Uruguay", dialCode: "+598", flag: "https://flagcdn.com/w40/uy.png" },
    { code: "nz", name: "New Zealand", dialCode: "+64", flag: "https://flagcdn.com/w40/nz.png" },
    { code: "nc", name: "New Caledonia", dialCode: "+687", flag: "https://flagcdn.com/w40/nc.png" },
    { code: "pf", name: "French Polynesia", dialCode: "+689", flag: "https://flagcdn.com/w40/pf.png" },
    { code: "wf", name: "Wallis and Futuna", dialCode: "+681", flag: "https://flagcdn.com/w40/wf.png" },
    { code: "tk", name: "Tokelau", dialCode: "+690", flag: "https://flagcdn.com/w40/tk.png" },
    { code: "to", name: "Tonga", dialCode: "+676", flag: "https://flagcdn.com/w40/to.png" },
    { code: "ws", name: "Samoa", dialCode: "+685", flag: "https://flagcdn.com/w40/ws.png" },
    { code: "ki", name: "Kiribati", dialCode: "+686", flag: "https://flagcdn.com/w40/ki.png" },
    { code: "tv", name: "Tuvalu", dialCode: "+688", flag: "https://flagcdn.com/w40/tv.png" },
    { code: "nr", name: "Nauru", dialCode: "+674", flag: "https://flagcdn.com/w40/nr.png" },
    { code: "vu", name: "Vanuatu", dialCode: "+678", flag: "https://flagcdn.com/w40/vu.png" },
    { code: "fj", name: "Fiji", dialCode: "+679", flag: "https://flagcdn.com/w40/fj.png" },
    { code: "sb", name: "Solomon Islands", dialCode: "+677", flag: "https://flagcdn.com/w40/sb.png" },
    { code: "pg", name: "Papua New Guinea", dialCode: "+675", flag: "https://flagcdn.com/w40/pg.png" },
    { code: "pw", name: "Palau", dialCode: "+680", flag: "https://flagcdn.com/w40/pw.png" },
    { code: "fm", name: "Micronesia", dialCode: "+691", flag: "https://flagcdn.com/w40/fm.png" },
    { code: "mh", name: "Marshall Islands", dialCode: "+692", flag: "https://flagcdn.com/w40/mh.png" },
    { code: "kp", name: "North Korea", dialCode: "+850", flag: "https://flagcdn.com/w40/kp.png" },
    { code: "hk", name: "Hong Kong", dialCode: "+852", flag: "https://flagcdn.com/w40/hk.png" },
    { code: "mo", name: "Macau", dialCode: "+853", flag: "https://flagcdn.com/w40/mo.png" },
    { code: "tw", name: "Taiwan", dialCode: "+886", flag: "https://flagcdn.com/w40/tw.png" },
    { code: "kh", name: "Cambodia", dialCode: "+855", flag: "https://flagcdn.com/w40/kh.png" },
    { code: "la", name: "Laos", dialCode: "+856", flag: "https://flagcdn.com/w40/la.png" },
    { code: "bd", name: "Bangladesh", dialCode: "+880", flag: "https://flagcdn.com/w40/bd.png" },
    { code: "np", name: "Nepal", dialCode: "+977", flag: "https://flagcdn.com/w40/np.png" },
    { code: "bt", name: "Bhutan", dialCode: "+975", flag: "https://flagcdn.com/w40/bt.png" },
    { code: "mv", name: "Maldives", dialCode: "+960", flag: "https://flagcdn.com/w40/mv.png" },
    { code: "lk", name: "Sri Lanka", dialCode: "+94", flag: "https://flagcdn.com/w40/lk.png" },
    { code: "pk", name: "Pakistan", dialCode: "+92", flag: "https://flagcdn.com/w40/pk.png" },
    { code: "af", name: "Afghanistan", dialCode: "+93", flag: "https://flagcdn.com/w40/af.png" },
    { code: "tj", name: "Tajikistan", dialCode: "+992", flag: "https://flagcdn.com/w40/tj.png" },
    { code: "tm", name: "Turkmenistan", dialCode: "+993", flag: "https://flagcdn.com/w40/tm.png" },
    { code: "uz", name: "Uzbekistan", dialCode: "+998", flag: "https://flagcdn.com/w40/uz.png" },
    { code: "kg", name: "Kyrgyzstan", dialCode: "+996", flag: "https://flagcdn.com/w40/kg.png" },
    { code: "kz", name: "Kazakhstan", dialCode: "+7", flag: "https://flagcdn.com/w40/kz.png" },
    { code: "mn", name: "Mongolia", dialCode: "+976", flag: "https://flagcdn.com/w40/mn.png" },
    { code: "ir", name: "Iran", dialCode: "+98", flag: "https://flagcdn.com/w40/ir.png" },
    { code: "iq", name: "Iraq", dialCode: "+964", flag: "https://flagcdn.com/w40/iq.png" },
    { code: "sy", name: "Syria", dialCode: "+963", flag: "https://flagcdn.com/w40/sy.png" },
    { code: "lb", name: "Lebanon", dialCode: "+961", flag: "https://flagcdn.com/w40/lb.png" },
    { code: "jo", name: "Jordan", dialCode: "+962", flag: "https://flagcdn.com/w40/jo.png" },
    { code: "il", name: "Israel", dialCode: "+972", flag: "https://flagcdn.com/w40/il.png" },
    { code: "ps", name: "Palestine", dialCode: "+970", flag: "https://flagcdn.com/w40/ps.png" },
    { code: "ye", name: "Yemen", dialCode: "+967", flag: "https://flagcdn.com/w40/ye.png" },
    { code: "om", name: "Oman", dialCode: "+968", flag: "https://flagcdn.com/w40/om.png" },
    { code: "ae", name: "United Arab Emirates", dialCode: "+971", flag: "https://flagcdn.com/w40/ae.png" },
    { code: "qa", name: "Qatar", dialCode: "+974", flag: "https://flagcdn.com/w40/qa.png" },
    { code: "bh", name: "Bahrain", dialCode: "+973", flag: "https://flagcdn.com/w40/bh.png" },
    { code: "kw", name: "Kuwait", dialCode: "+965", flag: "https://flagcdn.com/w40/kw.png" },
    { code: "cy", name: "Cyprus", dialCode: "+357", flag: "https://flagcdn.com/w40/cy.png" },
    { code: "am", name: "Armenia", dialCode: "+374", flag: "https://flagcdn.com/w40/am.png" },
    { code: "az", name: "Azerbaijan", dialCode: "+994", flag: "https://flagcdn.com/w40/az.png" },
    { code: "ge", name: "Georgia", dialCode: "+995", flag: "https://flagcdn.com/w40/ge.png" },
    { code: "mt", name: "Malta", dialCode: "+356", flag: "https://flagcdn.com/w40/mt.png" },
    { code: "is", name: "Iceland", dialCode: "+354", flag: "https://flagcdn.com/w40/is.png" },
    { code: "li", name: "Liechtenstein", dialCode: "+423", flag: "https://flagcdn.com/w40/li.png" },
    { code: "mc", name: "Monaco", dialCode: "+377", flag: "https://flagcdn.com/w40/mc.png" },
    { code: "sm", name: "San Marino", dialCode: "+378", flag: "https://flagcdn.com/w40/sm.png" },
    { code: "va", name: "Vatican City", dialCode: "+39", flag: "https://flagcdn.com/w40/va.png" },
    { code: "ad", name: "Andorra", dialCode: "+376", flag: "https://flagcdn.com/w40/ad.png" },
    { code: "al", name: "Albania", dialCode: "+355", flag: "https://flagcdn.com/w40/al.png" },
    { code: "ba", name: "Bosnia and Herzegovina", dialCode: "+387", flag: "https://flagcdn.com/w40/ba.png" },
    { code: "mk", name: "North Macedonia", dialCode: "+389", flag: "https://flagcdn.com/w40/mk.png" },
    { code: "me", name: "Montenegro", dialCode: "+382", flag: "https://flagcdn.com/w40/me.png" },
    { code: "rs", name: "Serbia", dialCode: "+381", flag: "https://flagcdn.com/w40/rs.png" },
    { code: "xk", name: "Kosovo", dialCode: "+383", flag: "https://flagcdn.com/w40/xk.png" },
    { code: "ua", name: "Ukraine", dialCode: "+380", flag: "https://flagcdn.com/w40/ua.png" },
    { code: "by", name: "Belarus", dialCode: "+375", flag: "https://flagcdn.com/w40/by.png" },
    { code: "md", name: "Moldova", dialCode: "+373", flag: "https://flagcdn.com/w40/md.png" },
    { code: "sk", name: "Slovakia", dialCode: "+421", flag: "https://flagcdn.com/w40/sk.png" },
    { code: "si", name: "Slovenia", dialCode: "+386", flag: "https://flagcdn.com/w40/si.png" },
    { code: "hr", name: "Croatia", dialCode: "+385", flag: "https://flagcdn.com/w40/hr.png" },
    { code: "bg", name: "Bulgaria", dialCode: "+359", flag: "https://flagcdn.com/w40/bg.png" },
    { code: "ee", name: "Estonia", dialCode: "+372", flag: "https://flagcdn.com/w40/ee.png" },
    { code: "lv", name: "Latvia", dialCode: "+371", flag: "https://flagcdn.com/w40/lv.png" },
    { code: "lt", name: "Lithuania", dialCode: "+370", flag: "https://flagcdn.com/w40/lt.png" },
    { code: "je", name: "Jersey", dialCode: "+44", flag: "https://flagcdn.com/w40/je.png" },
    { code: "gg", name: "Guernsey", dialCode: "+44", flag: "https://flagcdn.com/w40/gg.png" },
    { code: "im", name: "Isle of Man", dialCode: "+44", flag: "https://flagcdn.com/w40/im.png" },
    { code: "fo", name: "Faroe Islands", dialCode: "+298", flag: "https://flagcdn.com/w40/fo.png" },
    { code: "gl", name: "Greenland", dialCode: "+299", flag: "https://flagcdn.com/w40/gl.png" },
    { code: "gi", name: "Gibraltar", dialCode: "+350", flag: "https://flagcdn.com/w40/gi.png" },
    { code: "lu", name: "Luxembourg", dialCode: "+352", flag: "https://flagcdn.com/w40/lu.png" },
    { code: "bz", name: "Belize", dialCode: "+501", flag: "https://flagcdn.com/w40/bz.png" },
    { code: "gt", name: "Guatemala", dialCode: "+502", flag: "https://flagcdn.com/w40/gt.png" },
    { code: "sv", name: "El Salvador", dialCode: "+503", flag: "https://flagcdn.com/w40/sv.png" },
    { code: "hn", name: "Honduras", dialCode: "+504", flag: "https://flagcdn.com/w40/hn.png" },
    { code: "ni", name: "Nicaragua", dialCode: "+505", flag: "https://flagcdn.com/w40/ni.png" },
    { code: "cr", name: "Costa Rica", dialCode: "+506", flag: "https://flagcdn.com/w40/cr.png" },
    { code: "pa", name: "Panama", dialCode: "+507", flag: "https://flagcdn.com/w40/pa.png" },
    { code: "pm", name: "Saint Pierre and Miquelon", dialCode: "+508", flag: "https://flagcdn.com/w40/pm.png" },
    { code: "ht", name: "Haiti", dialCode: "+509", flag: "https://flagcdn.com/w40/ht.png" },
    { code: "cu", name: "Cuba", dialCode: "+53", flag: "https://flagcdn.com/w40/cu.png" },
    { code: "bq", name: "Caribbean Netherlands", dialCode: "+599", flag: "https://flagcdn.com/w40/bq.png" },
    { code: "tl", name: "Timor-Leste", dialCode: "+670", flag: "https://flagcdn.com/w40/tl.png" },
    { code: "bn", name: "Brunei", dialCode: "+673", flag: "https://flagcdn.com/w40/bn.png" },
    { code: "ck", name: "Cook Islands", dialCode: "+682", flag: "https://flagcdn.com/w40/ck.png" },
    { code: "nu", name: "Niue", dialCode: "+683", flag: "https://flagcdn.com/w40/nu.png" }
],

initCountrySelector: () => {
    const countrySelector = document.getElementById('country-selector');
    const selectedCountry = countrySelector.querySelector('.selected-country');
    const countryDropdown = countrySelector.querySelector('.country-dropdown');
    const countryList = countrySelector.querySelector('.country-list');
    const countrySearch = countrySelector.querySelector('.country-search');
    const clearSearch = document.getElementById('clear-search');
    const phoneInput = document.getElementById('user-phone');
    
    // Sort countries alphabetically
    CountryManager.countries.sort((a, b) => a.name.localeCompare(b.name));
    
    function populateCountryList(filter = '') {
      countryList.innerHTML = '';
      const filteredCountries = CountryManager.countries.filter(country => 
        country.name.toLowerCase().includes(filter.toLowerCase()) || 
        country.dialCode.includes(filter)
      );
      
      filteredCountries.forEach(country => {
        const countryItem = document.createElement('div');
        countryItem.className = 'country-item';
        countryItem.innerHTML = `
          <img src="${country.flag}" srcset="${country.flag.replace('w40', 'w80')} 2x" alt="${country.name} Flag" class="country-flag">
          <div class="country-info">
            <span class="country-name">${country.name}</span>
            <span class="country-dial-code">${country.dialCode}</span>
          </div>
        `;
        
        countryItem.addEventListener('click', () => {
          CountryManager.selectCountry(country);
          countrySelector.classList.remove('open');
        });
        
        countryList.appendChild(countryItem);
      });
    }
    
    // Define selectCountry function
    CountryManager.selectCountry = (country) => {
      const flagImg = selectedCountry.querySelector('.country-flag');
      const codeSpan = selectedCountry.querySelector('.country-code');
      
      flagImg.src = country.flag;
      flagImg.srcset = `${country.flag.replace('w40', 'w80')} 2x`;
      flagImg.alt = `${country.name} Flag`;
      codeSpan.textContent = country.dialCode;
      
      // Update the phone input placeholder with the selected country code
      phoneInput.placeholder = `Phone number (${country.dialCode})`;
      
      // Store the selected country data
      countrySelector.setAttribute('data-selected-code', country.code);
      countrySelector.setAttribute('data-selected-dialcode', country.dialCode);
    };
    
    selectedCountry.addEventListener('click', (e) => {
      e.stopPropagation();
      countrySelector.classList.toggle('open');
      
      if (countrySelector.classList.contains('open')) {
        countrySearch.value = '';
        populateCountryList('');
        countrySearch.focus();
        clearSearch.style.display = countrySearch.value ? 'block' : 'none';
      }
    });
    
    countrySearch.addEventListener('input', (e) => {
      populateCountryList(e.target.value);
    });

    countrySearch.addEventListener('input', function() {
      clearSearch.style.display = this.value ? 'block' : 'none';
      populateCountryList(this.value);
    });

    clearSearch.addEventListener('click', function() {
      countrySearch.value = '';
      countrySearch.focus();
      clearSearch.style.display = 'none';
      populateCountryList('');
    });
    
    countrySearch.addEventListener('keyup', function() {
      clearSearch.style.display = this.value ? 'block' : 'none';
    });
    
    document.addEventListener('click', (e) => {
      if (!countrySelector.contains(e.target)) {
        countrySelector.classList.remove('open');
      }
    });
    
    // Set default country to United States
    const usCountry = CountryManager.countries.find(country => country.code === 'us');
    if (usCountry) {
      CountryManager.selectCountry(usCountry);
    }
    
    populateCountryList();
  }
};

const EventHandlers = {
  init: () => {
    // Form submission
    DOM_ELEMENTS.userInfoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = DOM_ELEMENTS.userNameInput.value.trim();
      const email = DOM_ELEMENTS.userEmailInput.value.trim();
      const phone = DOM_ELEMENTS.userPhoneInput.value.trim();
      const countrySelector = document.getElementById('country-selector');
      const selectedCountryCode = countrySelector.getAttribute('data-selected-code');
      const selectedCountry = CountryManager.countries.find(country => country.code === selectedCountryCode);
      
      if (!Utils.isValidEmail(email)) {
        DOM_ELEMENTS.userEmailInput.classList.add("error");
        DOM_ELEMENTS.emailError.style.display = "block";
        DOM_ELEMENTS.userEmailInput.focus();
        return;
      }
      
      if (!Utils.isValidPhone(phone)) {
        DOM_ELEMENTS.userPhoneInput.classList.add("error");
        DOM_ELEMENTS.phoneError.style.display = "block";
        DOM_ELEMENTS.userPhoneInput.focus();
        return;
      }
      
      if (!name || !email || !phone) return;
      
      const completePhoneNumber = selectedCountry.dialCode + phone;
      
      APP_STATE.userInfo = {
        name,
        email,
        phone,
        countryCode: selectedCountry.dialCode
      };
      
      fetch(API_ENDPOINTS.SAVE_USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(APP_STATE.userInfo)
      })
      .then(response => response.json())
      .then(data => {
        console.log('User data saved:', data);
      })
      .catch(error => {
        console.error('Error saving user data:', error);
      });
      
      ChatHistoryManager.loadChatHistory();
      document.body.classList.remove("show-user-form");
      document.body.classList.add("show-chatbot");
      DOM_ELEMENTS.userNameInput.value = "";
      DOM_ELEMENTS.userEmailInput.value = "";
      DOM_ELEMENTS.userPhoneInput.value = "";
      
      DOM_ELEMENTS.userEmailInput.classList.remove("error");
      DOM_ELEMENTS.emailError.style.display = "none";
      DOM_ELEMENTS.userPhoneInput.classList.remove("error");
      DOM_ELEMENTS.phoneError.style.display = "none";
      
      if (APP_STATE.chatHistory.length > 0) {
        ChatHistoryManager.renderChatHistory();
        const sortedHistory = [...APP_STATE.chatHistory].sort((a, b) => 
          (b.lastActive || 0) - (a.lastActive || 0)
        );
        ChatManager.loadChat(sortedHistory[0].id);
      } else {
        ChatManager.startNewChat();
      }
    });

    // Input validation
    DOM_ELEMENTS.userEmailInput.addEventListener("input", () => {
      const email = DOM_ELEMENTS.userEmailInput.value.trim();
      
      if (email && !Utils.isValidEmail(email)) {
        DOM_ELEMENTS.userEmailInput.classList.add("error");
        DOM_ELEMENTS.emailError.style.display = "block";
      } else {
        DOM_ELEMENTS.userEmailInput.classList.remove("error");
        DOM_ELEMENTS.emailError.style.display = "none";
      }
    });

    DOM_ELEMENTS.userPhoneInput.addEventListener("input", () => {
      const phone = DOM_ELEMENTS.userPhoneInput.value.trim();
      
      if (phone && !Utils.isValidPhone(phone)) {
        DOM_ELEMENTS.userPhoneInput.classList.add("error");
        DOM_ELEMENTS.phoneError.style.display = "block";
      } else {
        DOM_ELEMENTS.userPhoneInput.classList.remove("error");
        DOM_ELEMENTS.phoneError.style.display = "none";
      }
    });

    // Chatbot toggler
    DOM_ELEMENTS.chatbotToggler.addEventListener("click", () => {
      const isAnythingOpen = document.body.classList.contains("show-user-form") || 
                            document.body.classList.contains("show-chatbot");
      document.body.classList.toggle("show-user-form", !isAnythingOpen && !APP_STATE.userInfo);
      document.body.classList.toggle("show-chatbot", !isAnythingOpen && APP_STATE.userInfo);
    });

    DOM_ELEMENTS.closeChatbot.addEventListener("click", () => 
      document.body.classList.remove("show-chatbot")
    );

    // Message input
    DOM_ELEMENTS.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 768) {
        ChatManager.handleOutgoingMessage(e);
      }
    });

    DOM_ELEMENTS.messageInput.addEventListener("input", () => {
      const initialInputHeight = DOM_ELEMENTS.messageInput.scrollHeight;
      DOM_ELEMENTS.messageInput.style.height = `${initialInputHeight}px`;
      DOM_ELEMENTS.messageInput.style.height = `${DOM_ELEMENTS.messageInput.scrollHeight}px`;
      
      document.querySelector(".chat-form").style.borderRadius = 
        DOM_ELEMENTS.messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
    });

    // File handling
    DOM_ELEMENTS.fileInput.addEventListener("change", () => {
      const file = DOM_ELEMENTS.fileInput.files[0];
      if (!file) return;

      PDFManager.clearPdfPreview();
      DOM_ELEMENTS.fileUploadWrapper.classList.remove("file-uploaded");
      USER_DATA.file = {
        data: null,
        mime_type: null,
        uri: null,
        rawFile: null
      };

      if (file.type === "application/pdf") {
        APP_STATE.pendingPdfFile = file;
        DOM_ELEMENTS.pdfPreviewContainer.innerHTML = `
          <div class="preview-content">
            <span class="material-symbols-rounded preview-icon">picture_as_pdf</span>
            <div class="preview-info">
              <div class="preview-name">${file.name}</div>
              <div class="preview-size">${Utils.formatFileSize(file.size)}</div>
            </div>
          </div>
          <button class="material-symbols-rounded preview-cancel-btn">close</button>
        `;
        
        DOM_ELEMENTS.pdfPreviewContainer.style.display = 'flex';
        DOM_ELEMENTS.pdfPreviewContainer.querySelector(".preview-cancel-btn")
          .addEventListener("click", PDFManager.clearPdfPreview);
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          DOM_ELEMENTS.fileUploadWrapper.querySelector("img").src = e.target.result;
          DOM_ELEMENTS.fileUploadWrapper.classList.add("file-uploaded");
          const base64String = e.target.result.split(",")[1];
          USER_DATA.file = {
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
      
      DOM_ELEMENTS.fileInput.value = "";
    });

    DOM_ELEMENTS.fileCancelButton.addEventListener("click", () => {
      USER_DATA.file = {
        data: null,
        mime_type: null,
        uri: null,
        rawFile: null
      };
      DOM_ELEMENTS.fileUploadWrapper.classList.remove("file-uploaded");
    });

    // Chat form submission
    document.querySelector(".chat-form").addEventListener("submit", ChatManager.handleOutgoingMessage);
    DOM_ELEMENTS.sendMessageButton.addEventListener("click", (e) => ChatManager.handleOutgoingMessage(e));
    
    // File upload
    document.querySelector("#file-upload").addEventListener("click", () => DOM_ELEMENTS.fileInput.click());
    
    // Emoji picker
    const picker = new EmojiMart.Picker({
      theme: "light",
      skinTonePosition: "none",
      previewPosition: "none",
      onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = DOM_ELEMENTS.messageInput;
        DOM_ELEMENTS.messageInput.setRangeText(emoji.native, start, end, "end");
        DOM_ELEMENTS.messageInput.focus();
        DOM_ELEMENTS.messageInput.dispatchEvent(new Event("input"));
      },
      onClickOutside: (e) => {
        if (e.target.id !== "emoji-picker") {
          document.body.classList.remove("show-emoji-picker");
        }
      }
    });

    document.querySelector(".chat-form").appendChild(picker);
    
    document.querySelector("#emoji-picker").addEventListener("click", (e) => {
      e.stopPropagation();
      document.body.classList.toggle("show-emoji-picker");
    });

    // Menu toggler
    const menuToggler = document.querySelector("#menu-toggler");
    const dropdownMenu = document.querySelector(".dropdown-menu");

    menuToggler.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".header-actions")) dropdownMenu.classList.remove("show");
      if (!e.target.closest("em-emoji-picker") && e.target.id !== "emoji-picker") {
        document.body.classList.remove("show-emoji-picker");
      }
    });

    // Chat history
    DOM_ELEMENTS.chatHistoryButton.addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
      document.body.classList.toggle("show-chat-history");
      ChatHistoryManager.renderChatHistory();
    });

    DOM_ELEMENTS.closeHistoryButton.addEventListener("click", () => 
      document.body.classList.remove("show-chat-history")
    );

    // Clear chat
    document.querySelector("#clear-chat").addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
      const chatToClearId = APP_STATE.currentChatId;
      const currentChat = APP_STATE.chatHistory.find(chat => chat.id === chatToClearId);
      
      if (currentChat) {
        currentChat.messages = currentChat.messages.filter(msg => 
          msg.sender === "bot" && msg.content.includes("Hey there ")
        );
      }
      
      ChatManager.clearChatMessages();
      ChatManager.createWelcomeMessage();
      ChatHistoryManager.saveChatHistory();
      ChatHistoryManager.renderChatHistory();
    });

    // New chat
    document.querySelector("#new-chat").addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
      ChatManager.startNewChat();
    });

    // Delete all history
    DOM_ELEMENTS.deleteAllHistoryButton.addEventListener("click", ChatHistoryManager.deleteAllHistory);

    // Voice assist
    DOM_ELEMENTS.voiceAssistButton.addEventListener("click", VoiceManager.toggleVoiceRecognition);
  }
};

// Initialize the application
const initApp = () => {
  // Inject history styles
  const style = document.createElement('style');
  style.innerHTML = `
    .chat-history-item-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .chat-time { font-size: 0.75rem; color: #6c757d; flex-shrink: 0; margin-left: 10px; }
    .user-message-time { font-size: 0.7rem; color: #888; text-align: right; margin-top: 5px; padding-right: 10px; }
  `;
  document.head.appendChild(style);

  // Initialize components
  VoiceManager.setupVoiceRecognition();
  CountryManager.initCountrySelector();
  EventHandlers.init();
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);