// Livegenda - Common Script
// Utility functions and common functionality

// Dark mode toggle (if needed in the future)
function toggleDarkMode() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('livegenda_theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('livegenda_theme', 'dark');
    }
}

// Initialize theme from localStorage
function initTheme() {
    const theme = localStorage.getItem('livegenda_theme');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        // Default to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }
    }
}

// Call on page load
initTheme();

// Form validation helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show notification (simple alert for now, can be replaced with toast)
function showNotification(message, type = 'info') {
    // In production, use a proper notification library
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

// Format date helper
function formatDate(date) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(date).toLocaleDateString('pt-BR', options);
}

// Format time helper
function formatTime(time) {
    return time;
}

// Check authentication status
function isAuthenticated() {
    const user = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
    return user.loggedIn === true;
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('livegenda_user') || '{}');
}

// Logout helper
function performLogout() {
    localStorage.removeItem('livegenda_user');
    window.location.href = 'index.html';
}
