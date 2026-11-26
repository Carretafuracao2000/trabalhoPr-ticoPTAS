import * as model from '../models/leitores.model.js';
import * as emprestimosModel from '../models/emprestimos.model.js';
import { consultarSituacaoDoLeitor } from './emprestimos.service.js';
import { ErroDeValidacao, ErroNaoEncontrado, ErroDeConflito } from './erros.js';
import { paraFormatoDaApi } from './formato.js';
import { ehTextoPreenchido } from './validacoes.js';

function validarLeitor({ nome, telefone } = {}) {
  if (!ehTextoPreenchido(nome)) {
    throw new ErroDeValidacao('Campo obrigatório: nome');
  }
  if (telefone !== undefined && telefone !== null && typeof telefone !== 'string') {
    throw new ErroDeValidacao('telefone deve ser um texto');
  }
  return { nome: nome.trim(), telefone: telefone?.trim() || null };
}

async function obterLeitor(id) {
  const leitor = await model.buscarPorId(id);
  if (!leitor) {
    throw new ErroNaoEncontrado('Leitor não encontrado');
  }
  return leitor;
}

export async function listar() {
  const leitores = await model.buscarTodos();
  return leitores.map(paraFormatoDaApi);
}

export async function buscar(id) {
  return paraFormatoDaApi(await obterLeitor(id));
}

export async function consultarSituacao(id) {
  const leitor = await obterLeitor(id);
  return {
    leitorId: id,
    nome: leitor.nome,
    ...(await consultarSituacaoDoLeitor(id)),
  };
}

export async function criar(corpo) {
  const novoLeitor = validarLeitor(corpo);
  const insertedId = await model.inserir(novoLeitor);
  return paraFormatoDaApi({ _id: insertedId, ...novoLeitor });
}

export async function atualizar(id, corpo) {
  const leitor = await obterLeitor(id);
  const campos = validarLeitor(corpo);
  await model.atualizar(id, campos);
  return paraFormatoDaApi({ ...leitor, ...campos });
}

export async function remover(id) {
  await obterLeitor(id);

  if ((await emprestimosModel.contar({ leitorId: id })) > 0) {
    throw new ErroDeConflito('Leitor possui empréstimos registrados');
  }

  await model.remover(id);
}
