import express from "express"

import criarBuscaPorId from "./buscarPorId.js"
import {validarLivro, validarExemplar, validarLeitor, validarEmprestimo, validarDevolucao} from "./validarDados.js"
import {
    criarVerificacaoDeExemplar,
    criarVerificacaoDeEmprestimo,
    impedirExclusaoSeEmUso,
    verificarEmprestimoEmAberto,
    verificarEmprestimoDevolvido
} from "./middlewares/verificarRegras.js"


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

app.post('/livros', validarLivro, (req, res) => {
    const {titulo, autor, isbn} = req.body
    const novoLivro = {id: bancoDeDados.proximoId.livro++, titulo, autor, isbn: isbn ?? null}

    bancoDeDados.livros.push(novoLivro)

    res.status(201).json(novoLivro)
})

app.put('/livros/:id', buscarLivro, validarLivro, (req, res) => {
    const {titulo, autor, isbn} = req.body

    Object.assign(req.livro, {titulo, autor, isbn: isbn ?? null})

    res.json(req.livro)
})

app.delete('/livros/:id', buscarLivro, impedirExclusaoDoLivro, (req, res) => {
    removerDaLista(bancoDeDados.livros, req.livro)

    res.status(204).send()
})

app.listen(PORTA, () => {
    console.log(`API da biblioteca rodando em http://localhost:${PORTA}`)
})