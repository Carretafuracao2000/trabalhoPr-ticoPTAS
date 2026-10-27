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

function calcularMulta(dataPrevistaDevolucao, dataDeReferencia){
    const diasDeAtraso = Math.max(0, calcularDiasEntre(dataPrevistaDevolucao, dataDeReferencia))
    const valorDaMulta = diasDeAtraso * VALOR_MULTA_POR_DIA

    return {diasDeAtraso, valorDaMulta}
}

// Acrescenta ao empréstimo os campos calculados: status, diasAtraso e multa
function detalharEmprestimo(emprestimo){
    const dataDeReferencia = emprestimo.dataDevolucao || obterDataDeHoje()
    const {diasDeAtraso, valorDaMulta} = calcularMulta(emprestimo.dataPrevistaDevolucao, dataDeReferencia)

    let status = 'em_dia'

    if(emprestimo.dataDevolucao){
        status = 'devolvido'
    } else if(diasDeAtraso > 0){
        status = 'atrasado'
    }

    return {...emprestimo, status, diasAtraso: diasDeAtraso, multa: valorDaMulta}
}

// Regra 2: leitor com atraso ou multa não paga fica bloqueado para novos empréstimos
function consultarSituacaoDoLeitor(leitorId){
    const pendencias = bancoDeDados.emprestimos
        .filter(emprestimo => emprestimo.leitorId === leitorId)
        .map(detalharEmprestimo)
        .filter(emprestimo => emprestimo.multa > 0 && !emprestimo.multaPaga)
        .map(emprestimo => ({
            emprestimoId: emprestimo.id,
            status: emprestimo.status,
            diasAtraso: emprestimo.diasAtraso,
            multa: emprestimo.multa
        }))

    const totalMultaPendente = pendencias.reduce((total, pendencia) => total + pendencia.multa, 0)

    return {bloqueado: pendencias.length > 0, totalMultaPendente, pendencias}
}

function exemplarEstaDisponivel(exemplarId){
    const estaEmprestado = bancoDeDados.emprestimos.some(
        emprestimo => emprestimo.exemplarId === exemplarId && !emprestimo.dataDevolucao
    )

    return !estaEmprestado
}

function comDisponibilidade(exemplar){
    return {...exemplar, disponivel: exemplarEstaDisponivel(exemplar.id)}
}

function removerDaLista(lista, item){
    lista.splice(lista.indexOf(item), 1)
}

const buscarLivro = criarBuscaPorId(bancoDeDados.livros, 'livro', 'Livro')
const verificarExemplar = criarVerificacaoDeExemplar(bancoDeDados)
const verificarEmprestimoPermitido = criarVerificacaoDeEmprestimo(bancoDeDados, consultarSituacaoDoLeitor, exemplarEstaDisponivel)

const impedirExclusaoDoLivro = impedirExclusaoSeEmUso(bancoDeDados.exemplares, 'livroId', 'livro', 'Livro possui exemplares cadastrados')
const impedirExclusaoDoExemplar = impedirExclusaoSeEmUso(bancoDeDados.emprestimos, 'exemplarId', 'exemplar', 'Exemplar possui empréstimos registrados')
const impedirExclusaoDoLeitor = impedirExclusaoSeEmUso(bancoDeDados.emprestimos, 'leitorId', 'leitor', 'Leitor possui empréstimos registrados')

app.use(express.json())
app.use(registrarRequisicao)

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

app.get('/exemplares', (req, res) => {
    let exemplares = bancoDeDados.exemplares

    if(req.query.livroId){
        const livroId = Number(req.query.livroId)
        exemplares = exemplares.filter(exemplar => exemplar.livroId === livroId)
    }

    res.json(exemplares.map(comDisponibilidade))
})

app.get('/exemplares/:id', buscarExemplar, (req, res) => {
    res.json(comDisponibilidade(req.exemplar))
})

app.post('/exemplares', validarExemplar, verificarExemplar, (req, res) => {
    const {livroId, codigo} = req.body
    const novoExemplar = {id: bancoDeDados.proximoId.exemplar++, livroId, codigo}

    bancoDeDados.exemplares.push(novoExemplar)

    res.status(201).json(comDisponibilidade(novoExemplar))
})

app.put('/exemplares/:id', buscarExemplar, validarExemplar, verificarExemplar, (req, res) => {
    const {livroId, codigo} = req.body

    Object.assign(req.exemplar, {livroId, codigo})

    res.json(comDisponibilidade(req.exemplar))
})

app.delete('/exemplares/:id', buscarExemplar, impedirExclusaoDoExemplar, (req, res) => {
    removerDaLista(bancoDeDados.exemplares, req.exemplar)

    res.status(204).send()
})

// ---------- Leitores ----------

app.get('/leitores', (req, res) => {
    res.json(bancoDeDados.leitores)
})

app.get('/leitores/:id', buscarLeitor, (req, res) => {
    res.json(req.leitor)
})

app.get('/leitores/:id/situacao', buscarLeitor, (req, res) => {
    res.json({
        leitorId: req.leitor.id,
        nome: req.leitor.nome,
        ...consultarSituacaoDoLeitor(req.leitor.id)
    })
})

app.post('/leitores', validarLeitor, (req, res) => {
    const {nome, telefone} = req.body
    const novoLeitor = {id: bancoDeDados.proximoId.leitor++, nome, telefone: telefone ?? null}

    bancoDeDados.leitores.push(novoLeitor)

    res.status(201).json(novoLeitor)
})

app.put('/leitores/:id', buscarLeitor, validarLeitor, (req, res) => {
    const {nome, telefone} = req.body

    Object.assign(req.leitor, {nome, telefone: telefone ?? null})

    res.json(req.leitor)
})

app.delete('/leitores/:id', buscarLeitor, impedirExclusaoDoLeitor, (req, res) => {
    removerDaLista(bancoDeDados.leitores, req.leitor)

    res.status(204).send()
})

// ---------- Empréstimos ----------

app.get('/emprestimos', (req, res) => {
    let emprestimos = bancoDeDados.emprestimos.map(detalharEmprestimo)

    if(req.query.leitorId){
        const leitorId = Number(req.query.leitorId)
        emprestimos = emprestimos.filter(emprestimo => emprestimo.leitorId === leitorId)
    }

    if(req.query.status){
        emprestimos = emprestimos.filter(emprestimo => emprestimo.status === req.query.status)
    }

    res.json(emprestimos)
})

app.get('/emprestimos/:id', buscarEmprestimo, (req, res) => {
    res.json(detalharEmprestimo(req.emprestimo))
})

app.post('/emprestimos', validarEmprestimo, verificarEmprestimoPermitido, (req, res) => {
    const {leitorId, exemplarId, dataEmprestimo} = req.body
    const dataDoEmprestimo = dataEmprestimo ?? obterDataDeHoje()

    const novoEmprestimo = {
        id: bancoDeDados.proximoId.emprestimo++,
        leitorId,
        exemplarId,
        dataEmprestimo: dataDoEmprestimo,
        dataPrevistaDevolucao: somarDias(dataDoEmprestimo, PRAZO_EMPRESTIMO_EM_DIAS),
        dataDevolucao: null,
        multaPaga: false,
        dataPagamento: null
    }

    bancoDeDados.emprestimos.push(novoEmprestimo)

    res.status(201).json(detalharEmprestimo(novoEmprestimo))
})

app.post('/emprestimos/:id/devolucao', buscarEmprestimo, verificarEmprestimoEmAberto, validarDevolucao, (req, res) => {
    const dataDaDevolucao = req.body?.dataDevolucao ?? obterDataDeHoje()
    const {valorDaMulta} = calcularMulta(req.emprestimo.dataPrevistaDevolucao, dataDaDevolucao)

    req.emprestimo.dataDevolucao = dataDaDevolucao
    // Devolvido no prazo: não existe multa a pagar
    req.emprestimo.multaPaga = valorDaMulta === 0

    res.json(detalharEmprestimo(req.emprestimo))
})

app.post('/emprestimos/:id/pagamento', buscarEmprestimo, verificarEmprestimoDevolvido, (req, res) => {
    const {multa} = detalharEmprestimo(req.emprestimo)

    if(multa === 0){
        return res.status(409).json({erro: 'Este empréstimo não possui multa'})
    }

    if(req.emprestimo.multaPaga){
        return res.status(409).json({erro: 'Multa já foi paga'})
    }

    req.emprestimo.multaPaga = true
    req.emprestimo.dataPagamento = obterDataDeHoje()

    res.json(detalharEmprestimo(req.emprestimo))
})

app.use(rotaNaoEncontrada)
app.use(tratarErros)

app.listen(PORTA, () => {
    console.log(`API da biblioteca rodando em http://localhost:${PORTA}`)
})


app.listen(PORTA, () => {
    console.log(`API da biblioteca rodando em http://localhost:${PORTA}`)
})