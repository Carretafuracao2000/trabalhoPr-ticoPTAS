import * as service from './service/exemplares.service.js';

export function listar(req, res){
    res.json(service.listar())
}