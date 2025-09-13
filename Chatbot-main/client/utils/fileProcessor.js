import { formatFileSize } from './formatters.js';

export const createPdfUploadElement = (messageId, fileName, fileSize, isCompleted = false, fileUri = null) => {
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
};

export const renderPdfMessageFromHistory = (msg, formatMessageTime) => {
    const content = `
        ${msg.content ? `<div class="message-text">${msg.content}</div>` : ''}
        ${createPdfUploadElement(msg.id, msg.fileName, msg.fileSize, true, msg.fileUri)}
        <div class="user-message-time">${formatMessageTime(msg.timestamp)}</div>`;
    
    return content;
};