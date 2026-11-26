import * as service from '../services/leitores.service.js';

export async function listar(req, res) {
  res.json(await service.listar());
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

export async function situacao(req, res) {
  res.json(await service.consultarSituacao(req.params.id));
}
