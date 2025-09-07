// Manipulação do menu hambúrguer e navegação
document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Alternar sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
    
    // Event listeners
    if (hamburger) {
        hamburger.addEventListener('click', toggleSidebar);
    }
    
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
    
    // Manipulação de itens do menu
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.getAttribute('data-tab');
            
            if (tabName === 'logout' || item.id === 'sidebar-logout') {
                // Logout é tratado pelo app.js
                if (typeof handleLogout === 'function') {
                    handleLogout();
                }
            } else if (tabName) {
                // Mostrar a aba correspondente
                const tabs = document.querySelectorAll('.tab');
                const tabContents = document.querySelectorAll('.tab-content');
                
                // Atualizar abas ativas
                tabs.forEach(tab => {
                    if (tab.getAttribute('data-tab') === tabName) {
                        tab.classList.add('active');
                    } else {
                        tab.classList.remove('active');
                    }
                });
                
                // Atualizar conteúdo ativo
                tabContents.forEach(content => {
                    if (content.id === tabName) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
                
                // Fechar o menu após a navegação
                toggleSidebar();
            }
        });
    });
    
    // Adicionar event listener para o botão de logout no sidebar
    const sidebarLogout = document.getElementById('sidebar-logout');
    if (sidebarLogout) {
        sidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof handleLogout === 'function') {
                handleLogout();
            }
        });
    }
});