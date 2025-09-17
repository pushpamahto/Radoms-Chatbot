
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


export const clearImagePreview = () => {
    
    fileUploadWrapper.classList.remove("file-uploaded");
    
   
    fileUploadWrapper.innerHTML = `<label for="file-input" id="file-upload" class="material-symbols-rounded">attach_file</label>`;
    
    const newFileUploadLabel = fileUploadWrapper.querySelector("#file-upload");
    if (newFileUploadLabel) {
        newFileUploadLabel.addEventListener("click", () => fileInput.click());
    }

    pdfPreviewContainer.innerHTML = '';
    pdfPreviewContainer.style.display = 'none';

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
const countries = 
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