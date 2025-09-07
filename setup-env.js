// Script para configurar variáveis de ambiente do Supabase
// Execute este script para configurar automaticamente as variáveis

const fs = require('fs');
const path = require('path');

// Função para criar arquivo .env.local para desenvolvimento
function createEnvFile() {
    const envContent = `# Configurações do Supabase
# Substitua pelos valores do seu projeto

# URL do projeto Supabase (encontre em Settings > API)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave anônima do Supabase (encontre em Settings > API)
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Instruções:
# 1. Acesse https://app.supabase.com
# 2. Selecione seu projeto
# 3. Vá em Settings > API
# 4. Copie a "Project URL" e cole em VITE_SUPABASE_URL
# 5. Copie a "anon public" key e cole em VITE_SUPABASE_ANON_KEY
# 6. Salve este arquivo
`;

    const envPath = path.join(__dirname, '.env.local');
    
    if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Arquivo .env.local criado!');
        console.log('📝 Edite o arquivo .env.local com suas configurações do Supabase');
    } else {
        console.log('⚠️  Arquivo .env.local já existe');
    }
}

// Função para verificar se as variáveis estão configuradas
function checkEnvVariables() {
    const envPath = path.join(__dirname, '.env.local');
    
    if (!fs.existsSync(envPath)) {
        console.log('❌ Arquivo .env.local não encontrado');
        return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasUrl = envContent.includes('VITE_SUPABASE_URL=https://') && !envContent.includes('seu-projeto.supabase.co');
    const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=') && !envContent.includes('sua_chave_anonima_aqui');
    
    if (hasUrl && hasKey) {
        console.log('✅ Variáveis de ambiente configuradas corretamente!');
        return true;
    } else {
        console.log('❌ Variáveis de ambiente não configuradas');
        if (!hasUrl) console.log('   - Configure VITE_SUPABASE_URL');
        if (!hasKey) console.log('   - Configure VITE_SUPABASE_ANON_KEY');
        return false;
    }
}

// Função principal
function main() {
    console.log('🚀 Configuração do SmartCount para Vercel\n');
    
    // Criar arquivo .env.local se não existir
    createEnvFile();
    
    console.log('\n📋 Checklist para deploy na Vercel:');
    console.log('\n1. ✅ Arquivo vercel.json criado');
    console.log('2. ✅ Arquivo .gitignore criado');
    console.log('3. ✅ PWA reabilitado para produção');
    console.log('4. 📝 Configure as variáveis no .env.local');
    console.log('5. 🔄 Faça commit e push para o GitHub');
    console.log('6. 🚀 Importe o projeto na Vercel');
    console.log('7. ⚙️  Configure as variáveis de ambiente na Vercel');
    
    console.log('\n📖 Leia o arquivo DEPLOY.md para instruções detalhadas');
    
    // Verificar configuração
    setTimeout(() => {
        console.log('\n🔍 Verificando configuração atual...');
        checkEnvVariables();
    }, 1000);
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { createEnvFile, checkEnvVariables };