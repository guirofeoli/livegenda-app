// Livegenda - Login Script
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.querySelector('input[type="password"]');
    const visibilityToggle = document.querySelector('.material-symbols-outlined');
    
    // Toggle password visibility
    if (visibilityToggle) {
        visibilityToggle.parentElement.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                visibilityToggle.textContent = 'visibility_off';
            } else {
                passwordInput.type = 'password';
                visibilityToggle.textContent = 'visibility';
            }
        });
    }
    
    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.querySelector('input[type="email"]').value;
            const password = passwordInput.value;
            
            // Basic validation
            if (!email || !password) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, insira um e-mail válido.');
                return;
            }
            
            // Simulate login (in production, this would call an API)
            console.log('Login attempt:', { email, password: '***' });
            
            // Store user info (temporary, for demo purposes)
            localStorage.setItem('livegenda_user', JSON.stringify({
                email: email,
                loggedIn: true,
                loginTime: new Date().toISOString()
            }));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        });
    }
    
    // Social login buttons (placeholder functionality)
    const socialButtons = document.querySelectorAll('button[class*="gap-3"]');
    socialButtons.forEach(button => {
        if (button.id !== 'loginBtn') {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Login social em desenvolvimento. Use o formulário de login por enquanto.');
            });
        }
    });
});
