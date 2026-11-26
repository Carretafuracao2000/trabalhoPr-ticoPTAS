const MS_POR_DIA = 24 * 60 * 60 * 1000;

function paraTimestampUTC(data) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

export function obterDataDeHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function ehDataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

export function somarDias(data, dias) {
  return new Date(paraTimestampUTC(data) + dias * MS_POR_DIA).toISOString().slice(0, 10);
}

export function calcularDiasEntre(inicio, fim) {
  return Math.round((paraTimestampUTC(fim) - paraTimestampUTC(inicio)) / MS_POR_DIA);
}
