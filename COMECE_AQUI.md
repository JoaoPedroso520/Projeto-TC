# 🚀 COMO RODAR O PROJETO C7 NOTÍCIAS

## Passo 1: Instalar o MongoDB
Baixe e instale o MongoDB Community Edition:
- Windows: https://www.mongodb.com/try/download/community
- Depois de instalar, o MongoDB deve estar rodando automaticamente

## Passo 2: Terminal 1 - Iniciar o Backend

```bash
# Navegue para a pasta Back-End
cd "Back-End"

# Instale as dependências (execute apenas uma vez)
npm install

# Inicie o servidor
npm start
```

Você deverá ver algo como:
```
MongoDB conectado: localhost
Servidor rodando na porta 5000
```

## Passo 3: Terminal 2 - Iniciar o Frontend

```bash
# Abra um novo terminal e navegue até a pasta raiz do projeto
cd "C7 Noticias"

# Use a extensão "Live Server" do VS Code:
# 1. Abra a pasta Front-End no VS Code
# 2. Clique com botão direito em index.html
# 3. Selecione "Open with Live Server"
```

Ou acesse manualmente:
- A página abrirá em `http://localhost:5500/index.html`

## Passo 4: Acessar o Admin

1. Na página principal (index.html), clique no botão "Painel Admin"
2. Ou acesse direto: `http://localhost:5500/admin.html`
3. Crie sua primeira notícia!

## ✅ Pronto!

Agora você pode:
- ✅ Criar, editar e deletar notícias
- ✅ Criar, editar e deletar anúncios  
- ✅ Ver os anúncios na página principal
- ✅ Visualizar notícias por categoria

## 🐛 Se encontrar erros:

1. **"Cannot connect to MongoDB"** → Verifique se o MongoDB está rodando
2. **"CORS error"** → Certifique-se que o backend está rodando na porta 5000
3. **Página branca** → Abra o DevTools (F12) e verifique os erros no console

## 📌 URLs Importantes

- **Frontend**: http://localhost:5500
- **Admin**: http://localhost:5500/admin.html
- **API Backend**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health
