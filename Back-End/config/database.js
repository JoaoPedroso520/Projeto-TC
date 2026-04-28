const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/c7-noticias';

  if (!uri) {
    throw new Error('MONGODB_URI nao configurada');
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
