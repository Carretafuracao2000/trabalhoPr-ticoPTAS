# trabalhoPr-ticoPTAS
# API de Biblioteca – Empréstimos e Multas

## Requisitos

- Node.js 18 ou superior (requisito mínimo do Express 5.x)
- Express 5.x (versão estável atual)

## Como executar

```bash
npm install
npm start
```

A API sobe em `http://localhost:3000` (use a variável `PORT` para mudar a porta). Para recarregar automaticamente durante o desenvolvimento: `npm run dev`.

> Os dados ficam em memória e são perdidos ao reiniciar o servidor.

## Estrutura do projeto

```
server.js                      rotas, dados em memória e regras de negócio (multa e bloqueio)
datas.js                       funções de data (hoje, somar dias, dias de atraso)
middlewares/
    registrarRequisicao.js     registra cada requisição no console
    buscarPorId.js             busca o recurso pelo :id e responde 404 se não existir
    validarDados.js            valida o corpo das requisições (livro, exemplar, leitor, empréstimo, devolução)
    verificarRegras.js         regras de negócio: leitor bloqueado, exemplar emprestado, exclusão de itens em uso
    tratarErros.js             rota não encontrada (404) e erros inesperados (400/500)
```
## Entidades

| Entidade | Campos |
|---|---|
| Livro | `id`, `titulo`, `autor`, `isbn` (opcional) |
| Exemplar | `id`, `livroId`, `codigo` (único), `disponivel` (calculado) |
| Leitor | `id`, `nome`, `telefone` (opcional) |
| Empréstimo | `id`, `leitorId`, `exemplarId`, `dataEmprestimo`, `dataPrevistaDevolucao`, `dataDevolucao`, `multaPaga`, `dataPagamento`, `status`, `diasAtraso`, `multa` (os três últimos são calculados) |

Relações: um Livro tem vários Exemplares; um Leitor tem vários Empréstimos; cada Empréstimo é de um Exemplar.

Todas as datas usam o formato `AAAA-MM-DD`.

## Regras de negócio

1. **Cálculo da multa:** cada dia de atraso na devolução custa **R$ 5,00**. O prazo de empréstimo é de **14 dias** a partir de `dataEmprestimo`. `multa = diasAtraso × 5`. Enquanto o livro não é devolvido, a multa continua crescendo (calculada até a data de hoje).
2. **Bloqueio do leitor:** o leitor que tem empréstimo atrasado, ou multa ainda não paga, não pode fazer novos empréstimos (resposta `403`). Ele é liberado depois de devolver o livro e pagar a multa.

As constantes `VALOR_MULTA_DIA` e `PRAZO_EMPRESTIMO_DIAS` ficam no início do `server.js`.

# Endpoints

### Livros (CRUD)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/livros` | Lista os livros |
| GET | `/livros/:id` | Busca um livro |
| POST | `/livros` | Cadastra (`titulo` e `autor` obrigatórios) |
| PUT | `/livros/:id` | Atualiza |
| DELETE | `/livros/:id` | Remove (`409` se houver exemplares) |

### Exemplares (CRUD)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/exemplares` | Lista (filtro opcional `?livroId=1`) |
| GET | `/exemplares/:id` | Busca um exemplar |
| POST | `/exemplares` | Cadastra (`livroId` e `codigo` obrigatórios) |
| PUT | `/exemplares/:id` | Atualiza |
| DELETE | `/exemplares/:id` | Remove (`409` se tiver empréstimos) |

### Leitores (CRUD)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/leitores` | Lista os leitores |
| GET | `/leitores/:id` | Busca um leitor |
| GET | `/leitores/:id/situacao` | Informa se está bloqueado e quais pendências possui |
| POST | `/leitores` | Cadastra (`nome` obrigatório) |
| PUT | `/leitores/:id` | Atualiza |
| DELETE | `/leitores/:id` | Remove (`409` se tiver empréstimos) |

### Empréstimos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/emprestimos` | Lista (filtros opcionais `?leitorId=1` e `?status=atrasado`) |
| GET | `/emprestimos/:id` | Busca um empréstimo com multa calculada |
| POST | `/emprestimos` | Registra empréstimo |
| POST | `/emprestimos/:id/devolucao` | Registra a devolução |
| POST | `/emprestimos/:id/pagamento` | Registra o pagamento da multa |

Valores de `status`: `em_dia`, `atrasado`, `devolvido`.

**POST `/emprestimos`**

```json
{
    "leitorId": 1,
    "exemplarId": 1,
    "dataEmprestimo": "2026-09-14"
}
```

`dataEmprestimo` é opcional (padrão: hoje) e não pode ser futura. Erros possíveis: `400` (dados inválidos), `403` (leitor bloqueado), `404` (leitor ou exemplar inexistente), `409` (exemplar já emprestado).

**POST `/emprestimos/:id/devolucao`**

```json
{
    "dataDevolucao": "2026-10-04"
}
```

Corpo opcional (padrão: hoje). A resposta já traz `diasAtraso` e `multa`. Retorna `409` se já foi devolvido.

**POST `/emprestimos/:id/pagamento`**

Sem corpo. Só funciona depois da devolução e quando há multa (`409` nos demais casos).

**Exemplo de resposta (empréstimo atrasado)**

```json
{
    "id": 1,
    "leitorId": 1,
    "exemplarId": 1,
    "dataEmprestimo": "2026-09-14",
    "dataPrevistaDevolucao": "2026-09-28",
    "dataDevolucao": null,
    "multaPaga": false,
    "dataPagamento": null,
    "status": "atrasado",
    "diasAtraso": 6,
    "multa": 30
}
```