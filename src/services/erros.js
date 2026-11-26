export class ErroDaAplicacao extends Error {
  constructor(status, mensagem, detalhes = {}) {
    super(mensagem);
    this.name = this.constructor.name;
    this.status = status;
    this.detalhes = detalhes;
  }
}

export class ErroDeValidacao extends ErroDaAplicacao {
  constructor(mensagem) {
    super(400, mensagem);
  }
}

export class ErroDeAcessoNegado extends ErroDaAplicacao {
  constructor(mensagem, detalhes) {
    super(403, mensagem, detalhes);
  }
}

export class ErroNaoEncontrado extends ErroDaAplicacao {
  constructor(mensagem) {
    super(404, mensagem);
  }
}

export class ErroDeConflito extends ErroDaAplicacao {
  constructor(mensagem) {
    super(409, mensagem);
  }
}
