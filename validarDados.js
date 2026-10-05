import {ehDataValida, obterDataDeHoje} from "../datas.js"

function ehTextoPreenchido(valor){
    return typeof valor === 'string' && valor.trim() !== ''
}

export function validarLivro(req, res, next){
    const {titulo, autor} = req.body ?? {}

    if(!ehTextoPreenchido(titulo) || !ehTextoPreenchido(autor)){
        return res.status(400).json({erro: 'Campos obrigatórios: titulo e autor'})
    }

    next()
}

export function validarExemplar(req, res, next){
    const {livroId, codigo} = req.body ?? {}

    if(!Number.isInteger(livroId) || !ehTextoPreenchido(codigo)){
        return res.status(400).json({erro: 'Campos obrigatórios: livroId (número) e codigo'})
    }

    next()
}

export function validarLeitor(req, res, next){
    const {nome} = req.body ?? {}

    if(!ehTextoPreenchido(nome)){
        return res.status(400).json({erro: 'Campo obrigatório: nome'})
    }

    next()
}

export function validarEmprestimo(req, res, next){
    const {leitorId, exemplarId, dataEmprestimo} = req.body ?? {}

    if(!Number.isInteger(leitorId) || !Number.isInteger(exemplarId)){
        return res.status(400).json({erro: 'Campos obrigatórios: leitorId e exemplarId (números)'})
    }

    if(dataEmprestimo !== undefined){
        if(!ehDataValida(dataEmprestimo)){
            return res.status(400).json({erro: 'dataEmprestimo deve estar no formato AAAA-MM-DD'})
        }

        if(dataEmprestimo > obterDataDeHoje()){
            return res.status(400).json({erro: 'dataEmprestimo não pode ser futura'})
        }
    }

    next()
}

// Precisa vir depois do middleware que busca o empréstimo (usa req.emprestimo)
export function validarDevolucao(req, res, next){
    const dataDevolucao = req.body?.dataDevolucao

    if(dataDevolucao === undefined){
        return next()
    }

    if(!ehDataValida(dataDevolucao)){
        return res.status(400).json({erro: 'dataDevolucao deve estar no formato AAAA-MM-DD'})
    }

    if(dataDevolucao > obterDataDeHoje()){
        return res.status(400).json({erro: 'dataDevolucao não pode ser futura'})
    }

    if(dataDevolucao < req.emprestimo.dataEmprestimo){
        return res.status(400).json({erro: 'dataDevolucao não pode ser anterior ao empréstimo'})
    }

    next()
}
