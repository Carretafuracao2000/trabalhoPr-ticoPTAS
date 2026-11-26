# trabalhoPr-ticoPTAS

# API de Biblioteca – Empréstimos e Multas

API REST para controlar livros, exemplares, leitores e empréstimos de uma biblioteca, com cálculo de multa por atraso. Construída com [Express](https://expressjs.com/) 5 e ES Modules.

Os dados são armazenados no [MongoDB](https://www.mongodb.com/), por meio do driver oficial `mongodb`.

## Requisitos

- [Node.js](https://nodejs.org/) 20.19 ou superior
- npm
- MongoDB (veja a seção [Banco de dados](#banco-de-dados-mongodb))

## Instalação

```bash
npm install
```

## Execução

```bash
npm start
```

O servidor sobe na porta **3000** (use a variável `PORT` para mudar):

```
API da biblioteca em http://localhost:3000
```

Para recarregar automaticamente durante o desenvolvimento (`npm run dev` também sobe o MongoDB em um contêiner Docker):

```bash
npm run dev
```

## Banco de dados (MongoDB)

### Pré-requisitos

Você precisa de um servidor MongoDB em execução. Há duas opções:

- **MongoDB local:** instale o [MongoDB Community Server](https://www.mongodb.com/try/download/community).
- **Docker:** `npm run db:up` (cria ou inicia o contêiner). Também existem `npm run db:down`, `npm run db:logs` e `npm run db:reset` (apaga os dados).

### Configuração do `.env`

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

No Windows (PowerShell ou Prompt de Comando), use `copy .env.example .env`.

| Variável          | Descrição                             | Exemplo                     |
| ----------------- | ------------------------------------- | --------------------------- |
| `MONGODB_URI`     | Endereço de conexão com o servidor    | `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | Nome do banco de dados usado pela API | `biblioteca`                |

O arquivo `.env` não vai para o Git, porque pode conter credenciais.

> Se `localhost` apontar para outro servidor (por exemplo, um contêiner Docker no Windows), use `mongodb://127.0.0.1:27017` em `MONGODB_URI`.

Se o MongoDB não estiver acessível, o servidor exibe uma mensagem de erro e encerra.

### Inspecionando os dados com `mongosh`

```bash
mongosh "mongodb://localhost:27017"
```

```js
use biblioteca               // seleciona o banco usado pela API
show collections             // livros, exemplares, leitores, emprestimos
db.emprestimos.find()        // mostra todos os empréstimos gravados
```

## Estrutura do projeto

```
trabalhoPr-ticoPTAS/
├── src/
│   ├── app.js                          # Configura o Express (rotas, registro de requisições e tratamento de erros)
│   ├── server.js                       # Conecta ao MongoDB e inicia o servidor HTTP
│   ├── routes/
│   │   ├── livros.routes.js            # Rotas de /livros
│   │   ├── exemplares.routes.js        # Rotas de /exemplares
│   │   ├── leitores.routes.js          # Rotas de /leitores
│   │   └── emprestimos.routes.js       # Rotas de /emprestimos
│   ├── controllers/                    # Tratam requisição e resposta HTTP (um por entidade)
│   ├── services/                       # Validação e regras de negócio
│   │   ├── livros.service.js
│   │   ├── exemplares.service.js
│   │   ├── leitores.service.js
│   │   ├── emprestimos.service.js      # Cálculo de multa e bloqueio do leitor
│   │   ├── erros.js                    # Erros lançados pelos services (400, 403, 404, 409)
│   │   ├── datas.js                    # Funções de data (hoje, somar dias, dias de atraso)
│   │   ├── validacoes.js               # Validações simples (texto preenchido, id válido)
│   │   └── formato.js                  # Converte `_id` do MongoDB em `id`
│   ├── models/                         # Único lugar que acessa o MongoDB (um por entidade)
│   └── config/
│       ├── database.js                 # Conexão única com o MongoDB
│       └── constantes.js               # VALOR_MULTA_POR_DIA e PRAZO_EMPRESTIMO_EM_DIAS
├── .env.example
├── package.json
└── package-lock.json
```

A separação segue a arquitetura em camadas:

1. **Routes** – mapeia método e caminho para um controller.
2. **Controllers** – lê a requisição, chama o service e monta a resposta.
3. **Services** – valida os dados e aplica as regras de negócio. Quando algo está errado, lança um erro de `services/erros.js`.
4. **Models** – único lugar que acessa o MongoDB (`find`, `insertOne`, `updateOne`, `deleteOne`).

O final do `app.js` transforma os erros dos services na resposta HTTP certa (400, 403, 404 ou 409) e responde `404` para rotas que não existem. Qualquer outro erro vira `500`.

## Entidades

| Entidade   | Campos                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Livro      | `id`, `titulo`, `autor`, `isbn` (opcional)                                                                                                                                                 |
| Exemplar   | `id`, `livroId`, `codigo` (único), `disponivel` (calculado)                                                                                                                                |
| Leitor     | `id`, `nome`, `telefone` (opcional)                                                                                                                                                        |
| Empréstimo | `id`, `leitorId`, `exemplarId`, `dataEmprestimo`, `dataPrevistaDevolucao`, `dataDevolucao`, `multaPaga`, `dataPagamento`, `status`, `diasAtraso`, `multa` (os três últimos são calculados) |

Relações: um Livro tem vários Exemplares; um Leitor tem vários Empréstimos; cada Empréstimo é de um Exemplar.

Os `id` são gerados pelo MongoDB (ObjectId, 24 caracteres hexadecimais) e usados como texto. Todas as datas usam o formato `AAAA-MM-DD`.

## Regras de negócio

1. **Cálculo da multa:** cada dia de atraso na devolução custa **R$ 5,00**. O prazo de empréstimo é de **14 dias** a partir de `dataEmprestimo`. `multa = diasAtraso × 5`. Enquanto o livro não é devolvido, a multa continua crescendo (calculada até a data de hoje).
2. **Bloqueio do leitor:** o leitor que tem empréstimo atrasado, ou multa ainda não paga, não pode fazer novos empréstimos (resposta `403`). Ele é liberado depois de devolver o livro e pagar a multa.

As constantes `VALOR_MULTA_POR_DIA` e `PRAZO_EMPRESTIMO_EM_DIAS` ficam em `src/config/constantes.js`.

# Endpoints

Base URL: `http://localhost:3000`

### Livros (CRUD)

| Método | Rota          | Descrição                                  |
| ------ | ------------- | ------------------------------------------ |
| GET    | `/livros`     | Lista os livros                            |
| GET    | `/livros/:id` | Busca um livro                             |
| POST   | `/livros`     | Cadastra (`titulo` e `autor` obrigatórios) |
| PUT    | `/livros/:id` | Atualiza                                   |
| DELETE | `/livros/:id` | Remove (`409` se houver exemplares)        |

### Exemplares (CRUD)

| Método | Rota              | Descrição                                    |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/exemplares`     | Lista (filtro opcional `?livroId=<id>`)      |
| GET    | `/exemplares/:id` | Busca um exemplar                            |
| POST   | `/exemplares`     | Cadastra (`livroId` e `codigo` obrigatórios) |
| PUT    | `/exemplares/:id` | Atualiza                                     |
| DELETE | `/exemplares/:id` | Remove (`409` se tiver empréstimos)          |

### Leitores (CRUD)

| Método | Rota                     | Descrição                                           |
| ------ | ------------------------ | --------------------------------------------------- |
| GET    | `/leitores`              | Lista os leitores                                   |
| GET    | `/leitores/:id`          | Busca um leitor                                     |
| GET    | `/leitores/:id/situacao` | Informa se está bloqueado e quais pendências possui |
| POST   | `/leitores`              | Cadastra (`nome` obrigatório)                       |
| PUT    | `/leitores/:id`          | Atualiza                                            |
| DELETE | `/leitores/:id`          | Remove (`409` se tiver empréstimos)                 |

### Empréstimos

| Método | Rota                         | Descrição                                                         |
| ------ | ---------------------------- | ----------------------------------------------------------------- |
| GET    | `/emprestimos`               | Lista (filtros opcionais `?leitorId=<id>` e `?status=atrasado`)   |
| GET    | `/emprestimos/:id`           | Busca um empréstimo com multa calculada                           |
| POST   | `/emprestimos`               | Registra empréstimo                                               |
| POST   | `/emprestimos/:id/devolucao` | Registra a devolução                                              |
| POST   | `/emprestimos/:id/pagamento` | Registra o pagamento da multa                                     |

Valores de `status`: `em_dia`, `atrasado`, `devolvido`.

**POST `/emprestimos`**

```json
{
  "leitorId": "65f1c2a9e4b0a1b2c3d4e5f6",
  "exemplarId": "65f1c2a9e4b0a1b2c3d4e5f7",
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
  "id": "65f1c2a9e4b0a1b2c3d4e5f8",
  "leitorId": "65f1c2a9e4b0a1b2c3d4e5f6",
  "exemplarId": "65f1c2a9e4b0a1b2c3d4e5f7",
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

## Exemplo de fluxo

Troque `<id-do-livro>`, `<id-do-leitor>` e `<id-do-exemplar>` pelos `id` devolvidos em cada resposta.

```bash
curl -X POST localhost:3000/livros -H "Content-Type: application/json" -d '{"titulo":"Dom Casmurro","autor":"Machado de Assis"}'
curl -X POST localhost:3000/exemplares -H "Content-Type: application/json" -d '{"livroId":"<id-do-livro>","codigo":"DC-001"}'
curl -X POST localhost:3000/leitores -H "Content-Type: application/json" -d '{"nome":"Maria"}'
curl -X POST localhost:3000/emprestimos -H "Content-Type: application/json" -d '{"leitorId":"<id-do-leitor>","exemplarId":"<id-do-exemplar>"}'
curl -X POST localhost:3000/emprestimos/<id-do-emprestimo>/devolucao
```

## Códigos de resposta

| Código          | Significado                                                |
| --------------- | ---------------------------------------------------------- |
| 200 / 201 / 204 | Sucesso / criado / removido                                |
| 400             | Dados inválidos                                            |
| 403             | Leitor bloqueado                                           |
| 404             | Recurso ou rota não encontrado                             |
| 409             | Conflito de regra (já devolvido, exemplar emprestado etc.) |
| 500             | Erro interno do servidor                                   |

As respostas de erro têm o formato `{ "erro": "mensagem" }`.

## Dependências

| Pacote    | Uso                                              |
| --------- | ------------------------------------------------ |
| `express` | Framework HTTP e roteamento                      |
| `mongodb` | Driver oficial para acessar o MongoDB            |
| `dotenv`  | Carrega as variáveis do arquivo `.env`           |

## Limitações conhecidas

- **Sem testes automatizados:** o script `npm test` ainda não está configurado.
