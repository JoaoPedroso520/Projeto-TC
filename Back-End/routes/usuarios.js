const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET todos os usuários
router.get('/', async (req, res) => {
  try {
    const usuarios = await User.find().select('-senha').sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao carregar usuários' });
  }
});

// POST novo usuário
router.post('/', async (req, res) => {
  try {
    const { usuario, email, senha, ativo } = req.body;

    if (!usuario || !email || !senha) {
      return res.status(400).json({ erro: 'Usuário, e-mail e senha são obrigatórios' });
    }

    const emailExistente = await User.findOne({ email });
    if (emailExistente) return res.status(400).json({ erro: 'E-mail já está em uso' });

    const usuarioExistente = await User.findOne({ usuario });
    if (usuarioExistente) return res.status(400).json({ erro: 'Nome de usuário já está em uso' });

    const novoUser = new User({ usuario, email, senha, ativo });
    await novoUser.save();

    res.status(201).json({ sucesso: true, mensagem: 'Usuário criado com sucesso' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar usuário: ' + erro.message });
  }
});

// PUT atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, email, senha, ativo } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    if (usuario && usuario !== user.usuario) {
      const usuarioExistente = await User.findOne({ usuario });
      if (usuarioExistente) return res.status(400).json({ erro: 'Nome de usuário já está em uso' });
      user.usuario = usuario;
    }

    if (email && email !== user.email) {
      const emailExistente = await User.findOne({ email });
      if (emailExistente) return res.status(400).json({ erro: 'E-mail já está em uso' });
      user.email = email;
    }

    if (senha && senha.trim() !== '') {
      user.senha = senha;
    }

    if (ativo !== undefined) {
      user.ativo = ativo;
    }

    await user.save();
    res.json({ sucesso: true, mensagem: 'Usuário atualizado com sucesso' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar usuário: ' + erro.message });
  }
});

// DELETE deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const contagem = await User.countDocuments();
    if (contagem <= 1) {
      return res.status(400).json({ erro: 'Não é possível excluir o único administrador do sistema.' });
    }

    const deletado = await User.findByIdAndDelete(id);
    if (!deletado) return res.status(404).json({ erro: 'Usuário não encontrado' });

    res.json({ sucesso: true, mensagem: 'Usuário deletado' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao deletar usuário: ' + erro.message });
  }
});

module.exports = router;
