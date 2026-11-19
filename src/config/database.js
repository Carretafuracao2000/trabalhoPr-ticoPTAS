import { MongoClient } from 'mongodb';

let client;
let db;

export async function conectar() {
  const uri = process.env.MONGODB_URI;
  const nomeDoBanco = process.env.MONGODB_DB_NAME;

  if (!uri || !nomeDoBanco) {
    throw new Error('Defina MONGODB_URI e MONGODB_DB_NAME no arquivo .env.');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(nomeDoBanco);
  return db;
}

export function obterBanco() {
  return db;
}

export async function desconectar() {
  if (client) {
    await client.close();
  }
}