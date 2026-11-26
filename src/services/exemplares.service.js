import * as model from '../models/exemplares.model.js';
import * as livrosModel from '../models/livros.model.js';
import * as emprestimosModel from '../models/emprestimos.model.js';
import { ErroDeValidacao, ErroNaoEncontrado, ErroDeConflito } from './erros.js';
import { paraFormatoDaApi } from './formato.js';
import { ehIdValido, ehTextoPreenchido } from './validacoes.js';

function validarExemplar({ livroId, codigo } = {}) {
  if (!ehIdValido(livroId) || !ehTextoPreenchido(codigo)) {
    throw new ErroDeValidacao('Campos obrigatórios: livroId (id válido) e codigo');
  }
  return { livroId, codigo: codigo.trim() };
}

async function verificarRegras({ livroId, codigo }, idDoProprio) {
  if (!(await livrosModel.buscarPorId(livroId))) {
    throw new ErroNaoEncontrado('Livro não encontrado');
  }

  const exemplarComMesmoCodigo = await model.buscarPorCodigo(codigo);

  if (exemplarComMesmoCodigo && exemplarComMesmoCodigo._id.toHexString() !== idDoProprio) {
    throw new ErroDeConflito('Já existe um exemplar com esse código');
  }
}

async function obterExemplar(id) {
  const exemplar = await model.buscarPorId(id);
  if (!exemplar) {
    throw new ErroNaoEncontrado('Exemplar não encontrado');
  }
  return exemplar;
}

function comDisponibilidade(exemplar, idsEmprestados) {
  return { ...paraFormatoDaApi(exemplar), disponivel: !idsEmprestados.has(exemplar._id.toHexString()) };
}

async function buscarIdsEmprestados() {
  const emprestimosEmAberto = await emprestimosModel.buscarTodos({ dataDevolucao: null });
  return new Set(emprestimosEmAberto.map(emprestimo => emprestimo.exemplarId));
}

export async function listar({ livroId } = {}) {
  const filtro = {};

  if (livroId) {
    if (typeof livroId !== 'string') {
      throw new ErroDeValidacao('livroId inválido');
    }
    filtro.livroId = livroId;
  }

  const exemplares = await model.buscarTodos(filtro);
  const idsEmprestados = await buscarIdsEmprestados();
  return exemplares.map(exemplar => comDisponibilidade(exemplar, idsEmprestados));
}

export async function buscar(id) {
  const exemplar = await obterExemplar(id);
  return comDisponibilidade(exemplar, await buscarIdsEmprestados());
}

export async function criar(corpo) {
  const novoExemplar = validarExemplar(corpo);
  await verificarRegras(novoExemplar);

  const insertedId = await model.inserir(novoExemplar);
  return comDisponibilidade({ _id: insertedId, ...novoExemplar }, new Set());
}

export async function atualizar(id, corpo) {
  const exemplar = await obterExemplar(id);
  const campos = validarExemplar(corpo);
  await verificarRegras(campos, id);

  await model.atualizar(id, campos);
  return comDisponibilidade({ ...exemplar, ...campos }, await buscarIdsEmprestados());
}

export async function remover(id) {
  await obterExemplar(id);

  if ((await emprestimosModel.contar({ exemplarId: id })) > 0) {
    throw new ErroDeConflito('Exemplar possui empréstimos registrados');
  }

  await model.remover(id);
}
