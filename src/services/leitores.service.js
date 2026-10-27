const leitores = [];
let proximoId = 1;

export function listar() {
  return leitores;
}

export function criar({ nome }) {
  if (typeof nome !== 'string' || titulo.trim().length < 2) {
    throw new ErroDeValidacao('O nome deve ter ao menos 3 caracteres.')}}