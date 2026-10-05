import express from "express"

const app = express()
const PORTA = process.env.PORT || 3000

const VALOR_MULTA_POR_DIA = 5
const PRAZO_EMPRESTIMO_EM_DIAS = 14

const bancoDeDados = {
    livros: [],
    exemplares: [],
    leitores: [],
    emprestimos: [],
    proximoId: {livro: 1, exemplar: 1, leitor: 1, emprestimo: 1}
}

app.use(express.json())

app.get('/livros', (req, res) => {
    res.json(bancoDeDados.livros)
})

app.listen(PORTA, () => {
    console.log(`API da biblioteca rodando em http://localhost:${PORTA}`)
})