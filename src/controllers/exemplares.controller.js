import * as service from '../services/exemplares.service.js';

export async function listar(req, res) {
  res.json(await service.listar(req.query));
}

export async function buscar(req, res) {
  res.json(await service.buscar(req.params.id));
}

export async function criar(req, res) {
  res.status(201).json(await service.criar(req.body ?? {}));
}

export async function atualizar(req, res) {
  res.json(await service.atualizar(req.params.id, req.body ?? {}));
}

export async function remover(req, res) {
  await service.remover(req.params.id);
  res.status(204).send();
}
