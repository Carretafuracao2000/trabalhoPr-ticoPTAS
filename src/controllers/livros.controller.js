import * as service from './service/livros.service.js';

export function listar(req, res){
    res.json(service.listar())
}