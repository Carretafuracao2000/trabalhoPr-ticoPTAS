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
