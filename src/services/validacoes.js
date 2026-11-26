export function ehTextoPreenchido(valor) {
  return typeof valor === 'string' && valor.trim() !== '';
}

export function ehIdValido(valor) {
  return typeof valor === 'string' && /^[0-9a-fA-F]{24}$/.test(valor);
}
