import * as service from './service/emprestimos.service.js';

export function listar(req, res){
    res.json(service.listar())
}
