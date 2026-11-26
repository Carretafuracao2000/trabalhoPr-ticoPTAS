import * as model from '../models/emprestimos.model.js';
import * as leitoresModel from '../models/leitores.model.js';
import * as exemplaresModel from '../models/exemplares.model.js';
import { VALOR_MULTA_POR_DIA, PRAZO_EMPRESTIMO_EM_DIAS } from '../config/constantes.js';
import {
  ErroDeValidacao,
  ErroDeAcessoNegado,
  ErroNaoEncontrado,
  ErroDeConflito,
} from './erros.js';
import { calcularDiasEntre, ehDataValida, obterDataDeHoje, somarDias } from './datas.js';
import { paraFormatoDaApi } from './formato.js';
import { ehIdValido } from './validacoes.js';

function calcularMulta(dataPrevistaDevolucao, dataDeReferencia) {
  const diasDeAtraso = Math.max(0, calcularDiasEntre(dataPrevistaDevolucao, dataDeReferencia));
  const valorDaMulta = diasDeAtraso * VALOR_MULTA_POR_DIA;

  return { diasDeAtraso, valorDaMulta };
}

function detalharEmprestimo(emprestimo) {
  const dataDeReferencia = emprestimo.dataDevolucao || obterDataDeHoje();
  const { diasDeAtraso, valorDaMulta } = calcularMulta(emprestimo.dataPrevistaDevolucao, dataDeReferencia);

  let status = 'em_dia';

  if (emprestimo.dataDevolucao) {
    status = 'devolvido';
  } else if (diasDeAtraso > 0) {
    status = 'atrasado';
  }

  return { ...paraFormatoDaApi(emprestimo), status, diasAtraso: diasDeAtraso, multa: valorDaMulta };
}

export async function consultarSituacaoDoLeitor(leitorId) {
  const emprestimos = await model.buscarTodos({ leitorId });

  const pendencias = emprestimos
    .map(detalharEmprestimo)
    .filter(emprestimo => emprestimo.multa > 0 && !emprestimo.multaPaga)
    .map(emprestimo => ({
      emprestimoId: emprestimo.id,
      status: emprestimo.status,
      diasAtraso: emprestimo.diasAtraso,
      multa: emprestimo.multa,
    }));

  const totalMultaPendente = pendencias.reduce((total, pendencia) => total + pendencia.multa, 0);

  return { bloqueado: pendencias.length > 0, totalMultaPendente, pendencias };
}

async function exemplarEstaDisponivel(exemplarId) {
  return (await model.contar({ exemplarId, dataDevolucao: null })) === 0;
}

async function obterEmprestimo(id) {
  const emprestimo = await model.buscarPorId(id);
  if (!emprestimo) {
    throw new ErroNaoEncontrado('Empréstimo não encontrado');
  }
  return emprestimo;
}

function validarData(valor, nomeDoCampo) {
  if (!ehDataValida(valor)) {
    throw new ErroDeValidacao(`${nomeDoCampo} deve estar no formato AAAA-MM-DD`);
  }
  if (valor > obterDataDeHoje()) {
    throw new ErroDeValidacao(`${nomeDoCampo} não pode ser futura`);
  }
}

export async function listar({ leitorId, status } = {}) {
  const filtro = {};

  if (leitorId) {
    if (typeof leitorId !== 'string') {
      throw new ErroDeValidacao('leitorId inválido');
    }
    filtro.leitorId = leitorId;
  }

  let emprestimos = (await model.buscarTodos(filtro)).map(detalharEmprestimo);

  if (status) {
    emprestimos = emprestimos.filter(emprestimo => emprestimo.status === status);
  }

  return emprestimos;
}

export async function buscar(id) {
  return detalharEmprestimo(await obterEmprestimo(id));
}

export async function criar({ leitorId, exemplarId, dataEmprestimo } = {}) {
  if (!ehIdValido(leitorId) || !ehIdValido(exemplarId)) {
    throw new ErroDeValidacao('Campos obrigatórios: leitorId e exemplarId (ids válidos)');
  }

  if (dataEmprestimo !== undefined) {
    validarData(dataEmprestimo, 'dataEmprestimo');
  }

  if (!(await leitoresModel.buscarPorId(leitorId))) {
    throw new ErroNaoEncontrado('Leitor não encontrado');
  }

  if (!(await exemplaresModel.buscarPorId(exemplarId))) {
    throw new ErroNaoEncontrado('Exemplar não encontrado');
  }

  const situacaoDoLeitor = await consultarSituacaoDoLeitor(leitorId);

  if (situacaoDoLeitor.bloqueado) {
    throw new ErroDeAcessoNegado(
      'Leitor bloqueado: devolva os livros em atraso e pague a multa',
      situacaoDoLeitor
    );
  }

  if (!(await exemplarEstaDisponivel(exemplarId))) {
    throw new ErroDeConflito('Exemplar já está emprestado');
  }

  const dataDoEmprestimo = dataEmprestimo ?? obterDataDeHoje();

  const novoEmprestimo = {
    leitorId,
    exemplarId,
    dataEmprestimo: dataDoEmprestimo,
    dataPrevistaDevolucao: somarDias(dataDoEmprestimo, PRAZO_EMPRESTIMO_EM_DIAS),
    dataDevolucao: null,
    multaPaga: false,
    dataPagamento: null,
  };

  const insertedId = await model.inserir(novoEmprestimo);
  return detalharEmprestimo({ _id: insertedId, ...novoEmprestimo });
}

export async function devolver(id, corpo) {
  const emprestimo = await obterEmprestimo(id);

  if (emprestimo.dataDevolucao) {
    throw new ErroDeConflito('Empréstimo já foi devolvido');
  }

  const dataInformada = corpo?.dataDevolucao;

  if (dataInformada !== undefined) {
    validarData(dataInformada, 'dataDevolucao');

    if (dataInformada < emprestimo.dataEmprestimo) {
      throw new ErroDeValidacao('dataDevolucao não pode ser anterior ao empréstimo');
    }
  }

  const dataDaDevolucao = dataInformada ?? obterDataDeHoje();
  const { valorDaMulta } = calcularMulta(emprestimo.dataPrevistaDevolucao, dataDaDevolucao);

  const campos = { dataDevolucao: dataDaDevolucao, multaPaga: valorDaMulta === 0 };

  await model.atualizar(id, campos);
  return detalharEmprestimo({ ...emprestimo, ...campos });
}

export async function pagarMulta(id) {
  const emprestimo = await obterEmprestimo(id);

  if (!emprestimo.dataDevolucao) {
    throw new ErroDeConflito('Devolva o livro antes de pagar a multa');
  }

  if (detalharEmprestimo(emprestimo).multa === 0) {
    throw new ErroDeConflito('Este empréstimo não possui multa');
  }

  if (emprestimo.multaPaga) {
    throw new ErroDeConflito('Multa já foi paga');
  }

  const campos = { multaPaga: true, dataPagamento: obterDataDeHoje() };

  await model.atualizar(id, campos);
  return detalharEmprestimo({ ...emprestimo, ...campos });
}
