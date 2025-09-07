// Configuração do Supabase já feita no index.html

// Estado da aplicação
let appState = {
    currentTab: 'configuracao',
    authTab: 'login',
    countType: 'normal',
    activeSession: null,
    sessionProducts: [],
    sessionScans: [],
    avulsaScans: [],
    exportType: 'grouped',
    exportFormat: 'csv',
    exportFields: ['codigo', 'quantidade_contada', 'descricao'],
    deferredPrompt: null,
    isInstalled: false
};

// Elementos DOM
const elements = {
    // Seções principais
    authSection: document.getElementById('auth-section'),
    mainApp: document.getElementById('main-app'),
    
    // Elementos de autenticação
    authTabs: document.querySelectorAll('.auth-tab'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginEmail: document.getElementById('email'),
    loginPassword: document.getElementById('password'),
    registerEmail: document.getElementById('reg-email'),
    registerPassword: document.getElementById('reg-password'),
    registerName: document.getElementById('reg-name'),
    
    // Navegação principal
    mainTabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('#main-app .tab-content'),
    userInfo: document.getElementById('user-info'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Configuração
    countTypeSelect: document.getElementById('count-type'),
    importCsvBtn: document.getElementById('import-csv-btn'),
    csvFileInput: document.getElementById('csv-file'),
    importMessageArea: document.getElementById('import-message-area'),
    
    // Contagem
    startCountBtn: document.getElementById('start-count'),
    endCountBtn: document.getElementById('end-count'),
    sessionNameInput: document.getElementById('session-name'),
    sessionDescInput: document.getElementById('session-desc'),
    progressBar: document.getElementById('progress-bar'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    totalProducts: document.getElementById('total-products'),
    scannedProducts: document.getElementById('scanned-products'),
    remainingProducts: document.getElementById('remaining-products'),
    completionRate: document.getElementById('completion-rate'),
    productsList: document.getElementById('products-list'),
    
    // Bipagem
    scanForm: document.getElementById('scan-form'),
    scanInput: document.getElementById('scan-input'),
    scanQty: document.getElementById('scan-qty'),
    scanBtn: document.getElementById('scan-btn'),
    scanMessage: document.getElementById('scan-message'),
    avulsaScansCard: document.getElementById('avulsa-scans-card'),
    avulsaScansList: document.getElementById('avulsa-scans-list'),
    
    // Produtos
    productsListTab: document.getElementById('products-list'),
    
    // Exportar
    exportFormatSelect: document.getElementById('export-format'),
    exportTypeSelect: document.getElementById('export-type'),
    exportFieldsGroup: document.getElementById('export-fields-group'),
    exportFieldsCheckboxes: document.querySelectorAll('.export-field'),
    exportBtn: document.getElementById('export-btn'),
    
    // Histórico
    sessionsList: document.getElementById('sessions-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    
    // Menu hambúrguer
    hamburger: document.querySelector('.hamburger'),
    sidebar: document.querySelector('.sidebar'),
    overlay: document.querySelector('.overlay'),
    menuItems: document.querySelectorAll('.menu-item')
};

// Inicialização da aplicação
async function initApp() {
    console.log('Inicializando aplicação...');
    
    // Debug: verificar elementos críticos
    console.log('Elementos críticos encontrados:', {
        scanForm: !!document.getElementById('scan-form'),
        scanInput: !!document.getElementById('scan-input'),
        scanBtn: !!document.getElementById('scan-btn'),
        scanQty: !!document.getElementById('scan-qty')
    });
    
    // Aguardar um pouco para garantir que o DOM está totalmente carregado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Reinicializar todos os elementos DOM para garantir que estão atualizados
    elements.startCountBtn = document.getElementById('start-count');
    elements.endCountBtn = document.getElementById('end-count');
    elements.sessionNameInput = document.getElementById('session-name');
    elements.sessionDescInput = document.getElementById('session-desc');
    
    // Reinicializar os elementos de conteúdo para garantir que estão atualizados
    elements.tabContents = document.querySelectorAll('#main-app .tab-content');
    
    try {
        // Verificar se há uma sessão ativa
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            // Usuário já está autenticado
            console.log('Usuário autenticado:', session.user.email);
            await showMainApp();
            
            // Verificar se os elementos de conteúdo estão visíveis após login
            setTimeout(() => {
                console.log('Verificando visibilidade dos conteúdos após login:');
                elements.tabContents.forEach(content => {
                    console.log(`Conteúdo ${content.id}: display=${getComputedStyle(content).display}, visibility=${getComputedStyle(content).visibility}, classes=${content.className}`);
                });
            }, 500);
        } else {
            // Usuário precisa fazer login
            console.log('Usuário não autenticado');
            showAuthSection();
        }
        
        // Configurar event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showAuthSection();
    }
}

// Mostrar seção de autenticação
function showAuthSection() {
    elements.authSection.classList.remove('hidden');
    elements.mainApp.classList.add('hidden');
}

// Mostrar aplicação principal
async function showMainApp() {
    try {
        console.log('Iniciando showMainApp');
        // Obter informações do usuário
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            console.log('Usuário não encontrado, mostrando seção de autenticação');
            showAuthSection();
            return;
        }
        
        console.log('Usuário autenticado:', user.email);
        
        // Atualizar informações do usuário
        await updateUserInfo(user);
        
        // Carregar dados do usuário
        await loadUserData();
        
        // Mostrar a aplicação principal
        elements.authSection.classList.add('hidden');
        elements.mainApp.classList.remove('hidden');
        
        console.log('Aplicação principal exibida');
        
        // Mostrar a primeira aba
        showTab('configuracao');
        
        console.log('Aba de configuração exibida');
        
        // Reconfigurar event listeners após mostrar a aplicação
        setTimeout(() => {
            setupCountingEventListeners();
        }, 300);
    } catch (error) {
        console.error('Erro ao carregar a aplicação:', error);
        showAuthSection();
    }
}

// Atualizar informações do usuário
async function updateUserInfo(user) {
    try {
        // Buscar perfil do usuário
        const { data: profile } = await supabaseClient
            .from('user_profiles')
            .select('name')
            .eq('id', user.id)
            .single();
        
        // Atualizar nome do usuário na interface
        if (profile && profile.name) {
            elements.userInfo.textContent = `Olá, ${profile.name}`;
        } else {
            elements.userInfo.textContent = `Olá, ${user.email}`;
        }
        
        // Garantir que o elemento userInfo esteja visível
        elements.userInfo.classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        elements.userInfo.textContent = `Olá, ${user.email}`;
        elements.userInfo.classList.remove('hidden');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Event listeners para abas de autenticação
    if (elements.authTabs) {
        elements.authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabId = tab.getAttribute('data-tab');
                appState.authTab = tabId;
                
                if (tabId === 'login') {
                    if (elements.loginForm) elements.loginForm.classList.remove('hidden');
                    if (elements.registerForm) elements.registerForm.classList.add('hidden');
                } else {
                    if (elements.loginForm) elements.loginForm.classList.add('hidden');
                    if (elements.registerForm) elements.registerForm.classList.remove('hidden');
                }
            });
        });
    }
    
    // Event listeners para formulários de autenticação
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
    if (elements.registerForm) elements.registerForm.addEventListener('submit', handleRegister);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Event listeners para abas principais
    if (elements.mainTabs) {
        elements.mainTabs.forEach(tab => {
            if (tab) {
                tab.addEventListener('click', () => {
                    const tabId = tab.getAttribute('data-tab');
                    showTab(tabId);
                });
            }
        });
    }
    
    // Event listeners para menu hambúrguer são gerenciados pelo menu.js
    // Não duplicar os event listeners aqui para evitar conflitos
    
    // Event listeners para configuração
    if (elements.countTypeSelect) elements.countTypeSelect.addEventListener('change', toggleCountType);
    if (elements.importCsvBtn) elements.importCsvBtn.addEventListener('click', handleImport);
    if (elements.csvFileInput) elements.csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name.replace(/\.csv$/i, '');
            if (elements.sessionNameInput) {
                elements.sessionNameInput.value = fileName;
            }
        }
    });
    
    // Event listeners para contagem (configurados posteriormente em setupCountingEventListeners)
    // Os event listeners de contagem são configurados após a aplicação ser exibida
    
    // Event listeners para bipagem
    if (elements.scanForm) elements.scanForm.addEventListener('submit', handleScan);
    if (elements.scanInput) {
        // Event listener para Enter manual
        elements.scanInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                processScan();
            }
        });
        
        // Event listener para detectar entrada automática de leitor de código de barras
        elements.scanInput.addEventListener('input', (e) => {
            const value = e.target.value;
            
            // Se o valor contém quebra de linha (leitor automático)
            if (value.includes('\n') || value.includes('\r')) {
                e.target.value = value.replace(/[\n\r]/g, '');
                processScan();
                return;
            }
        });
    }
    
    // Event listeners para exportação
    if (elements.exportFormatSelect) elements.exportFormatSelect.addEventListener('change', () => {
        appState.exportFormat = elements.exportFormatSelect.value;
    });
    
    if (elements.exportTypeSelect) elements.exportTypeSelect.addEventListener('change', () => {
        appState.exportType = elements.exportTypeSelect.value;
        
        // Mostrar/ocultar campos de exportação baseado no tipo
        const groupedFields = document.getElementById('export-fields-grouped');
        const detailedFields = document.getElementById('export-fields-detailed');
        
        if (appState.exportType === 'grouped') {
            if (groupedFields) groupedFields.classList.remove('hidden');
            if (detailedFields) detailedFields.classList.add('hidden');
        } else {
            if (groupedFields) groupedFields.classList.add('hidden');
            if (detailedFields) detailedFields.classList.remove('hidden');
        }
        
        // Atualizar exportFields baseado nos checkboxes visíveis
        updateExportFieldsFromVisibleCheckboxes();
    });
    
    if (elements.exportFieldsCheckboxes) elements.exportFieldsCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const field = checkbox.dataset.field;

            if (checkbox.checked) {
                if (!appState.exportFields.includes(field)) {
                    appState.exportFields.push(field);
                }
            } else {
                appState.exportFields = appState.exportFields.filter(f => f !== field);
            }

        });
    });
    
    if (elements.exportBtn) elements.exportBtn.addEventListener('click', exportCurrentSession);
    
    // Inicializar exportFields baseado nos checkboxes visíveis
    updateExportFieldsFromVisibleCheckboxes();
    
    // Sincronizar checkboxes com estado inicial
    syncExportFieldsCheckboxes();
    
    // Event listeners para histórico
    if (elements.clearHistoryBtn) elements.clearHistoryBtn.addEventListener('click', clearAllHistory);
}

// Atualizar exportFields baseado nos checkboxes visíveis
function updateExportFieldsFromVisibleCheckboxes() {
    appState.exportFields = [];
    
    // Determinar qual grupo de checkboxes está visível
    const groupedFields = document.getElementById('export-fields-grouped');
    const detailedFields = document.getElementById('export-fields-detailed');
    
    let visibleCheckboxes;
    if (appState.exportType === 'grouped' && groupedFields && !groupedFields.classList.contains('hidden')) {
        visibleCheckboxes = groupedFields.querySelectorAll('.export-field');
    } else if (appState.exportType === 'detailed' && detailedFields && !detailedFields.classList.contains('hidden')) {
        visibleCheckboxes = detailedFields.querySelectorAll('.export-field');
    }
    
    if (visibleCheckboxes) {
        visibleCheckboxes.forEach(checkbox => {
            if (checkbox.checked && checkbox.dataset.field) {
                appState.exportFields.push(checkbox.dataset.field);
            }
        });
    }
}

// Sincronizar checkboxes de exportação com o estado atual
function syncExportFieldsCheckboxes() {

    if (elements.exportFieldsCheckboxes) {
        elements.exportFieldsCheckboxes.forEach(checkbox => {
            const field = checkbox.dataset.field;
            if (field) {
                checkbox.checked = appState.exportFields.includes(field);

            }
        });
    }

}

// Manipulador de login
 async function handleLogin(e) {
    if (e) e.preventDefault();
    console.log('Tentando fazer login...');
    
    // Verificar se os elementos existem
    if (!elements.loginEmail || !elements.loginPassword) {
        console.error('Elementos de login não encontrados:', { 
            loginEmail: elements.loginEmail, 
            loginPassword: elements.loginPassword 
        });
        showAuthMessage('Erro interno. Por favor, recarregue a página.', 'error');
        return;
    }
    
    const email = elements.loginEmail.value;
    const password = elements.loginPassword.value;
    
    console.log('Email fornecido:', email);
    console.log('Senha fornecida:', password ? '******' : 'vazia');
    
    if (!email || !password) {
        console.log('Campos vazios detectados');
        showAuthMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    showButtonLoading(loginBtn, 'Entrando...');
    
    try {
        console.log('Enviando requisição de login para o Supabase...');
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            console.error('Erro retornado pelo Supabase:', error);
            throw error;
        }
        
        console.log('Login bem-sucedido:', data);
        await showMainApp();
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showAuthMessage('Erro ao fazer login. Verifique suas credenciais.', 'error');
    } finally {
        hideButtonLoading(loginBtn, 'Entrar');
    }
}

// Manipulador de registro
async function handleRegister(e) {
    if (e) e.preventDefault();
    
    const email = elements.registerEmail.value;
    const password = elements.registerPassword.value;
    const name = elements.registerName.value;
    
    if (!email || !password || !name) {
        showAuthMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    const registerBtn = document.querySelector('#register-form button[type="submit"]');
    showButtonLoading(registerBtn, 'Criando conta...');
    
    try {
        // Registrar usuário
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        // Inserir perfil do usuário
        if (data.user) {
            const { error: profileError } = await supabaseClient
                .from('user_profiles')
                .insert([
                    { id: data.user.id, name, authorized: true }
                ]);
            
            if (profileError) throw profileError;
        }
        
        showAuthMessage('Registro realizado com sucesso! Você já pode fazer login.', 'success');
        
        // Mudar para a aba de login
        elements.authTabs[0].click();
    } catch (error) {
        console.error('Erro ao registrar:', error);
        showAuthMessage('Erro ao registrar. Tente novamente.', 'error');
    } finally {
        hideButtonLoading(registerBtn, 'Criar Conta');
    }
}

// Manipulador de logout
async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        showAuthSection();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Mostrar mensagem na seção de autenticação
function showAuthMessage(message, type = 'warning') {
    const authMessage = document.getElementById('auth-message');
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = `message-area ${type}`;
        authMessage.classList.remove('hidden');
        
        // Esconder a mensagem após 5 segundos
        setTimeout(() => {
            authMessage.classList.add('hidden');
        }, 5000);
    }
}

// Mostrar aba
function showTab(tabId) {
    console.log('Mostrando aba:', tabId);
    // Atualizar estado
    appState.currentTab = tabId;
    
    // Atualizar abas ativas
    elements.mainTabs.forEach(tab => {
        console.log(`Tab: ${tab.getAttribute('data-tab')}, comparando com: ${tabId}`);
        if (tab.getAttribute('data-tab') === tabId) {
            console.log(`Ativando tab: ${tab.getAttribute('data-tab')}`);
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Primeiro, ocultar todos os conteúdos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Depois, mostrar apenas o conteúdo da aba selecionada
    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        console.log(`Ativando conteúdo: ${activeContent.id}`);
        activeContent.classList.add('active');
        activeContent.style.display = 'block';
        console.log(`Classes depois: ${activeContent.className}, display: ${activeContent.style.display}`);
    } else {
        console.error(`Elemento de conteúdo não encontrado para a aba: ${tabId}`);
    }
    
    // Forçar a renderização do conteúdo
    setTimeout(() => {
        if (activeContent) {
            console.log(`Verificando visibilidade após timeout: ${activeContent.id}, display=${getComputedStyle(activeContent).display}`);
            // Forçar a exibição novamente
            activeContent.style.display = 'block';
        }
    }, 100);
    
    console.log('Abas atualizadas');
    
    // Carregar dados específicos da aba
    if (tabId === 'historico') {
        loadSessionHistory();
    } else if (tabId === 'produtos') {
        renderProducts();
    }
    
    // Verificar se o conteúdo da aba está visível
    if (activeContent) {
        console.log(`Conteúdo ativo: ${activeContent.id}, display: ${getComputedStyle(activeContent).display}`);
    }
    
    // Ações específicas para cada aba
    if (tabId === 'produtos') {
        renderProducts();
    } else if (tabId === 'historico') {
        loadSessionHistory();
    }
}

// Alternar tipo de contagem
function toggleCountType() {
    appState.countType = elements.countTypeSelect.value;
    
    // Atualizar indicador do tipo de contagem
    const indicator = document.getElementById('count-type-indicator');
    const indicatorText = document.getElementById('count-type-text');
    
    if (indicator && indicatorText) {
        if (appState.countType === 'avulsa') {
            indicator.classList.add('avulsa');
            indicatorText.textContent = 'Tipo: Avulsa';
        } else {
            indicator.classList.remove('avulsa');
            indicatorText.textContent = 'Tipo: Normal';
        }
    }
    
    // Mostrar/esconder elementos específicos para cada tipo
    if (appState.countType === 'avulsa') {
        elements.avulsaScansCard.classList.remove('hidden');
        elements.importCsvBtn.classList.add('hidden');
    } else {
        elements.avulsaScansCard.classList.add('hidden');
        elements.importCsvBtn.classList.remove('hidden');
    }
}

// Manipulador de importação de CSV
async function handleImport() {
    const fileInput = elements.csvFileInput;
    const file = fileInput.files[0];
    const importMessageArea = elements.importMessageArea;
    
    if (!file) {
        showMessage('Selecione um arquivo CSV para importar.', 'error', 'configuracao');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showMessage('O arquivo deve ter no máximo 5MB.', 'error', 'configuracao');
        return;
    }
    
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        showMessage('O arquivo deve ser do tipo CSV.', 'error', 'configuracao');
        return;
    }

    const importBtn = elements.importCsvBtn;
    showButtonLoading(importBtn, 'Importando...');

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
        
        if (lines.length <= 1) {
            showMessage('Arquivo CSV sem dados.', 'error', 'configuracao');
            return;
        }

        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const codigo = (cols[0] || '').trim();
            const descricao = (cols[1] || '').trim();
            const quantidade_atual = parseInt(cols[2], 10) || 0;
            
            if (codigo && descricao) {
                products.push({ 
                    codigo, 
                    descricao, 
                    quantidade_atual, 
                    quantidade_contada: 0, 
                    is_counted: false 
                });
            }
        }
        
        // Atualizar estado
        appState.sessionProducts = products;
        
        // Mostrar mensagem de sucesso
        if (importMessageArea) {
            importMessageArea.textContent = `Produtos importados: ${products.length}`;
            importMessageArea.style.display = 'block';
        }
        
        showMessage(`Importação concluída! ${products.length} produtos importados.`, 'success', 'configuracao');
        
        // Atualizar lista de produtos se estiver na aba produtos
        if (appState.currentTab === 'produtos') {
            renderProducts();
        }
        
        hideButtonLoading(importBtn, 'Importar CSV');
    };
    
    reader.onerror = () => {
        showMessage('Erro ao ler o arquivo CSV.', 'error', 'configuracao');
        hideButtonLoading(importBtn, 'Importar CSV');
    };
    
    reader.readAsText(file);
}

// Manipulador de mudança no input de arquivo CSV
async function handleCsvImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Verificar se é um arquivo CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showMessage('Por favor, selecione um arquivo CSV válido.', 'error', 'configuracao');
        return;
    }
    
    try {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const csvData = event.target.result;
            const lines = csvData.split('\n');
            
            // Verificar se há dados suficientes
            if (lines.length < 2) {
                showMessage('O arquivo CSV está vazio ou mal formatado.', 'error', 'configuracao');
                return;
            }
            
            // Processar cabeçalho
            const header = lines[0].split(',');
            const requiredFields = ['codigo', 'descricao', 'quantidade'];
            
            // Verificar se todos os campos obrigatórios estão presentes
            const hasAllFields = requiredFields.every(field => header.includes(field));
            
            if (!hasAllFields) {
                showMessage('O arquivo CSV deve conter as colunas: codigo, descricao, quantidade.', 'error', 'configuracao');
                return;
            }
            
            // Processar linhas
            const products = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                const values = lines[i].split(',');
                const product = {};
                
                for (let j = 0; j < header.length; j++) {
                    product[header[j].trim()] = values[j] ? values[j].trim() : '';
                }
                
                // Converter quantidade para número
                product.quantidade = parseInt(product.quantidade) || 0;
                
                products.push(product);
            }
            
            // Atualizar estado
            appState.sessionProducts = products;
            
            // Mostrar mensagem de sucesso
            elements.importMessageArea.textContent = `${products.length} produtos importados com sucesso!`;
            elements.importMessageArea.style.display = 'block';
            
            // Esconder após 5 segundos
            setTimeout(() => {
                elements.importMessageArea.style.display = 'none';
            }, 5000);
            
            // Limpar input
            elements.csvFileInput.value = '';
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error('Erro ao importar CSV:', error);
        showMessage('Erro ao processar o arquivo CSV.', 'error', 'configuracao');
    }
}

// Configurar event listeners específicos para contagem
function setupCountingEventListeners() {
    // Reobter os elementos para garantir que estão atualizados
    const startBtn = document.getElementById('start-count');
    const endBtn = document.getElementById('end-count');
    
    if (startBtn) {
        // Remover event listeners existentes
        startBtn.removeEventListener('click', startCounting);
        // Adicionar novo event listener
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            startCounting();
        });
    }
    
    if (endBtn) {
        // Remover event listeners existentes
        endBtn.removeEventListener('click', endCounting);
        // Adicionar novo event listener
        endBtn.addEventListener('click', endCounting);
    }
}

// Iniciar contagem
async function startCounting() {
    const sessionName = elements.sessionNameInput.value;
    const sessionDesc = elements.sessionDescInput.value;
    
    if (!sessionName) {
        showMessage('Por favor, informe um nome para a sessão.', 'error', 'contagem');
        return;
    }
    
    if (appState.countType === 'normal' && appState.sessionProducts.length === 0) {
        showMessage('Por favor, importe produtos antes de iniciar a contagem.', 'error', 'contagem');
        return;
    }
    
    const startBtn = elements.startCountBtn;
    showButtonLoading(startBtn, 'Iniciando...');
    
    try {
        // Obter usuário atual
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            showAuthSection();
            return;
        }
        
        // Criar sessão
        const { data: session, error } = await supabaseClient
            .from('counting_sessions')
            .insert([
                {
                    session_name: sessionName,
                    description: sessionDesc,
                    count_type: appState.countType,
                    user_id: user.id,
                    status: 'active'
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // Atualizar estado
        appState.activeSession = session;
        appState.sessionScans = [];
        
        if (appState.countType === 'normal') {
            // Inserir produtos na sessão
            for (const product of appState.sessionProducts) {
                await insertOrUpdateProduct(product);
            }
        } else {
            // Limpar scans avulsos
            appState.avulsaScans = [];
            elements.avulsaScansList.innerHTML = '';
        }
        
        // Atualizar interface - ocultar botão iniciar e mostrar botão finalizar
        elements.startCountBtn.classList.add('hidden');
        elements.endCountBtn.classList.remove('hidden');
        elements.sessionNameInput.disabled = true;
        elements.sessionDescInput.disabled = true;
        elements.countTypeSelect.disabled = true;
        
        // Mostrar mensagem de sucesso
        showMessage(`Sessão "${sessionName}" iniciada com sucesso!`, 'success', 'contagem');
        
        // Atualizar progresso
        updateProgress();
        
        // Mudar para a aba de bipagem
        showTab('bipagem');
        
        // Focar no campo de código de barras após um pequeno delay
        setTimeout(() => {
            elements.scanInput.focus();
        }, 100);
    } catch (error) {
        console.error('Erro ao iniciar contagem:', error);
        showMessage('Erro ao iniciar a sessão de contagem.', 'error', 'contagem');
    } finally {
        hideButtonLoading(startBtn, 'Iniciar Contagem');
    }
}

// Finalizar contagem
async function endCounting() {
    if (!appState.activeSession) {
        showMessage('Não há uma sessão ativa para finalizar.', 'error', 'contagem');
        return;
    }
    
    const endBtn = elements.endCountBtn;
    showButtonLoading(endBtn, 'Finalizando...');
    
    try {
        // Atualizar sessão
        const { error } = await supabaseClient
            .from('counting_sessions')
            .update({ status: 'completed', ended_at: new Date().toISOString() })
            .eq('id', appState.activeSession.id);
        
        if (error) throw error;
        
        // Resetar estado
        appState.activeSession = null;
        appState.sessionProducts = [];
        appState.sessionScans = [];
        appState.avulsaScans = [];
        
        // Atualizar interface - mostrar botão iniciar e ocultar botão finalizar
        elements.startCountBtn.classList.remove('hidden');
        elements.endCountBtn.classList.add('hidden');
        elements.sessionNameInput.disabled = false;
        elements.sessionDescInput.disabled = false;
        elements.countTypeSelect.disabled = false;
        elements.sessionNameInput.value = '';
        elements.sessionDescInput.value = '';
        elements.productsList.innerHTML = '';
        elements.avulsaScansList.innerHTML = '';
        
        // Resetar progresso
        elements.progressFill.style.width = '0%';
        elements.progressText.textContent = '0%';
        elements.totalProducts.textContent = '0';
        elements.scannedProducts.textContent = '0';
        elements.remainingProducts.textContent = '0';
        elements.completionRate.textContent = '0%';
        
        // Mostrar mensagem de sucesso
        showMessage('Sessão de contagem finalizada com sucesso!', 'success', 'contagem');
        
        // Mudar para a aba de histórico
        showTab('historico');
    } catch (error) {
        console.error('Erro ao finalizar contagem:', error);
        showMessage('Erro ao finalizar a sessão de contagem.', 'error', 'contagem');
    } finally {
        hideButtonLoading(endBtn, 'Finalizar Contagem');
    }
}

// Função para processar scan (chamada por diferentes eventos)
async function processScan() {
    if (!elements.scanInput.value.trim()) {
        return;
    }
    
    const scanCode = elements.scanInput.value.trim();
    const qty = parseInt(elements.scanQty.value) || 1;
    
    // Chamar handleScan para processar o código corretamente
    await handleScan({ preventDefault: () => {} });
}

// Manipulador de scan
async function handleScan(e) {
    e.preventDefault();
    
    if (!appState.activeSession) {
        console.log('Erro: Nenhuma sessão ativa');
        showMessage('Inicie uma contagem antes de escanear produtos.', 'error', 'scan-message');
        return;
    }
    
    const scanCode = elements.scanInput.value;
    const scanQty = parseInt(elements.scanQty.value) || 1;
    
    if (!scanCode) {
        showMessage('Por favor, informe um código para bipar.', 'error', 'scan-message');
        return;
    }
    
    try {
        if (appState.countType === 'normal') {
            // Verificar se o produto existe
            const product = appState.sessionProducts.find(p => p.codigo === scanCode);
            
            if (!product) {
                showMessage(`Produto com código "${scanCode}" não encontrado.`, 'error', 'scan-message');
                return;
            }
            
            // Registrar scan
            await registerScan(scanCode, scanQty);
            
            // Atualizar produto
            await updateProductCount(scanCode, scanQty);
            
            // Atualizar progresso
            updateProgress();
            
            // Renderizar produtos atualizados
            renderProducts();
            
            // Mostrar mensagem de sucesso
            showMessage(`Produto "${scanCode}" bipado com sucesso!`, 'success', 'scan-message');
        } else {
            // Contagem avulsa
            // Adicionar ao estado
            const scan = {
                codigo: scanCode,
                quantidade: scanQty,
                data_hora: new Date().toISOString()
            };
            
            appState.avulsaScans.push(scan);
            
            // Registrar scan
            await registerScan(scanCode, scanQty);
            
            // Adicionar à lista
            const scanItem = document.createElement('div');
            scanItem.className = 'scan-item';
            scanItem.innerHTML = `
                <div class="scan-code">${scanCode}</div>
                <div class="scan-qty">${scanQty}</div>
            `;
            
            elements.avulsaScansList.appendChild(scanItem);
            
            // Mostrar mensagem de sucesso
            showMessage(`Código "${scanCode}" bipado com sucesso!`, 'success', 'scan-message');
        }
        
        // Limpar campos
        elements.scanInput.value = '';
        elements.scanQty.value = '1';
        elements.scanInput.focus();
    } catch (error) {
        console.error('Erro ao registrar bipagem:', error);
        showMessage('Erro ao registrar a bipagem.', 'error', 'scan-message');
    }
}

// Inserir ou atualizar produto
async function insertOrUpdateProduct(product) {
    if (!appState.activeSession) return;
    
    try {
        // Verificar se o produto já existe
        const { data: existingProducts, error: selectError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('session_id', appState.activeSession.id)
            .eq('codigo', product.codigo);
        
        if (selectError) throw selectError;
        
        if (existingProducts && existingProducts.length > 0) {
            // Atualizar produto existente
            const { error: updateError } = await supabaseClient
                .from('products')
                .update({
                    descricao: product.descricao,
                    quantidade_atual: product.quantidade
                })
                .eq('id', existingProducts[0].id);
            
            if (updateError) throw updateError;
        } else {
            // Inserir novo produto
            const { error: insertError } = await supabaseClient
                .from('products')
                .insert([
                    {
                        session_id: appState.activeSession.id,
                        codigo: product.codigo,
                        descricao: product.descricao,
                        quantidade_atual: product.quantidade,
                        quantidade_contada: 0
                    }
                ]);
            
            if (insertError) throw insertError;
        }
    } catch (error) {
        console.error('Erro ao inserir/atualizar produto:', error);
        throw error;
    }
}

// Registrar scan
async function registerScan(code, qty) {
    if (!appState.activeSession) return;
    
    try {
        // Inserir scan
        const { data: scan, error } = await supabaseClient
            .from('scans')
            .insert([
                {
                    session_id: appState.activeSession.id,
                    code,
                    qty
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // Adicionar ao estado
        appState.sessionScans.push(scan);
        
        return scan;
    } catch (error) {
        console.error('Erro ao registrar scan:', error);
        throw error;
    }
}

// Atualizar contagem de produto
async function updateProductCount(code, qty) {
    if (!appState.activeSession) return;
    
    try {
        // Buscar produto
        const { data: products, error: selectError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('session_id', appState.activeSession.id)
            .eq('codigo', code);
        
        if (selectError) throw selectError;
        
        if (!products || products.length === 0) return;
        
        const product = products[0];
        const newQty = (product.quantidade_contada || 0) + qty;
        
        // Atualizar produto
        const { error: updateError } = await supabaseClient
            .from('products')
            .update({ quantidade_contada: newQty })
            .eq('id', product.id);
        
        if (updateError) throw updateError;
        
        // Atualizar estado
        const productIndex = appState.sessionProducts.findIndex(p => p.codigo === code);
        
        if (productIndex !== -1) {
            appState.sessionProducts[productIndex].quantidade_contada = newQty;
            appState.sessionProducts[productIndex].scanned_qty = newQty;
        }
    } catch (error) {
        console.error('Erro ao atualizar contagem de produto:', error);
        throw error;
    }
}

// Atualizar progresso
async function updateProgress() {
    if (!appState.activeSession || appState.countType !== 'normal') return;
    
    try {
        // Buscar produtos da sessão
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('session_id', appState.activeSession.id);
        
        if (error) throw error;
        
        if (!products || products.length === 0) return;
        
        // Calcular métricas
        const total = products.length;
        const scanned = products.filter(p => (p.quantidade_contada || p.scanned_qty || 0) > 0).length;
        const remaining = total - scanned;
        const completionRate = total > 0 ? Math.round((scanned / total) * 100) : 0;
        
        // Verificar se a contagem está 100% completa
        const isComplete = products.every(p => (p.quantidade_contada || p.scanned_qty || 0) >= p.expected_qty);
        
        // Atualizar interface
        elements.totalProducts.textContent = total;
        elements.scannedProducts.textContent = scanned;
        elements.remainingProducts.textContent = remaining;
        elements.completionRate.textContent = `${completionRate}%`;
        elements.progressFill.style.width = `${completionRate}%`;
        elements.progressText.textContent = `${completionRate}%`;
        
        // Atualizar estado
        appState.sessionProducts = products;
        
        // Renderizar produtos
        renderProducts();
        
        // Se a contagem estiver completa, mostrar mensagem
        if (isComplete && completionRate === 100) {
            showMessage('Contagem 100% completa! Você pode finalizar a sessão.', 'success', 'scan-message');
        }
    } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
    }
}

// Renderizar produtos
function renderProducts() {
    console.log('Renderizando produtos:', appState.sessionProducts);
    
    if (!appState.sessionProducts || appState.sessionProducts.length === 0) {
        console.log('Nenhum produto para renderizar');
        if (elements.productsListTab) {
            elements.productsListTab.innerHTML = '<p id="no-products-msg">Nenhum produto importado ainda. Vá para a aba Configuração para importar um arquivo.</p>';
        }
        return;
    }
    
    console.log(`Renderizando ${appState.sessionProducts.length} produtos`);
    
    // Limpar lista
    if (elements.productsListTab) {
        elements.productsListTab.innerHTML = '';
        
        // Renderizar produtos
        appState.sessionProducts.forEach((product, index) => {
            const scannedQty = product.quantidade_contada || product.scanned_qty || 0;
            const expectedQty = product.quantidade || product.expected_qty || 0;
            const isComplete = scannedQty >= expectedQty;
            
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="product-info">
                    <div class="product-code">${product.codigo || product.code}</div>
                    <div class="product-desc">${product.descricao || product.description || ''}</div>
                </div>
                <div class="product-count">
                    <span class="count-badge ${isComplete ? 'success' : ''}">
                        ${scannedQty}/${expectedQty}
                    </span>
                </div>
            `;
            
            elements.productsListTab.appendChild(productItem);
        });
        
        console.log('Produtos renderizados com sucesso');
    } else {
        console.error('Elemento products-list não encontrado');
    }
}

// Mostrar mensagem
function showMessage(message, type = 'warning', tabId) {
    const targetElement = document.getElementById(tabId);
    
    if (!targetElement) {
        console.warn(`Elemento com ID '${tabId}' não encontrado para exibir mensagem:`, message);
        return;
    }
    
    // Se for o elemento scan-message, substituir o conteúdo diretamente
    if (tabId === 'scan-message') {
        targetElement.className = `message-area ${type}`;
        targetElement.textContent = message;
        
        // Remover classe após 5 segundos
        setTimeout(() => {
            targetElement.className = 'message-area';
            targetElement.textContent = 'Nenhuma operação realizada ainda. Escaneie um código ou digite manualmente.';
        }, 5000);
    } else {
        // Para outras abas, criar elemento temporário
        const messageArea = document.createElement('div');
        messageArea.className = `message-area ${type}`;
        messageArea.textContent = message;
        
        // Remover mensagens anteriores
        const existingMessages = targetElement.querySelectorAll('.message-area');
        existingMessages.forEach(msg => msg.remove());
        
        // Adicionar nova mensagem
        targetElement.insertBefore(messageArea, targetElement.firstChild);
        
        // Remover após 5 segundos
        setTimeout(() => {
            messageArea.remove();
        }, 5000);
    }
}

// Carregar dados do usuário
async function loadUserData() {
    try {
        // Obter usuário atual
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            showAuthSection();
            return;
        }
        
        // Verificar se há uma sessão ativa
        const { data: activeSessions, error: sessionError } = await supabaseClient
            .from('counting_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        
        if (sessionError) throw sessionError;
        
        if (activeSessions && activeSessions.length > 0) {
            // Restaurar sessão ativa
            appState.activeSession = activeSessions[0];
            
            // Atualizar interface
            elements.sessionNameInput.value = appState.activeSession.session_name;
            elements.sessionDescInput.value = appState.activeSession.description || '';
            elements.countTypeSelect.value = appState.activeSession.count_type;
            elements.startCountBtn.classList.add('hidden');
            elements.endCountBtn.classList.remove('hidden');
            elements.sessionNameInput.disabled = true;
            elements.sessionDescInput.disabled = true;
            elements.countTypeSelect.disabled = true;
            
            // Carregar produtos da sessão
            if (appState.activeSession.count_type === 'normal') {
                console.log('Carregando produtos da sessão:', appState.activeSession.id);
                
                const { data: products, error: productsError } = await supabaseClient
                    .from('products')
                    .select('*')
                    .eq('session_id', appState.activeSession.id);
                
                console.log('Produtos do banco:', products);
                console.log('Erro ao carregar produtos:', productsError);
                
                if (productsError) throw productsError;
                
                if (products && products.length > 0) {
                    console.log(`Encontrados ${products.length} produtos`);
                    
                    // Converter para o formato esperado
                    appState.sessionProducts = products.map(p => ({
                        codigo: p.codigo,
                        descricao: p.descricao,
                        quantidade: p.quantidade_atual,
                        scanned_qty: p.quantidade_contada || 0
                    }));
                    
                    console.log('Produtos convertidos:', appState.sessionProducts);
                    
                    // Renderizar produtos na interface
                    renderProducts();
                    
                    // Atualizar progresso
                    updateProgress();
                } else {
                    console.log('Nenhum produto encontrado no banco de dados');
                    appState.sessionProducts = [];
                }
            } else {
                // Carregar scans avulsos
                const { data: scans, error: scansError } = await supabaseClient
                    .from('scans')
                    .select('*')
                    .eq('session_id', appState.activeSession.id)
                    .order('created_at', { ascending: false });
                
                if (scansError) throw scansError;
                
                if (scans) {
                    appState.avulsaScans = scans;
                    
                    // Renderizar scans avulsos
                    elements.avulsaScansList.innerHTML = '';
                    
                    scans.forEach(scan => {
                        const scanItem = document.createElement('div');
                        scanItem.className = 'scan-item';
                        scanItem.innerHTML = `
                            <div class="scan-code">${scan.code}</div>
                            <div class="scan-qty">${scan.qty}</div>
                        `;
                        
                        elements.avulsaScansList.appendChild(scanItem);
                    });
                }
            }
            
            // Mostrar mensagem
            showMessage(`Sessão "${appState.activeSession.session_name}" restaurada.`, 'info', 'contagem');
        }
        
        // Carregar histórico de sessões
        loadSessionHistory();
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Carregar histórico de sessões
async function loadSessionHistory() {
    try {
        // Obter usuário atual
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            showAuthSection();
            return;
        }
        
        // Buscar sessões do usuário
        const { data: sessions, error } = await supabaseClient
            .from('counting_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Limpar lista
        elements.sessionsList.innerHTML = '';
        
        if (!sessions || sessions.length === 0) {
            elements.sessionsList.innerHTML = '<div class="message-area">Nenhuma sessão encontrada.</div>';
            return;
        }
        
        // Renderizar sessões
        sessions.forEach(session => {
            const sessionItem = document.createElement('div');
            sessionItem.className = 'session-item';
            sessionItem.innerHTML = renderSessionItem(session);
            
            elements.sessionsList.appendChild(sessionItem);
        });
    } catch (error) {
        console.error('Erro ao carregar histórico de sessões:', error);
    }
}

// Renderizar item de sessão
function renderSessionItem(session) {
    const createdAt = new Date(session.created_at).toLocaleString();
    const endTime = session.ended_at ? new Date(session.ended_at).toLocaleString() : 'Em andamento';
    
    return `
        <div class="session-name">${session.session_name}</div>
        <div class="session-details">
            <span>${session.count_type === 'normal' ? 'Com arquivo' : 'Avulsa'}</span>
            <span>Início: ${createdAt}</span>
            <span>Término: ${endTime}</span>
        </div>
        <div class="session-actions">
            <button class="session-action-btn" data-session-id="${session.id}" onclick="viewSessionDetails('${session.id}')">
                <i class="fas fa-eye"></i> Detalhes
            </button>
            <button class="session-action-btn success" data-session-id="${session.id}" onclick="exportSessionData('${session.id}')">
                <i class="fas fa-download"></i> Exportar
            </button>
            <button class="session-action-btn danger" data-session-id="${session.id}" onclick="deleteSession('${session.id}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
}

// Exportar dados da sessão atual
function exportCurrentSession() {
    if (!appState.activeSession) {
        showMessage('Não há uma sessão ativa para exportar.', 'error', 'exportar');
        return;
    }
    
    exportSessionData(appState.activeSession.id);
}

// Exportar dados da sessão
async function exportSessionData(sessionId) {
    try {
        const targetSessionId = sessionId || (appState.activeSession ? appState.activeSession.id : null);
        
        if (!targetSessionId) {
            showMessage('Nenhuma sessão selecionada para exportar.', 'error', 'exportar');
            return;
        }
        
        // Buscar sessão
        const { data: session, error: sessionError } = await supabaseClient
            .from('counting_sessions')
            .select('*')
            .eq('id', targetSessionId)
            .single();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
            showMessage('Sessão não encontrada.', 'error', 'exportar');
            return;
        }
        
        // Buscar produtos e scans
        const { data: products, error: productsError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('session_id', targetSessionId);
        
        if (productsError) throw productsError;
        
        const { data: scans, error: scansError } = await supabaseClient
            .from('scans')
            .select('*')
            .eq('session_id', targetSessionId);
        
        if (scansError) throw scansError;
        
        // Preparar dados para exportação
        let exportData = [];
        const exportType = appState.exportType;
        const exportFields = appState.exportFields;
        

        
        if (session.count_type === 'normal' && products) {
            if (exportType === 'grouped') {
                // Exportação agrupada por produto - filtrar apenas produtos com quantidade contada > 0
                exportData = products
                    .filter(product => (product.quantidade_contada || 0) > 0)
                    .map(product => {
                        const item = {};
                        
                        // Ordem específica para exportação agrupada: codigo, quantidade_contada, descricao
                        if (exportFields.includes('codigo')) item.codigo = product.codigo;
                        if (exportFields.includes('quantidade_contada')) item.quantidade_contada = product.quantidade_contada;
                        if (exportFields.includes('descricao')) item.descricao = product.descricao;
                        if (exportFields.includes('esperado')) item.esperado = product.quantidade_esperada;
                        if (exportFields.includes('diferenca')) item.diferenca = (product.quantidade_contada || 0) - (product.quantidade_esperada || 0);
                        if (exportFields.includes('sessao')) item.sessao = session.session_name;
                        if (exportFields.includes('data_hora')) item.data_hora = new Date(session.created_at).toISOString().replace('T', ' ').substring(0, 19);
                        
                        return item;
                    });
            } else {
                // Exportação detalhada por scan
                if (scans) {
                    exportData = scans.map(scan => {
                        const product = products.find(p => p.codigo === scan.code);
                        const item = {};
                        
                        // Ordem específica para exportação linha a linha: codigo, quantidade_contada, descricao, data_hora
                        if (exportFields.includes('codigo')) item.codigo = scan.code;
                        if (exportFields.includes('quantidade_contada')) item.quantidade_contada = scan.qty;
                        if (exportFields.includes('descricao')) item.descricao = product ? product.descricao : '';
                        if (exportFields.includes('data_hora')) item.data_hora = new Date(scan.created_at).toISOString().replace('T', ' ').substring(0, 19);
                        if (exportFields.includes('sessao')) item.sessao = session.session_name;
                        
                        return item;
                    });
                }
            }
        } else if (session.count_type === 'avulsa' && scans) {
            // Exportação de contagem avulsa
            if (exportType === 'grouped') {
                // Agrupar por código
                const groupedScans = {};
                
                scans.forEach(scan => {
                    if (!groupedScans[scan.code]) {
                        groupedScans[scan.code] = {
                            codigo: scan.code,
                            quantidade: 0,
                            created_at: scan.created_at
                        };
                    }
                    
                    groupedScans[scan.code].quantidade += scan.qty;
                });
                
                exportData = Object.values(groupedScans).map(scan => {
                    const item = {};
                    
                    // Ordem específica para exportação agrupada: codigo, quantidade_contada, descricao
                    if (exportFields.includes('codigo')) item.codigo = scan.codigo;
                    if (exportFields.includes('quantidade_contada')) item.quantidade_contada = scan.quantidade;
                    if (exportFields.includes('descricao')) item.descricao = ''; // Contagem avulsa não tem descrição
                    if (exportFields.includes('sessao')) item.sessao = session.session_name;
                    if (exportFields.includes('data_hora')) item.data_hora = new Date(scan.created_at).toISOString().replace('T', ' ').substring(0, 19);
                    
                    return item;
                });
            } else {
                // Exportação detalhada
                exportData = scans.map(scan => {
                    const item = {};
                    
                    // Ordem específica para exportação linha a linha: codigo, quantidade_contada, descricao, data_hora
                    if (exportFields.includes('codigo')) item.codigo = scan.code;
                    if (exportFields.includes('quantidade_contada')) item.quantidade_contada = scan.qty;
                    if (exportFields.includes('descricao')) item.descricao = ''; // Contagem avulsa não tem descrição
                    if (exportFields.includes('sessao')) item.sessao = session.session_name;
                    if (exportFields.includes('data_hora')) item.data_hora = new Date(scan.created_at).toISOString().replace('T', ' ').substring(0, 19);
                    
                    return item;
                });
            }
        }
        
        if (exportData.length === 0) {
            showMessage('Não há dados para exportar.', 'warning', 'exportar');
            return;
        }
        

        
        // Gerar arquivo baseado no formato selecionado
        // Definir ordem específica dos campos baseada no tipo de exportação e campos selecionados
        let headers;
        if (exportType === 'grouped') {
            // Ordem para agrupada: codigo, quantidade_contada, descricao
            headers = ['codigo', 'quantidade_contada', 'descricao'].filter(field => 
                exportFields.includes(field)
            );
        } else {
            // Ordem para linha a linha: codigo, quantidade_contada, descricao, data_hora
            headers = ['codigo', 'quantidade_contada', 'descricao', 'data_hora'].filter(field => 
                exportFields.includes(field)
            );
        }
        
        // Adicionar outros campos selecionados que possam existir mas não estão na ordem específica
        const remainingHeaders = exportFields.filter(field => !headers.includes(field));
        headers = [...headers, ...remainingHeaders];
        const exportFormat = appState.exportFormat;
        let content = '';
        let mimeType = '';
        let fileExtension = '';
        
        if (exportFormat === 'csv') {
            // Gerar CSV
            content = headers.join(',') + '\n';
            
            exportData.forEach(item => {
                const values = headers.map(header => {
                    const value = item[header] || '';
                    // Escapar aspas e adicionar aspas se necessário
                    return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n')) 
                        ? '"' + value.replace(/"/g, '""') + '"' 
                        : value;
                });
                
                content += values.join(',') + '\n';
            });
            
            mimeType = 'text/csv;charset=utf-8;';
            fileExtension = 'csv';
        } else {
            // Gerar TXT (formato delimitado por tabulação)
            content = headers.join('\t') + '\n';
            
            exportData.forEach(item => {
                const values = headers.map(header => item[header] || '');
                content += values.join('\t') + '\n';
            });
            
            mimeType = 'text/plain;charset=utf-8;';
            fileExtension = 'txt';
        }
        
        // Criar blob e link para download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${session.session_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('Dados exportados com sucesso!', 'success', 'exportar');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        showMessage('Erro ao exportar dados.', 'error', 'exportar');
    }
}

// Limpar todo o histórico
async function clearAllHistory() {
    if (!confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        // Obter usuário atual
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            showAuthSection();
            return;
        }
        
        // Buscar sessões do usuário
        const { data: sessions, error: sessionsError } = await supabaseClient
            .from('counting_sessions')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'completed');
        
        if (sessionsError) throw sessionsError;
        
        if (!sessions || sessions.length === 0) {
            showMessage('Não há sessões para limpar.', 'warning', 'historico');
            return;
        }
        
        // Excluir cada sessão
        for (const session of sessions) {
            await deleteSession(session.id, false);
        }
        
        // Atualizar interface
        loadSessionHistory();
        
        showMessage('Histórico limpo com sucesso!', 'success', 'historico');
    } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        showMessage('Erro ao limpar histórico.', 'error', 'historico');
    }
}

// Visualizar detalhes da sessão
async function viewSessionDetails(sessionId) {
    try {
        // Buscar sessão
        const { data: session, error: sessionError } = await supabaseClient
            .from('counting_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
            showMessage('Sessão não encontrada.', 'error', 'historico');
            return;
        }
        
        // Exportar dados da sessão
        exportSessionData(sessionId);
    } catch (error) {
        console.error('Erro ao visualizar detalhes da sessão:', error);
        showMessage('Erro ao visualizar detalhes da sessão.', 'error', 'historico');
    }
}

// Excluir sessão
async function deleteSession(sessionId, updateUI = true) {
    try {
        // Excluir scans da sessão
        const { error: scansError } = await supabaseClient
            .from('scans')
            .delete()
            .eq('session_id', sessionId);
        
        if (scansError) throw scansError;
        
        // Excluir produtos da sessão
        const { error: productsError } = await supabaseClient
            .from('products')
            .delete()
            .eq('session_id', sessionId);
        
        if (productsError) throw productsError;
        
        // Excluir sessão
        const { error: sessionError } = await supabaseClient
            .from('counting_sessions')
            .delete()
            .eq('id', sessionId);
        
        if (sessionError) throw sessionError;
        
        // Atualizar interface
        if (updateUI) {
            loadSessionHistory();
            showMessage('Sessão excluída com sucesso!', 'success', 'historico');
        }
    } catch (error) {
        console.error('Erro ao excluir sessão:', error);
        if (updateUI) {
            showMessage('Erro ao excluir sessão.', 'error', 'historico');
        }
    }
}

// A função toggleSidebar foi movida para menu.js para evitar duplicação

// Funções de Loading
function showLoading(text = 'Carregando...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    if (overlay && loadingText) {
        loadingText.textContent = text;
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function showButtonLoading(button, text = null) {
    if (!button) return;
    
    button.classList.add('btn-loading');
    button.disabled = true;
    
    // Adicionar spinner se não existir
    if (!button.querySelector('.loading-spinner')) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        button.insertBefore(spinner, button.firstChild);
    }
    
    // Atualizar texto se fornecido
    if (text) {
        const textElement = button.querySelector('.btn-text') || button;
        if (textElement !== button) {
            textElement.textContent = text;
        } else {
            // Criar span para o texto se não existir
            const span = document.createElement('span');
            span.className = 'btn-text';
            span.textContent = text;
            button.appendChild(span);
        }
    }
}

function hideButtonLoading(button, originalText = null) {
    if (!button) return;
    
    button.classList.remove('btn-loading');
    button.disabled = false;
    
    // Remover spinner
    const spinner = button.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
    
    // Restaurar texto original se fornecido
    if (originalText) {
        const textElement = button.querySelector('.btn-text');
        if (textElement) {
            textElement.textContent = originalText;
        } else {
            button.textContent = originalText;
        }
    }
}

// Funcionalidades PWA
function setupPWA() {
    // Detectar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
        appState.isInstalled = true;
        console.log('PWA já está instalado');
    }
    
    // Capturar evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA pode ser instalado');
        e.preventDefault();
        appState.deferredPrompt = e;
        showInstallPrompt();
    });
    
    // Detectar quando o app é instalado
    window.addEventListener('appinstalled', () => {
        console.log('PWA foi instalado');
        appState.isInstalled = true;
        appState.deferredPrompt = null;
        hideInstallPrompt();
        showMessage('Aplicativo instalado com sucesso!', 'success');
    });
}

function showInstallPrompt() {
    if (appState.isInstalled || !appState.deferredPrompt) return;
    
    // Criar botão de instalação se não existir
    let installBtn = document.getElementById('install-btn');
    if (!installBtn) {
        installBtn = document.createElement('button');
        installBtn.id = 'install-btn';
        installBtn.className = 'install-btn';
        installBtn.innerHTML = '<i class="fas fa-download"></i> Instalar App';
        installBtn.addEventListener('click', installPWA);
        
        // Adicionar ao header
        const header = document.querySelector('.header-content');
        if (header) {
            header.appendChild(installBtn);
        }
    }
}

function hideInstallPrompt() {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.remove();
    }
}

async function installPWA() {
    if (!appState.deferredPrompt) return;
    
    // Mostrar o prompt de instalação
    appState.deferredPrompt.prompt();
    
    // Aguardar a escolha do usuário
    const { outcome } = await appState.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA');
    } else {
        console.log('Usuário recusou instalar o PWA');
    }
    
    // Limpar o prompt
    appState.deferredPrompt = null;
    hideInstallPrompt();
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupPWA();
});