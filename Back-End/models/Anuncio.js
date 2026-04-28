const mongoose = require('mongoose');

const anuncioSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
    },
    foto: {
      type: String,
      required: [true, 'Foto do banner é obrigatória'],
    },
    link: {
      type: String,
      default: '#',
    },
    dataInicio: {
      type: Date,
      required: [true, 'Data de início é obrigatória'],
    },
    dataFim: {
      type: Date,
      required: [true, 'Data de término é obrigatória'],
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    cliques: {
      type: Number,
      default: 0,
    },
    posicao: {
      type: String,
      enum: ['topo', 'meio', 'lateral', 'rodape'],
      default: 'topo',
    },
    tempoRotacaoSeg: {
      type: Number,
      min: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Anuncio', anuncioSchema);
