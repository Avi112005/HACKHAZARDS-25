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
  let uploadedImage = null;

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

    const html = marked.parse(text);
    const p = document.createElement('div');
    p.innerHTML = html;
    content.appendChild(p);

    Prism.highlightAllUnder(content);
    const codeBlocks = content.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
      const copyButton = document.createElement('button');
      copyButton.innerHTML = '<i class="fas fa-copy"></i>';
      copyButton.className = 'copy-button';
      copyButton.addEventListener('click', () => {
        const code = block.textContent;
        navigator.clipboard.writeText(code).then(() => {
          alert('Code copied to clipboard!');
        }).catch(err => {
          console.error('Error copying code: ', err);
        });
      });

      const preBlock = block.parentElement;
      preBlock.style.position = 'relative';
      preBlock.appendChild(copyButton);
    });

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

    const userMsg = document.createElement('div');
    userMsg.className = 'message user-message';
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

    userMsg.appendChild(content);
    userMsg.appendChild(time);
    chatMessages.appendChild(userMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (uploadedImage) {
      fetch('http://localhost:5000/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: uploadedImage, message })
      })
        .then(res => res.json())
        .then(data => addMessage(data.reply || '🤖 No response from Vision API.', 'bot'))
        .catch(err => {
          console.error('Vision API error:', err);
          addMessage('⚠️ Vision processing failed.', 'bot');
        });
    } else {
      fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language: selectedLang })
      })
        .then(res => res.json())
        .then(data => addMessage(data.reply || '🤖 No response from Groq.', 'bot'))
        .catch(err => {
          console.error('Groq API error:', err);
          addMessage('⚠️ Chat failed.', 'bot');
        });
    }

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
      if (!SpeechRecognition) return alert("Voice input not supported.");

      if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
      
        recognition.onresult = event => {
          chatInput.value = event.results[0][0].transcript;
        };

        recognition.onerror = e => {
          console.error('Speech error:', e.error);
          if (e.error === 'network') {
            alert("Network error detected. Please check your internet connection.");
          } else if (e.error === 'not-allowed') {
            alert("Microphone access is denied. Please enable it in your browser settings.");
          } else if (e.error === 'service-not-available') {
            alert("Speech service is unavailable. Try again later.");
          } else if (e.error === 'no-speech' || e.error === 'audio-capture') {
            console.warn("Minor speech recognition error:", e.error);
          } else {
            alert("Speech recognition error: " + e.error);
          }
        };

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
    imageUpload.addEventListener('change', e => handleFileUpload(e.target.files));
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
