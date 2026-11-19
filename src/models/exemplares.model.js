// src/models/exemplares.model.js
// Model: é a única camada que fala com o MongoDB, usando as funções do driver
// (find, insertOne, updateOne, deleteOne...). O service chama estas funções e cuida das regras de negócio.
import { ObjectId } from 'mongodb';
import { obterBanco } from '../config/database.js';

// Atalho para a coleção "exemplares". Cada documento dela é uma tarefa.
function colecao() {
  return obterBanco().collection('exemplares');
}

export async function buscarTodas() {
  // mongosh: db.exemplares.find()
  return colecao().find().toArray();
}

export async function buscarPorId(id) {
  // ObjectId.isValid confere o formato antes da consulta. Um id inválido retorna null em vez de gerar erro.
  if (!ObjectId.isValid(id)) {
    return null;
  }
  // mongosh: db.exemplares.findOne({ _id: ObjectId("65f1c2a9e4b0a1b2c3d4e5f6") })
  return colecao().findOne({ _id: new ObjectId(id) });
}

export async function inserir(exemplares) {
  // mongosh: db.exemplares.insertOne({ titulo: "Estudar", concluida: false })
  const resultado = await colecao().insertOne(tarefa);
  return resultado.insertedId;
}

// O service decide quais campos podem ser alterados. Esta função só repassa esses campos.
export async function atualizar(id, campos) {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  // mongosh: db.exemplares.updateOne({ _id: ObjectId("65f1c2a9e4b0a1b2c3d4e5f6") }, { $set: { concluida: true } })
  const resultado = await colecao().updateOne({ _id: new ObjectId(id) }, { $set: campos });
  return resultado.matchedCount > 0;
}

export async function remover(id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  // mongosh: db.exemplares.deleteOne({ _id: ObjectId("65f1c2a9e4b0a1b2c3d4e5f6") })
  const resultado = await colecao().deleteOne({ _id: new ObjectId(id) });
  return resultado.deletedCount > 0;
}