const emprestimos = [];
let proximoId = 1;

export function listar() {
  return emprestimos;
}

export function criar({ }) {
  if (typeof titulo !== 'string' || titulo.trim().length < 3) {
    throw new ErroDeValidacao('O título deve ter ao menos 3 caracteres.')}};