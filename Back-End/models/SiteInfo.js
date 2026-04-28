const mongoose = require('mongoose');

const siteInfoSchema = new mongoose.Schema(
  {
    resumo: { type: String, default: '' },
    diferencial: { type: String, default: '' },
    desenvolvimento: { type: String, default: '' },
    requisitosFuncionais: { type: String, default: '' },
    requisitosNaoFuncionais: { type: String, default: '' },
    arquitetura: { type: String, default: '' },
    modelagemBanco: { type: String, default: '' },
    fluxogramaUrl: { type: String, default: '' },
    diagramaCasoUsoUrl: { type: String, default: '' },
    modeloConceitualUrl: { type: String, default: '' },
    diagramaClassesUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteInfo', siteInfoSchema);
