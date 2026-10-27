import * as service from './service/leitores.service.js';

export function listar(req, res){
    res.json(service.listar())
}