const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/database');
const User = require('./models/User');

async function setupDatabase() {
  try {
    await connectDB();
    console.log('Conectado ao banco de dados');

    // Verificar se usuário admin existe
    const adminExistente = await User.findOne({ usuario: 'admin' });

    if (adminExistente) {
      console.log('✓ Usuário admin já existe');
      process.exit(0);
    }

    // Criar usuário admin padrão
    const admin = new User({
      usuario: 'admin',
      senha: 'admin123', // Isso será criptografado pelo middleware pre-save
      email: 'admin@c7noticias.com',
    });

    await admin.save();
    console.log('✓ Usuário admin criado com sucesso!');
    console.log('Credenciais:');
    console.log('  Usuário: admin');
    console.log('  Senha: admin123');
    console.log('  Email: admin@c7noticias.com');

    process.exit(0);
  } catch (erro) {
    console.error('Erro ao configurar banco:', erro.message);
    process.exit(1);
  }
}

setupDatabase();
