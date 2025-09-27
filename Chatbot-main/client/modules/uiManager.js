

import {
    chatBody,
    messageInput,
    pdfPreviewContainer,
    fileUploadWrapper,
    fileInput,
    fileCancelButton
} from './domElements.js';
import {
    formatFileSize,
    formatMessageTime
} from './utils.js';
import {
    MAX_QUESTIONS_PER_DAY
} from './config.js';

export const initialInputHeight = messageInput.scrollHeight;

export const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

export const showLimitExceededMessage = () => {
    const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024"><path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h..." fill="#fff"></path></svg>
    <div class="message-text" id="limit-exceed">
        You've reached your daily limit of ${MAX_QUESTIONS_PER_DAY} questions.
        Please come back tomorrow to ask more questions.
    </div>`;
    const limitMessageDiv = createMessageElement(messageContent, "bot-message");
    chatBody.appendChild(limitMessageDiv);
    chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
    });
};

export const showQuestionWarning = () => {
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
};

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

export const renderPdfMessageFromHistory = (msg) => {
    const content = `
        ${msg.content ? `<div class="message-text">${msg.content}</div>` : ''}
        ${createPdfUploadElement(msg.id, msg.fileName, msg.fileSize, true, msg.fileUri)}
        <div class="user-message-time">${formatMessageTime(msg.timestamp)}</div>`;
    return createMessageElement(content, "user-message");
};

export const createImagePreviewElement = (imageSrc) => {
    const previewHtml = `
        <div class="image-preview-container">
            <img src="${imageSrc}" alt="Selected Image" class="image-preview-circle"/>
            <span class="cancel-image material-symbols-rounded" id="file-cancel-preview">cancel</span>
        </div>`;
    pdfPreviewContainer.innerHTML = previewHtml;
    pdfPreviewContainer.style.display = 'flex';
    fileUploadWrapper.classList.add("file-uploaded");

    const cancelButton = pdfPreviewContainer.querySelector("#file-cancel-preview");
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            clearImagePreview();
        });
    }
};

/**
 * ## FIX APPLIED HERE ##
 * Correctly resets the image preview UI and ensures the 'attach_file' icon is clickable.
 * This function is called after an image message is sent or canceled.
 */
export const clearImagePreview = () => {
    // 1. Remove the class that indicates a file is uploaded.
    fileUploadWrapper.classList.remove("file-uploaded");
    
    // 2. Restore the original HTML, bringing back the "attach_file" icon as a clickable label.
    fileUploadWrapper.innerHTML = `<label for="file-input" id="file-upload" class="material-symbols-rounded">attach_file</label>`;
    
    // 3. Re-attach the click listener to the newly created label element.
    //    This is crucial because replacing innerHTML removes old event listeners.
    const newFileUploadLabel = fileUploadWrapper.querySelector("#file-upload");
    if (newFileUploadLabel) {
        newFileUploadLabel.addEventListener("click", () => fileInput.click());
    }

    // 4. Clear any leftover content from the separate PDF preview container (if any was used).
    pdfPreviewContainer.innerHTML = '';
    pdfPreviewContainer.style.display = 'none';

    // 5. Reset the file input value so the same file can be chosen again.
    fileInput.value = '';
};

export const injectHistoryStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-history-item-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .chat-time { font-size: 0.75rem; color: #6c757d; flex-shrink: 0; margin-left: 10px; }
        .user-message-time { font-size: 0.7rem; color: #888; text-align: right; margin-top: 5px; padding-right: 10px; }
        .image-preview-container {
            position: relative;
            display: inline-block;
            margin-top: 10px;
        }
        .image-preview-container .image-preview-circle {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #fff;
        }
        .image-preview-container .cancel-image {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: #fff;
            color: #ff0000;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            visibility: hidden;
            opacity: 0;
            transition: visibility 0s, opacity 0.3s linear;
        }
        .image-preview-container:hover .cancel-image {
            visibility: visible;
            opacity: 1;
        }
        
    `;
    document.head.appendChild(style);
};

export const clearPdfPreview = (state) => {
    state.pendingPdfFile = null;
    pdfPreviewContainer.innerHTML = '';
    pdfPreviewContainer.style.display = 'none';
    fileInput.value = '';
};

// Country data - all countries with flags and dial codes
const countries = [
    { code: "us", name: "United States", dialCode: "+1", flag: "https://flagcdn.com/w40/us.png" },
    
    { code: "gt", name: "Guatemala", dialCode: "+502", flag: "https://flagcdn.com/w40/gt.png" },
    { code: "sv", name: "El Salvador", dialCode: "+503", flag: "https://flagcdn.com/w40/sv.png" },
    { code: "hn", name: "Honduras", dialCode: "+504", flag: "https://flagcdn.com/w40/hn.png" },
    { code: "ni", name: "Nicaragua", dialCode: "+505", flag: "https://flagcdn.com/w40/ni.png" },
    { code: "cr", name: "Costa Rica", dialCode: "+506", flag: "https://flagcdn.com/w40/cr.png" },
    
    { code: "ck", name: "Cook Islands", dialCode: "+682", flag: "https://flagcdn.com/w40/ck.png" },
    { code: "nu", name: "Niue", dialCode: "+683", flag: "https://flagcdn.com/w40/nu.png" }
];

// Sort countries alphabetically by name
countries.sort((a, b) => a.name.localeCompare(b.name));

// Initialize country selector
export function initCountrySelector() {
    const countrySelector = document.getElementById('country-selector');
    const selectedCountry = countrySelector.querySelector('.selected-country');
    const countryDropdown = countrySelector.querySelector('.country-dropdown');
    const countryList = countrySelector.querySelector('.country-list');
    const countrySearch = countrySelector.querySelector('.country-search');
    const phoneInput = document.getElementById('user-phone');
    const clearSearch = document.getElementById('clear-search');

    function populateCountryList(filter = '') {
        countryList.innerHTML = '';
        const filteredCountries = countries.filter(country =>
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
                selectCountry(country);
                countrySelector.classList.remove('open');
            });
            countryList.appendChild(countryItem);
        });
    }

    function selectCountry(country) {
        const flagImg = selectedCountry.querySelector('.country-flag');
        const codeSpan = selectedCountry.querySelector('.country-code');
        flagImg.src = country.flag;
        flagImg.srcset = `${country.flag.replace('w40', 'w80')} 2x`;
        flagImg.alt = `${country.name} Flag`;
        codeSpan.textContent = country.dialCode;
        countrySelector.setAttribute('data-selected-code', country.code);
    }

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

    countrySearch.addEventListener('input', function(e) {
        clearSearch.style.display = this.value ? 'block' : 'none';
        populateCountryList(e.target.value);
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

    const usCountry = countries.find(country => country.code === 'us');
    if (usCountry) {
        selectCountry(usCountry);
    }
    populateCountryList();
}