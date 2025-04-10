document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');
    const imageUpload = document.getElementById('image-upload');
    const previewContainer = document.getElementById('image-preview-container');
    const dragDropOverlay = document.getElementById('drag-drop-overlay');
    
    // State
    let isListening = false;
    let recognition = null;
    let uploadedImages = [];
    
    // Initialize Web Speech API
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onresult = function(event) {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                
                chatInput.value = transcript;
                
                // Auto resize the textarea
                autoResizeTextarea(chatInput);
            };
            
            recognition.onend = function() {
                isListening = false;
                micButton.classList.remove('active');
                micButton.querySelector('i').className = 'fas fa-microphone';
            };
        } else {
            micButton.style.display = 'none';
            alert("Your browser doesn't support speech recognition. Try Chrome or Edge.");
        }
    }
    
    // Toggle speech recognition
    function toggleSpeechRecognition() {
        // Check if voice input is enabled in settings
        const voiceInputEnabled = localStorage.getItem('voiceInput') !== 'false';
        
        if (!voiceInputEnabled) {
            alert('Voice input is disabled in settings. Please enable it to use this feature.');
            return;
        }
        
        if (!recognition) {
            initSpeechRecognition();
        }
        
        if (!isListening) {
            recognition.start();
            isListening = true;
            micButton.classList.add('active');
            micButton.querySelector('i').className = 'fas fa-microphone-slash';
        } else {
            recognition.stop();
            isListening = false;
            micButton.classList.remove('active');
            micButton.querySelector('i').className = 'fas fa-microphone';
        }
    }
    
    // Auto resize textarea
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
    
    // Format current time
    function formatTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        
        return `${hours}:${minutes} ${ampm}`;
    }
    
    // Add a message to the chat
    function addMessage(content, sender, images = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = content;
        messageContent.appendChild(paragraph);
        
        // Add images if any
        if (images && images.length > 0) {
            images.forEach(imageUrl => {
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = 'Shared image';
                img.className = 'message-image';
                messageContent.appendChild(img);
            });
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = formatTime();
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Handle file upload
    function handleFileUpload(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const imageUrl = e.target.result;
                    uploadedImages.push(imageUrl);
                    
                    // Create preview
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'image-preview';
                    
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = 'Preview';
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.innerHTML = '×';
                    removeBtn.addEventListener('click', function() {
                        const index = uploadedImages.indexOf(imageUrl);
                        if (index > -1) {
                            uploadedImages.splice(index, 1);
                        }
                        previewDiv.remove();
                        
                        if (uploadedImages.length === 0) {
                            previewContainer.style.display = 'none';
                        }
                    });
                    
                    previewDiv.appendChild(img);
                    previewDiv.appendChild(removeBtn);
                    previewContainer.appendChild(previewDiv);
                    previewContainer.style.display = 'flex';
                };
                
                reader.readAsDataURL(file);
            }
        }
    }
    
    // Send message
    function sendMessage() {
        const message = chatInput.value.trim();
        
        if (message === '' && uploadedImages.length === 0) {
            return;
        }
        
        // Add user message
        addMessage(message, 'user', uploadedImages);
        
        // Clear input and images
        chatInput.value = '';
        chatInput.style.height = 'auto';
        uploadedImages = [];
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        
        // Simulate bot response (in a real app, you'd call an API here)
        setTimeout(() => {
            let botResponse = "I'm processing your request. This is a simulated response from GroqMate.";
            
            // Simple responses for demo purposes
            if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
                botResponse = "Hello! How can I assist you today?";
            } else if (message.toLowerCase().includes('help')) {
                botResponse = "I'm here to help! You can ask me questions, request information, or just chat.";
            } else if (message.toLowerCase().includes('weather')) {
                botResponse = "I'm sorry, I don't have access to real-time weather data in this demo. In a real implementation, I would connect to a weather API to provide you with accurate forecasts.";
            } else if (message.toLowerCase().includes('thank')) {
                botResponse = "You're welcome! Is there anything else I can help you with?";
            }
            
            addMessage(botResponse, 'bot');
        }, 1000);
    }
    
    // Event Listeners
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        chatInput.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }
    
    if (micButton) {
        micButton.addEventListener('click', toggleSpeechRecognition);
    }
    
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            handleFileUpload(e.target.files);
        });
    }
    
    // Drag and drop functionality
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        dragDropOverlay.classList.add('active');
    });
    
    document.addEventListener('dragleave', function(e) {
        if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
            dragDropOverlay.classList.remove('active');
        }
    });
    
    dragDropOverlay.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    dragDropOverlay.addEventListener('drop', function(e) {
        e.preventDefault();
        dragDropOverlay.classList.remove('active');
        
        if (e.dataTransfer.files) {
            handleFileUpload(e.dataTransfer.files);
        }
    });
    
    // Initialize
    initSpeechRecognition();
    
    // Load chat history from localStorage
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    if (chatHistory.length > 0) {
        chatHistory.forEach(msg => {
            addMessage(msg.content, msg.sender, msg.images || []);
        });
    }
});