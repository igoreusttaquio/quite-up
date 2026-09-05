# Quite-Up

**Quite-Up** é um gestor de finanças pessoais. O diferencial é ajudar o usuário a mapear e quitar suas dívidas — como empréstimos, financiamentos e cartões de crédito — de forma clara e estratégica.

## Stack

- **Backend:** .NET + ASP.NET Core (CQRS com MediatR)
- **Frontend:** React 19 + Vite + shadcn/ui + Tailwind CSS v4
- **Banco de dados:** PostgreSQL
- **Mensageria:** RabbitMQ

## Como rodar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) com Docker Compose

### 1. Clonar e configurar

```bash
git clone https://github.com/igoreusttaquio/quite-up.git
cd quite-up
cp .env.example .env
```

Edite o `.env` e preencha os valores obrigatórios:

| Variável | Descrição |
|---|---|
| `DB_PASSWORD` | Senha do PostgreSQL |
| `JWT_SECRET` | Chave secreta JWT (mínimo 32 caracteres) |
| `HASHIDS_SALT` | Salt para ofuscação de IDs |
| `SMTP_*` | Credenciais do servidor de e-mail |
| `APP_URL` | URL pública do frontend (ex: `https://app.meusite.com`) — mesma origem usada pelo navegador |

> **Reverse proxy compartilhado:** este projeto não sobe mais o próprio Caddy. Na VPS que
> compartilha com o ExactLab, quem publica `80`/`443` e emite o certificado Let's Encrypt é o
> Caddy do ExactLab, roteando o domínio do Quite-Up (configurado como `DOMAIN_QUITE_UP` no
> `.env` de produção do ExactLab). O domínio precisa apontar (registro A) para o IP dessa VPS.
> `db` e `rabbitmq` ficam acessíveis apenas pela rede interna do Docker (nenhuma porta exposta).

### 2. Build e execução

```bash
make build   # constrói as imagens Docker
make up      # sobe todos os serviços em background
```

A aplicação estará disponível em `https://seu-dominio`.

### Outros comandos

```bash
make down    # para os serviços
make logs    # acompanha logs da API em tempo real
make ps      # lista o status dos containers
```

### Setup de servidor (VPS)

Execute o script correspondente ao seu sistema antes de rodar os comandos acima:

```bash
# Ubuntu / Debian
bash scripts/setup-server.apt.sh

# Fedora / RHEL
bash scripts/setup-server.rpm.sh
```

Após o script, faça logout e login novamente para aplicar o grupo `docker`.
