const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

// Login
router.post('/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
    }

    const user = await User.findOne({ usuario: { $regex: `^${usuario}$`, $options: 'i' } });

    if (!user) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    if (!user.verificarSenha(senha)) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    // Criar token simples (em produção, usar JWT)
    const token = crypto.randomBytes(32).toString('hex');

    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      token: token,
      usuario: user.usuario,
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor: ' + erro.message });
  }
});

// Verificar login
router.post('/verificar', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ autenticado: false });
    }

    // Aqui você implementaria verificação real do JWT
    res.json({ autenticado: true });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ sucesso: true, mensagem: 'Logout realizado' });
});

module.exports = router;
