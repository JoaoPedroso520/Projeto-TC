const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');

const app = express();
app.set('trust proxy', 1);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rotas
app.use('/api/noticias', require('./routes/noticias'));
app.use('/api/anuncios', require('./routes/anuncios'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/utils', require('./routes/utils'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/imagens', require('./routes/imagens'));
app.use('/api/usuarios', require('./routes/usuarios'));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    mensagem: 'API C7 Noticias rodando',
  });
});

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
  });
});

// Erro 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (erro) {
    console.error('Falha ao iniciar servidor:', erro.message);
    process.exit(1);
  }
}

startServer();
