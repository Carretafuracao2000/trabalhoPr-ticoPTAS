import * as service from '../services/emprestimos.service.js';

export async function listar(req, res) {
  res.json(await service.listar(req.query));
}

export async function buscar(req, res) {
  res.json(await service.buscar(req.params.id));
}

export async function criar(req, res) {
  res.status(201).json(await service.criar(req.body ?? {}));
}

export async function devolver(req, res) {
  res.json(await service.devolver(req.params.id, req.body));
}

export async function pagarMulta(req, res) {
  res.json(await service.pagarMulta(req.params.id));
}
