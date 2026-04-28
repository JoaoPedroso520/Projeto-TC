# C7 Notícias - Sistema de Gerenciamento de Notícias

Um sistema completo de gerenciamento de notícias com backend Node.js/Express e frontend HTML/CSS/JavaScript, utilizando MongoDB como banco de dados.

## 📋 Características

### Frontend
- ✅ Interface responsiva e moderna
- ✅ Página principal com banner, categorias e notícias
- ✅ Sistema de anúncios (topo, lateral, rodapé)
- ✅ Modal para visualizar notícias completas
- ✅ Painel administrativo intuitivo

### Backend
- ✅ API REST com Express.js
- ✅ MongoDB como banco de dados NoSQL
- ✅ Gerenciamento de notícias (CRUD)
- ✅ Gerenciamento de anúncios (CRUD)
- ✅ Contagem de visualizações
- ✅ Contagem de cliques em anúncios

## 🚀 Instalação e Setup

### Pré-requisitos
- Node.js (v14 ou superior)
- MongoDB instalado e rodando localmente
- Um editor de código (VS Code recomendado)

### Backend

1. Navegue para a pasta do Backend:
```bash
cd "Back-End"
```

2. Instale as dependências:
```bash
npm install
```

3. Verifique o arquivo `.env`:
```
MONGODB_URI=mongodb://localhost:27017/c7-noticias
PORT=5000
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_aqui
```

4. Inicie o servidor:
```bash
npm start
```

Se desejar modo de desenvolvimento com reinicialização automática:
```bash
npm run dev
```

O servidor estará rodando em: `http://localhost:5000`

### Frontend

1. Navegue para a pasta do Frontend:
```bash
cd "Front-End"
```

2. Configure o arquivo `js/main.js` e `js/admin.js`:
   - A URL da API já está configurada como `http://localhost:5000/api`

3. Abra `index.html` em um servidor web local (recomendado usar a extensão "Live Server" do VS Code)

O frontend estará disponível em: `http://localhost:5500` (ou porta do seu servidor)

## 📱 Uso do Sistema

### Página Principal (index.html)
- Visualize todas as notícias
- Filtre por categoria usando o menu
- Clique em uma notícia para ler completa
- Veja anúncios em topo, lateral e rodapé

### Painel Admin (admin.html)
- Acesse pelo botão "Painel Admin" na página principal
- **Gerenciar Notícias:**
  - Criar nova notícia com título, categoria, foto e conteúdo
  - Editar notícias existentes
  - Deletar notícias
  - Ver estatísticas de visualizações

- **Gerenciar Anúncios:**
  - Criar novo anúncio com foto/banner
  - Definir período de exibição (data início e fim)
  - Escolher posição (topo, lateral, rodapé)
  - Ligar/desligar anúncio
  - Ver estatísticas de cliques

## 🏗️ Estrutura do Projeto

```
C7 Noticias/
├── Back-End/
│   ├── config/
│   │   └── database.js          # Configuração MongoDB
│   ├── controllers/
│   │   ├── noticiaController.js # Lógica de notícias
│   │   └── anuncioController.js # Lógica de anúncios
│   ├── models/
│   │   ├── Noticia.js           # Schema de Notícia
│   │   └── Anuncio.js           # Schema de Anúncio
│   ├── routes/
│   │   ├── noticias.js          # Rotas de notícias
│   │   └── anuncios.js          # Rotas de anúncios
│   ├── .env                     # Configurações de ambiente
│   ├── .gitignore
│   ├── package.json
│   └── server.js                # Servidor principal
│
└── Front-End/
    ├── css/
    │   ├── style.css            # Estilos da página principal
    │   └── admin.css            # Estilos do painel admin
    ├── js/
    │   ├── main.js              # Scripts da página principal
    │   └── admin.js             # Scripts do painel admin
    ├── index.html               # Página principal
    └── admin.html               # Painel admin
```

## 🗄️ Modelos de Dados

### Notícia
```javascript
{
  _id: ObjectId,
  titulo: String,
  conteudo: String,
  foto: String,
  categoria: String (enum),
  ativo: Boolean,
  views: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Categorias:** Tecnologia, Negócios, Saúde, Esportes, Entretenimento, Outros

### Anúncio
```javascript
{
  _id: ObjectId,
  titulo: String,
  foto: String,
  link: String,
  dataInicio: Date,
  dataFim: Date,
  ativo: Boolean,
  cliques: Number,
  posicao: String (enum),
  createdAt: Date,
  updatedAt: Date
}
```

**Posições:** topo, lateral, rodapé

## 📡 Endpoints da API

### Notícias
- `GET /api/noticias` - Obter todas as notícias
- `GET /api/noticias/:id` - Obter notícia por ID
- `GET /api/noticias/categoria/:categoria` - Obter notícias por categoria
- `POST /api/noticias` - Criar nova notícia
- `PUT /api/noticias/:id` - Atualizar notícia
- `DELETE /api/noticias/:id` - Deletar notícia

### Anúncios
- `GET /api/anuncios` - Obter anúncios ativos
- `GET /api/anuncios/posicao/:posicao` - Obter anúncios por posição
- `GET /api/anuncios/admin/todos` - Obter todos os anúncios (Admin)
- `POST /api/anuncios` - Criar novo anúncio
- `PUT /api/anuncios/:id` - Atualizar anúncio
- `DELETE /api/anuncios/:id` - Deletar anúncio
- `POST /api/anuncios/:id/clique` - Registrar clique no anúncio

## 🔧 Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **CORS** - Compartilhamento de recursos entre origens
- **dotenv** - Gerenciamento de variáveis de ambiente

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização responsiva
- **JavaScript (Vanilla)** - Interatividade
- **Fetch API** - Requisições HTTP

## 📝 Notas Adicionais

1. **Banco de Dados**: Certifique-se de que o MongoDB está rodando em `localhost:27017`
2. **CORS**: O backend está configurado para aceitar requisições do frontend
3. **Imagens**: Use URLs de imagens externas no formulário de notícias
4. **Responsividade**: O design é totalmente responsivo para mobile, tablet e desktop

## 🆘 Troubleshooting

### Erro: "Connection refused" ao conectar MongoDB
- Verifique se o MongoDB está rodando
- No Windows: `mongod`
- No Linux/Mac: `brew services start mongodb-community`

### Erro: CORS ao carregar página
- Certifique-se de que o backend está rodando
- Verifique a URL da API no frontend

### Notícias/Anúncios não carregam
- Abra o console do navegador (F12)
- Verifique os erros de requisição
- Confirme que a API está acessível

## 📄 Licença

Este projeto é fornecido como está para fins educacionais.

---

**Desenvolvido com ❤️ para C7 Notícias**
