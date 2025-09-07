# Deploy do SmartCount na Vercel

Guia completo para fazer o deploy do aplicativo SmartCount na Vercel com integração Supabase.

## Pré-requisitos

- Conta na Vercel integrada com sua conta Trae
- Projeto Supabase configurado
- Repositório Git com o código do SmartCount

## Passos para Deploy

### 1. Preparar o Projeto

1. **Verificar arquivos necessários:**
   - ✅ `vercel.json` (já criado)
   - ✅ `index.html`
   - ✅ `manifest.json`
   - ✅ `sw.js`
   - ✅ Pasta `js/` com `app.js`
   - ✅ Pasta `css/` com `styles.css`

### 2. Configurar Variáveis de Ambiente na Vercel

1. **Acesse o dashboard da Vercel**
2. **Vá para Settings > Environment Variables**
3. **Adicione as seguintes variáveis:**

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

**Para obter essas informações do Supabase:**
- Acesse seu projeto no Supabase Dashboard
- Vá em Settings > API
- Copie a "Project URL" e "anon public key"

### 3. Atualizar o Código para Usar Variáveis de Ambiente

**IMPORTANTE:** Você precisará modificar o `app.js` para usar as variáveis de ambiente em produção:

```javascript
// No início do app.js, substitua as configurações hardcoded por:
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'sua_url_local';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sua_chave_local';
```

### 4. Deploy na Vercel

#### Opção A: Via Dashboard da Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente
5. Clique em "Deploy"

#### Opção B: Via CLI da Vercel
```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel
```

### 5. Configurações Pós-Deploy

1. **Verificar PWA:**
   - Descomente as linhas do Service Worker no `index.html`
   - Descomente a referência ao `manifest.json`

2. **Testar funcionalidades:**
   - Login/Registro
   - Contagem
   - Import CSV
   - PWA (instalação)

### 6. Domínio Personalizado (Opcional)

1. Na Vercel, vá em Settings > Domains
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções

## Estrutura de Arquivos para Deploy

```
SmartCount/
├── index.html              # Página principal
├── vercel.json            # Configuração da Vercel
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
├── favicon.svg            # Ícone
├── css/
│   └── styles.css         # Estilos
├── js/
│   ├── app.js            # Lógica principal
│   └── menu.js           # Menu lateral
└── DEPLOY.md             # Este guia
```

## Troubleshooting

### Erro de CORS
- Verifique se as URLs do Supabase estão corretas
- Confirme que o domínio da Vercel está autorizado no Supabase

### Service Worker não funciona
- Verifique se o `sw.js` está sendo servido corretamente
- Confirme que o HTTPS está ativo (Vercel usa HTTPS por padrão)

### Variáveis de ambiente não funcionam
- Para aplicações estáticas, use `VITE_` como prefixo
- Redeploy após adicionar novas variáveis

## URLs Importantes

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Documentação Vercel:** https://vercel.com/docs

## Próximos Passos

1. Fazer o deploy inicial
2. Testar todas as funcionalidades
3. Configurar domínio personalizado (se necessário)
4. Monitorar logs e performance
5. Configurar analytics (opcional)