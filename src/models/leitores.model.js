import { ObjectId } from 'mongodb';
import { obterBanco } from '../config/database.js';

function colecao() {
  return obterBanco().collection('leitores');
}

export async function buscarTodos(filtro = {}) {
  return colecao().find(filtro).toArray();
}

export async function buscarPorId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return colecao().findOne({ _id: new ObjectId(id) });
}

export async function inserir(documento) {
  const resultado = await colecao().insertOne(documento);
  return resultado.insertedId;
}

export async function atualizar(id, campos) {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  const resultado = await colecao().updateOne({ _id: new ObjectId(id) }, { $set: campos });
  return resultado.matchedCount > 0;
}

export async function remover(id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  const resultado = await colecao().deleteOne({ _id: new ObjectId(id) });
  return resultado.deletedCount > 0;
}
