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
git clone https://github.com/seu-usuario/quite-up.git
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
| `APP_URL` | URL pública do frontend |

### 2. Build e execução

```bash
make build   # constrói as imagens Docker
make up      # sobe todos os serviços em background
```

A aplicação estará disponível em `http://localhost:3000`.

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
