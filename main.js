// Common JavaScript for all pages

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
    
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        const languageSelect = document.getElementById('language-select');
        const languageSetting = document.getElementById('language-setting');
        
        if (languageSelect) {
            languageSelect.value = savedLanguage;
        }
        
        if (languageSetting) {
            languageSetting.value = savedLanguage;
        }
    }
});