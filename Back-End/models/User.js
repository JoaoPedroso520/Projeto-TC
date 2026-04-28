const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    usuario: {
      type: String,
      required: [true, 'Usuário é obrigatório'],
      unique: true,
      trim: true,
    },
    senha: {
      type: String,
      required: [true, 'Senha é obrigatória'],
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Criptografar senha antes de salvar
userSchema.pre('save', function (next) {
  if (!this.isModified('senha')) return next();

  this.senha = crypto
    .createHash('sha256')
    .update(this.senha)
    .digest('hex');

  next();
});

// Verificar senha
userSchema.methods.verificarSenha = function (senha) {
  const hashSenha = crypto
    .createHash('sha256')
    .update(senha)
    .digest('hex');

  return this.senha === hashSenha;
};

module.exports = mongoose.model('User', userSchema);
