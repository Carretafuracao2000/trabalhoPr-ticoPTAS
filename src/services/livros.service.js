import * as model from '../models/livros.model.js';
import * as exemplaresModel from '../models/exemplares.model.js';
import { ErroDeValidacao, ErroNaoEncontrado, ErroDeConflito } from './erros.js';
import { paraFormatoDaApi } from './formato.js';
import { ehTextoPreenchido } from './validacoes.js';

function validarLivro({ titulo, autor, isbn } = {}) {
  if (!ehTextoPreenchido(titulo) || !ehTextoPreenchido(autor)) {
    throw new ErroDeValidacao('Campos obrigatórios: titulo e autor');
  }
  if (isbn !== undefined && isbn !== null && typeof isbn !== 'string') {
    throw new ErroDeValidacao('isbn deve ser um texto');
  }
  return { titulo: titulo.trim(), autor: autor.trim(), isbn: isbn?.trim() || null };
}

async function obterLivro(id) {
  const livro = await model.buscarPorId(id);
  if (!livro) {
    throw new ErroNaoEncontrado('Livro não encontrado');
  }
  return livro;
}

export async function listar() {
  const livros = await model.buscarTodos();
  return livros.map(paraFormatoDaApi);
}

export async function buscar(id) {
  return paraFormatoDaApi(await obterLivro(id));
}

export async function criar(corpo) {
  const novoLivro = validarLivro(corpo);
  const insertedId = await model.inserir(novoLivro);
  return paraFormatoDaApi({ _id: insertedId, ...novoLivro });
}

export async function atualizar(id, corpo) {
  const livro = await obterLivro(id);
  const campos = validarLivro(corpo);
  await model.atualizar(id, campos);
  return paraFormatoDaApi({ ...livro, ...campos });
}

export async function remover(id) {
  await obterLivro(id);

  if ((await exemplaresModel.contar({ livroId: id })) > 0) {
    throw new ErroDeConflito('Livro possui exemplares cadastrados');
  }

  await model.remover(id);
}
