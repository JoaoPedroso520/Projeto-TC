const mongoose = require('mongoose');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const categoriaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Nome da categoria é obrigatório'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

categoriaSchema.pre('save', function (next) {
  if (this.isModified('nome') || !this.slug) {
    this.slug = slugify(this.nome);
  }
  next();
});

module.exports = mongoose.model('Categoria', categoriaSchema);
