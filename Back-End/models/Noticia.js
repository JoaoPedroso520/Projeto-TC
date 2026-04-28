const mongoose = require('mongoose');

const noticiaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
      maxlength: 200,
    },
    conteudo: {
      type: String,
      required: [true, 'Conteúdo é obrigatório'],
    },
    foto: {
      type: String,
      required: [true, 'Foto é obrigatória'],
    },
    categoria: {
      type: String,
      required: [true, 'Categoria é obrigatória'],
      trim: true,
    },
    autor: {
      type: String,
      default: 'Administrador',
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Noticia', noticiaSchema);
