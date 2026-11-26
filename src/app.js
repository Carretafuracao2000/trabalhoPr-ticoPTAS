import express from 'express';
import livrosRoutes from './routes/livros.routes.js';
import exemplaresRoutes from './routes/exemplares.routes.js';
import leitoresRoutes from './routes/leitores.routes.js';
import emprestimosRoutes from './routes/emprestimos.routes.js';
import { ErroDaAplicacao } from './services/erros.js';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const inicio = Date.now();

  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inicio}ms)`);
  });

  next();
});

app.use('/livros', livrosRoutes);
app.use('/exemplares', exemplaresRoutes);
app.use('/leitores', leitoresRoutes);
app.use('/emprestimos', emprestimosRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

app.use((erro, req, res, next) => {
  if (erro instanceof ErroDaAplicacao) {
    return res.status(erro.status).json({ erro: erro.message, ...erro.detalhes });
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }

  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default app;
