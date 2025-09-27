
// api.js
import {
  OPENROUTER_API_URL,
  FILE_API_BASE_URL,
  API_KEY,
  radomsInfo,
  SAVE_USER_URL
} from './config.js';
import {
  chatBody
} from './domElements.js';

export const saveUserData = (userInfo) => {
  fetch(SAVE_USER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userInfo)
  })
    .then(response => response.json())
    .then(data => {
      console.log('User data saved:', data);
    })
    .catch(error => {
      console.error('Error saving user data:', error);
    });
};

// Helper function to format the text as HTML
const formatTextAsHtml = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/#+\s*(.*?)(?:\n|$)/g, '<strong>$1</strong>')
    .replace(/- /g, '• ')
    .replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre>$1</pre>')
    .replace(/\`(.*?)\`/g, '<code>$1</code>');
};

const radomsKeywords = [
  'radoms',
  'digital',
  'company',
  'services',
  'contact',
  'email',
  'website',
  'portfolio',
  'technologies',
  'consultation',
  'project',
  'develop',
  'app',
  'softwaare',
  'digital marketing',
  'ui/ux',
  'it company'
];

export const generateBotResponse = async (incomingMessageDiv, state, callbacks) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");
  const messages = [];
  const userMessageText = state.userData.message.toLowerCase();

  // Check if the user's message contains keywords related to Radoms Digital
  const isRadomsQuestion = radomsKeywords.some(keyword => userMessageText.includes(keyword));

  // Add system message for context, conditionally adding Radoms info
  if (isRadomsQuestion) {
    messages.push({
      role: "system",
      content: `You are a customer support chatbot for Radoms Digital. Below is information about the company. Use this information to answer any questions about Radoms Digital, being as concise as possible and only providing the information asked for.

${radomsInfo}

For any questions about Radoms Digital, respond based on the information above. For other questions, respond normally and do not include any information about Radoms Digital.`
    });
  } else {
    messages.push({
      role: "system",
      content: `You are a helpful and concise AI assistant. Answer the user's question directly without adding any unrelated information or details about a specific company.`
    });
  }

  const userMessageContent = [];

  // Add user's text message if it exists
  if (state.userData.message) {
    userMessageContent.push({
      type: "text",
      text: state.userData.message
    });
  }

  // Add image content if a file exists
  if (state.userData.file.uri) {
    userMessageContent.push({
      type: "image_url",
      image_url: {
        url: state.userData.file.uri
      }
    });
  } else if (state.userData.file.data) {
    userMessageContent.push({
      type: "image_url",
      image_url: {
        url: `data:${state.userData.file.mime_type};base64,${state.userData.file.data}`
      }
    });
  }

  // Add the user message to the messages array
  messages.push({
    role: "user",
    content: userMessageContent
  });

  const requestBody = {
    // Use a more stable, general-purpose model
    model: "mistralai/mixtral-8x7b-instruct",
    // model:"google/gemma-3-27b-it:free",
    messages: messages,
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify(requestBody)
  };

  let botResponseText = "";
  let formattedResponse = "";
  try {
    const response = await fetch(OPENROUTER_API_URL, requestOptions);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || `API Error: ${response.status}`);
    }
    const data = await response.json();
    let rawText = data.choices[0]?.message?.content || "Sorry, I couldn't process that.";

    // Now the raw text is formatted
    formattedResponse = formatTextAsHtml(rawText);
    botResponseText = rawText;

    messageElement.innerHTML = formattedResponse;
  } catch (error) {
    console.error("API Error:", error);
    botResponseText = `Oops! Something went wrong: ${error.message}. Please check your API key and try again.`;
    formattedResponse = botResponseText;
    messageElement.innerText = botResponseText;
    messageElement.style.color = "#ff0000";
  } finally {
    callbacks.onComplete(botResponseText, formattedResponse);
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: "smooth"
    });
  }
};

export const startPdfUploadProcess = async (file, messageId, userQuery, state, callbacks) => {
  const ui = {
    container: document.getElementById(`pdf-${messageId}`),
    progressBar: document.querySelector(`#pdf-${messageId} .progress`),
    statusText: document.querySelector(`#pdf-${messageId} .upload-status`),
  };

  chatBody.scrollTo({
    top: chatBody.scrollHeight,
    behavior: "smooth"
  });

  try {
    const startResponse = await fetch(`${FILE_API_BASE_URL}/upload/v1beta/files?key=${API_KEY}`, {
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
    state.activePdfUploads[messageId] = xhr;
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        ui.progressBar.style.width = percentComplete + '%';
        ui.statusText.textContent = `${Math.round(percentComplete)}% uploaded`;
        chatBody.scrollTo({
          top: chatBody.scrollHeight,
          behavior: "smooth"
        });
      }
    };

    xhr.onload = () => {
      delete state.activePdfUploads[messageId];
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const fileUri = response.file.uri;

        ui.container.classList.add('completed');
        ui.progressBar.parentElement.style.display = 'none';
        ui.statusText.innerHTML = `<span class="material-symbols-rounded completed-check">check_circle</span> Completed`;
        callbacks.onSuccess(fileUri, userQuery, file);

      } else {
        throw new Error(`Upload failed: ${xhr.statusText}`);
      }
    };

    xhr.onerror = () => {
      delete state.activePdfUploads[messageId];
      ui.statusText.textContent = "Upload failed.";
      ui.statusText.style.color = "#d93025";
      chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
      });
    };
    xhr.send(file);
  } catch (error) {
    console.error("PDF Upload Error:", error);
    if (ui.statusText) {
      ui.statusText.textContent = "Error!";
      ui.statusText.style.color = "#d93025";
      chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
      });
    }
  }
};

