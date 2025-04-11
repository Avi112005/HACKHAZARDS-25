document.addEventListener('DOMContentLoaded', function () {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');
    const languageSelect = document.getElementById('language-select');
    const imageUpload = document.getElementById('image-upload');
    const previewContainer = document.getElementById('image-preview-container');
    const dragDropOverlay = document.getElementById('drag-drop-overlay');
  
    let recognition;
    let isListening = false;
    let uploadedImage = null; // store image in base64
  
    function formatTime() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
  
    function addMessage(text, sender) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `message ${sender}-message`;
  
      const content = document.createElement('div');
      content.className = 'message-content';
  
      const p = document.createElement('p');
      p.textContent = text;
      content.appendChild(p);
  
      const time = document.createElement('div');
      time.className = 'message-time';
      time.textContent = formatTime();
  
      msgDiv.appendChild(content);
      msgDiv.appendChild(time);
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    function sendMessage() {
  const message = chatInput.value.trim();
  const selectedLang = languageSelect?.value || 'English';

  if (!message && !uploadedImage) return;

  // Show user message + optional image preview
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message user-message';
  const content = document.createElement('div');
  content.className = 'message-content';

  if (message) {
    const p = document.createElement('p');
    p.textContent = message;
    content.appendChild(p);
  }

  if (uploadedImage) {
    const img = document.createElement('img');
    img.src = uploadedImage;
    img.className = 'message-image';
    content.appendChild(img);
  }

  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = formatTime();

  msgDiv.appendChild(content);
  msgDiv.appendChild(time);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Build prompt for Groq
  const finalPrompt = uploadedImage
    ? message
      ? `The user uploaded an image and wrote: "${message}". Based on that, describe what the image could contain.`
      : "The user uploaded an image. Please imagine and describe what could be in the image creatively."
    : message;

  // Call /api/chat only
  fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: finalPrompt, language: selectedLang })
  })
    .then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      addMessage(data.reply || "🤖 No response from Groq.", 'bot');
    })
    .catch(err => {
      console.error('Chat API error:', err);
      addMessage("⚠️ Something went wrong talking to GroqMate.", 'bot');
    });

  // Reset input and image
  chatInput.value = '';
  uploadedImage = null;
  previewContainer.innerHTML = '';
  previewContainer.style.display = 'none';
}
  
    function handleFileUpload(files) {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function (e) {
            uploadedImage = e.target.result;
  
            // Show preview
            previewContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = uploadedImage;
            img.className = 'message-image';
            previewContainer.appendChild(img);
            previewContainer.style.display = 'flex';
          };
          reader.readAsDataURL(file);
        }
      }
    }
  
    // === Event Listeners ===
  
    if (sendButton) sendButton.addEventListener('click', sendMessage);
  
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  
    if (micButton) {
      micButton.addEventListener('click', () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Your browser doesn't support voice input.");
  
        if (!recognition) {
          recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = false;
  
          recognition.onresult = event => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
          };
  
          recognition.onerror = e => console.error('Speech error:', e.error);
          recognition.onend = () => {
            isListening = false;
            micButton.classList.remove('active');
          };
        }
  
        if (!isListening) {
          recognition.start();
          isListening = true;
          micButton.classList.add('active');
        } else {
          recognition.stop();
        }
      });
    }
  
    if (imageUpload) {
      imageUpload.addEventListener('change', e => {
        handleFileUpload(e.target.files);
      });
    }
  
    document.addEventListener('dragover', e => {
      e.preventDefault();
      dragDropOverlay.classList.add('active');
    });
  
    document.addEventListener('dragleave', e => {
      if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
        dragDropOverlay.classList.remove('active');
      }
    });
  
    dragDropOverlay.addEventListener('dragover', e => e.preventDefault());
  
    dragDropOverlay.addEventListener('drop', e => {
      e.preventDefault();
      dragDropOverlay.classList.remove('active');
      if (e.dataTransfer.files) {
        handleFileUpload(e.dataTransfer.files);
      }
    });
  });
  