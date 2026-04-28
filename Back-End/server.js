const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const User = require('./models/User');

async function garantirAdminPadrao() {
  try {
    const adminExistente = await User.findOne({ usuario: 'admin' });
    if (!adminExistente) {
      await User.create({
        usuario: 'admin',
        senha: 'admin123',
        email: 'admin@c7noticias.com',
      });
      console.log('Usuário admin criado (usuario: admin / senha: admin123)');
    }
  } catch (erro) {
    console.error('Erro ao garantir usuário admin:', erro.message);
  }
}

// Conectar ao banco de dados
connectDB().then(garantirAdminPadrao);

const app = express();

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

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend funcionando!' });
});

// Erro 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
