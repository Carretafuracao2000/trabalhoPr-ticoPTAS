// Cria um middleware que procura o recurso pelo :id da rota.
// Se encontrar, guarda em req[propriedade] (ex: req.livro); senão responde 404.
export default function criarBuscaPorId(lista, propriedade, nomeDoRecurso){
    return function buscarPorId(req, res, next){
        const id = Number(req.params.id)
        const recurso = lista.find(item => item.id === id)

        if(!recurso){
            return res.status(404).json({erro: `${nomeDoRecurso} não encontrado`})
        }

        req[propriedade] = recurso

        next()
    }
}
