const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Login
router.post('/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
    }

    const usuarioLimpo = usuario.trim();

    const user = await User.findOne({
      $or: [
        { usuario: { $regex: `^${usuarioLimpo}$`, $options: 'i' } },
        { email: { $regex: `^${usuarioLimpo}$`, $options: 'i' } }
      ]
    });

    if (!user) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    if (!user.verificarSenha(senha)) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    // Criar JWT real
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

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

    try {
      jwt.verify(token, process.env.JWT_SECRET);
      res.json({ autenticado: true });
    } catch (err) {
      return res.status(401).json({ autenticado: false });
    }
  } catch (erro) {
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ sucesso: true, mensagem: 'Logout realizado' });
});

module.exports = router;
