// Livegenda - Dashboard Script
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
    
    if (!user.loggedIn) {
        // Redirect to login if not logged in
        window.location.href = 'index.html';
        return;
    }
    
    // User menu functionality
    const userMenuBtn = document.getElementById('userMenuBtn');
    
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', function() {
            const options = [
                { label: 'Configurações', action: () => window.location.href = 'configuracoes.html' },
                { label: 'Planos', action: () => window.location.href = 'planos.html' },
                { label: 'Sair', action: logout }
            ];
            
            // Create simple menu (in production, use a proper dropdown component)
            const menu = confirm('Deseja sair da conta?');
            if (menu) {
                logout();
            }
        });
    }
    
    // Logout function
    function logout() {
        localStorage.removeItem('livegenda_user');
        window.location.href = 'index.html';
    }
    
    // Display user email in console (for debugging)
    console.log('Usuário logado:', user.email);
    
    // Add click handlers to appointment cards (placeholder)
    const appointmentCards = document.querySelectorAll('main .flex.items-center.gap-4');
    appointmentCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            alert('Detalhes do agendamento em desenvolvimento.');
        });
    });
});
