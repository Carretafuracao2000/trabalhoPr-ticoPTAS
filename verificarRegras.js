// Verifica se o livro do exemplar existe e se o código ainda não está em uso
export function criarVerificacaoDeExemplar(bancoDeDados){
    return function verificarExemplar(req, res, next){
        const {livroId, codigo} = req.body

        const livroExiste = bancoDeDados.livros.some(livro => livro.id === livroId)

        if(!livroExiste){
            return res.status(404).json({erro: 'Livro não encontrado'})
        }

        // No PUT, o próprio exemplar (req.exemplar) pode manter o seu código
        const codigoJaExiste = bancoDeDados.exemplares.some(
            exemplar => exemplar.codigo === codigo && exemplar.id !== req.exemplar?.id
        )

        if(codigoJaExiste){
            return res.status(409).json({erro: 'Já existe um exemplar com esse código'})
        }

        next()
    }
}

// Regra 2: leitor com atraso ou multa pendente não pode fazer novos empréstimos
export function criarVerificacaoDeEmprestimo(bancoDeDados, consultarSituacaoDoLeitor, exemplarEstaDisponivel){
    return function verificarEmprestimoPermitido(req, res, next){
        const {leitorId, exemplarId} = req.body

        const leitorExiste = bancoDeDados.leitores.some(leitor => leitor.id === leitorId)

        if(!leitorExiste){
            return res.status(404).json({erro: 'Leitor não encontrado'})
        }

        const exemplarExiste = bancoDeDados.exemplares.some(exemplar => exemplar.id === exemplarId)

        if(!exemplarExiste){
            return res.status(404).json({erro: 'Exemplar não encontrado'})
        }

        const situacaoDoLeitor = consultarSituacaoDoLeitor(leitorId)

        if(situacaoDoLeitor.bloqueado){
            return res.status(403).json({
                erro: 'Leitor bloqueado: devolva os livros em atraso e pague a multa',
                ...situacaoDoLeitor
            })
        }

        if(!exemplarEstaDisponivel(exemplarId)){
            return res.status(409).json({erro: 'Exemplar já está emprestado'})
        }

        next()
    }
}

// Impede apagar um recurso que ainda é usado por outro.
// Ex: não apagar um livro (req.livro) que ainda tem exemplares (campo livroId).
export function impedirExclusaoSeEmUso(listaQueUsa, campoDeReferencia, propriedade, mensagem){
    return function impedirExclusao(req, res, next){
        const idDoRecurso = req[propriedade].id
        const estaEmUso = listaQueUsa.some(item => item[campoDeReferencia] === idDoRecurso)

        if(estaEmUso){
            return res.status(409).json({erro: mensagem})
        }

        next()
    }
}

export function verificarEmprestimoEmAberto(req, res, next){
    if(req.emprestimo.dataDevolucao){
        return res.status(409).json({erro: 'Empréstimo já foi devolvido'})
    }

    next()
}

export function verificarEmprestimoDevolvido(req, res, next){
    if(!req.emprestimo.dataDevolucao){
        return res.status(409).json({erro: 'Devolva o livro antes de pagar a multa'})
    }

    next()
}
