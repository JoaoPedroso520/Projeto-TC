const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Ler o token do header
  const token = req.header('Authorization');

  // Checar se não tem token
  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  try {
    // Verificar token (espera formato "Bearer <token>")
    const tokenFormatado = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    
    const decoded = jwt.verify(tokenFormatado, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};
