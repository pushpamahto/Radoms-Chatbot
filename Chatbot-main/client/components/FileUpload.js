import { formatFileSize } from '../utils/formatters.js';
import { startPdfUploadProcess } from '../utils/api.js';

export class FileUpload {
    constructor(userData, chatBody, currentChat, saveChatHistory, renderChatHistory) {
        this.userData = userData;
        this.chatBody = chatBody;
        this.currentChat = currentChat;
        this.saveChatHistory = saveChatHistory;
        this.renderChatHistory = renderChatHistory;
        
        this.fileInput = document.querySelector("#file-input");
        this.pdfPreviewContainer = document.querySelector("#pdf-preview");
        this.fileUploadWrapper = document.querySelector(".file-upload-wrapper");
        this.fileCancelButton = document.querySelector("#file-cancel");
        
        this.pendingPdfFile = null;
        this.activePdfUploads = {};
    }

    setupEventListeners() {
        this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
        this.fileCancelButton.addEventListener("click", () => this.clearFile());
        document.querySelector("#file-upload").addEventListener("click", () => this.fileInput.click());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.clearPdfPreview();
        this.fileUploadWrapper.classList.remove("file-uploaded");
        this.userData.file = {
            data: null,
            mime_type: null,
            uri: null,
            rawFile: null
        };

        if (file.type === "application/pdf") {
            this.pendingPdfFile = file;
            this.pdfPreviewContainer.innerHTML = `
                <div class="preview-content">
                    <span class="material-symbols-rounded preview-icon">picture_as_pdf</span>
                    <div class="preview-info">
                        <div class="preview-name">${file.name}</div>
                        <div class="preview-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="material-symbols-rounded preview-cancel-btn">close</button>
            `;
            this.pdfPreviewContainer.style.display = 'flex';
            this.pdfPreviewContainer.querySelector(".preview-cancel-btn").addEventListener("click", () => this.clearPdfPreview());

        } else if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.fileUploadWrapper.querySelector("img").src = e.target.result;
                this.fileUploadWrapper.classList.add("file-uploaded");
                const base64String = e.target.result.split(",")[1];
                this.userData.file = {
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
        this.fileInput.value = "";
    }

    clearPdfPreview() {
        this.pendingPdfFile = null;
        this.pdfPreviewContainer.innerHTML = '';
        this.pdfPreviewContainer.style.display = 'none';
        this.fileInput.value = '';
    }

    clearFile() {
        this.userData.file = {
            data: null,
            mime_type: null,
            uri: null,
            rawFile: null
        };
        this.fileUploadWrapper.classList.remove("file-uploaded");
    }

    createPdfUploadElement(messageId, fileName, fileSize, isCompleted = false, fileUri = null) {
        const formattedSize = formatFileSize(fileSize);
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
    }

    async handlePdfUpload(userQuery) {
        const messageId = `msg_${Date.now()}`;
        const messageData = {
            id: messageId,
            sender: "user",
            type: "pdf",
            content: userQuery,
            fileName: this.pendingPdfFile.name,
            fileSize: this.pendingPdfFile.size,
            fileUri: null,
            timestamp: Date.now()
        };
        
        this.currentChat.messages.push(messageData);

        const pdfUploadHTML = this.createPdfUploadElement(messageId, this.pendingPdfFile.name, this.pendingPdfFile.size);
        const messageHTML = `
            ${userQuery ? `<div class="message-text">${userQuery}</div>` : ''}
            ${pdfUploadHTML}
            <div class="user-message-time">${this.formatMessageTime(Date.now())}</div>`;

        const outgoingMessageDiv = this.createMessageElement(messageHTML, "user-message");
        this.chatBody.appendChild(outgoingMessageDiv);

        await startPdfUploadProcess(
            this.pendingPdfFile, 
            messageId, 
            userQuery, 
            this.userData, 
            this.chatBody, 
            this.currentChat, 
            this.saveChatHistory
        );

        this.pendingPdfFile = null;
        this.pdfPreviewContainer.style.display = 'none';
        this.pdfPreviewContainer.innerHTML = '';
        
        return true;
    }

    createMessageElement(content, ...classes) {
        const div = document.createElement("div");
        div.classList.add("message", ...classes);
        div.innerHTML = content;
        return div;
    }

    formatMessageTime(timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
}