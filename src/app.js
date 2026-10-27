import express from 'express'
importmpres etimoRoutes from './routes/emprestimos.routes.js';
import exemplaresRoutes from './routes/exemplares.routes.js';
import leitoresRoutes from './routes/leitores.routes.js';
import livrosRoutes from './routes/livros.routes.js';

const app = express();

app.use(express.json());
app.use('/emprestimos', emprestimoRoutes);
app.use('/exemplares', exemplaresRoutes);
app.use('/leitores', leitoresRoutes);
app.use('/livros', livrosRoutes);

export default app;
