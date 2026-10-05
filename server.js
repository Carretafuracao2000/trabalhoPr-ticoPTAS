import express from "express"

import criarBuscaPorId from "./middlewares/buscarPorId.js"

const app = express()
const PORTA = 3000

const VALOR_MULTA_POR_DIA = 5
const PRAZO_EMPRESTIMO_EM_DIAS = 14

const bancoDeDados = {
    livros: [],
    exemplares: [],
    leitores: [],
    emprestimos: [],
    proximoId: {livro: 1, exemplar: 1, leitor: 1, emprestimo: 1}
}

const buscarLivro = criarBuscaPorId(bancoDeDados.livros, 'livro', 'Livro')

app.use(express.json())

app.get('/livros', (req, res) => {
    res.json(bancoDeDados.livros)
})

app.get('/livros/:id', buscarLivro, (req, res) => {
    res.json(req.livro)
})

app.listen(PORTA, () => {
    console.log(`API da biblioteca rodando em http://localhost:${PORTA}`)
})