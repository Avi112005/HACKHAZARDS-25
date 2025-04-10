document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const voiceInputToggle = document.getElementById('voice-input-toggle');
    const voiceOutputToggle = document.getElementById('voice-output-toggle');
    const languageSetting = document.getElementById('language-setting');
    const clearHistoryBtn = document.getElementById('clear-history');
    
    // Load saved settings
    function loadSettings() {
        // Dark mode
        const darkMode = localStorage.getItem('theme') === 'dark';
        if (darkModeToggle) {
            darkModeToggle.checked = darkMode;
        }
        
        // Voice input
        const voiceInput = localStorage.getItem('voiceInput') !== 'false';
        if (voiceInputToggle) {
            voiceInputToggle.checked = voiceInput;
        }
        
        // Voice output
        const voiceOutput = localStorage.getItem('voiceOutput') === 'true';
        if (voiceOutputToggle) {
            voiceOutputToggle.checked = voiceOutput;
        }
        
        // Language
        const language = localStorage.getItem('language') || 'en';
        if (languageSetting) {
            languageSetting.value = language;
        }
    }
    
    // Event listeners
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
    
    if (voiceInputToggle) {
        voiceInputToggle.addEventListener('change', function() {
            localStorage.setItem('voiceInput', this.checked);
        });
    }
    
    if (voiceOutputToggle) {
        voiceOutputToggle.addEventListener('change', function() {
            localStorage.setItem('voiceOutput', this.checked);
        });
    }
    
    if (languageSetting) {
        languageSetting.addEventListener('change', function() {
            localStorage.setItem('language', this.value);
            
            // Update language selector in other pages
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.value = this.value;
            }
        });
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your chat history? This action cannot be undone.')) {
                localStorage.removeItem('chatHistory');
                alert('Chat history cleared successfully.');
            }
        });
    }
    
    // Initialize settings
    loadSettings();
});