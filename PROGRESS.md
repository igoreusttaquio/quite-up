# Progresso de Implementação — Quite-Up

> Arquivo de referência para retomar o desenvolvimento entre sessões.

---

## Stack definida

- **Backend:** .NET 10 + ASP.NET Core — Clean Architecture, Minimal APIs, CQRS com MediatR
- **Frontend:** React + Vite + TypeScript + HeroUI + Tailwind (base do HeroUI)
- **Banco:** PostgreSQL 16 — snake_case via EFCore.NamingConventions
- **Mensageria:** RabbitMQ 3 — SDK `RabbitMQ.Client` (sem MassTransit)
- **IDs:** internos `long` auto-increment; externos via `Hashids.net` (string curta, reversível)
- **Auth:** JWT (access token 15min) + refresh token rotativo em cookie HttpOnly (7 dias)
- **Email:** MailKit + SMTP próprio
- **Senhas:** PBKDF2 com `Rfc2898DeriveBytes` (nativo .NET)

---

## Decisões arquiteturais importantes

- Nunca usar CLIs/scaffolds manualmente — sempre `dotnet new`, `dotnet add package`, `dotnet ef migrations add`, `npm install`, etc.
- Endpoints organizados com interface `IEndpoint`, registrados via reflection em `EndpointExtensions`
- Migrations aplicadas automaticamente no startup via `db.Database.Migrate()`
- IDs externos gerados/decodificados na camada de API, sem coluna extra no banco
- Estratégia de quitação: apenas **Snowball** (menor saldo primeiro)
- App totalmente **responsivo** (mobile-first)

---

## Fases de features (ver FEATURES.md para detalhes)

| Fase | Módulos |
|------|---------|
| 1 | Autenticação e cadastro de usuário |
| 2 | Contas, Categorias, Transações, Perfil |
| 3 | Dashboard |
| 4 | Dívidas (Snowball, gamificação, desconto por antecipação) |
| 5 | Orçamento + Metas financeiras |
| 6 | Relatórios + Notificações |

---

## Status de implementação

### ✅ Concluído

#### Infraestrutura base
- `.gitignore`, `.env.example`, `docker-compose.yml` (PostgreSQL + RabbitMQ + API)
- `Dockerfile` multi-stage para o backend
- `scripts/setup-server.sh` — setup do Docker no Fedora Server
- `Makefile` com comandos `up`, `down`, `build`, `logs`, `ps`

#### Solução .NET
- Solução `QuiteUp.sln` com 4 projetos: `Domain`, `Application`, `Infrastructure`, `Api`
- Referências entre projetos seguindo Clean Architecture
- Todos os pacotes NuGet instalados

#### Fase 1 — Autenticação (backend)
- **Domain:** `User`, `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken`, `UserStatus`
- **Application:**
  - Interfaces: `IApplicationDbContext`, `ITokenService`, `IEmailService`, `IPasswordHasher`, `ICurrentUserService`
  - Result pattern: `Result<T>`, `Result`, `Error`
  - `ValidationBehavior` (pipeline MediatR + FluentValidation)
  - Commands: `RegisterUser`, `LoginUser`, `LogoutUser`, `RefreshToken`, `VerifyEmail`, `ResendVerificationEmail`, `ForgotPassword`, `ResetPassword`
- **Infrastructure:**
  - `ApplicationDbContext` com snake_case e auto-set de `CreatedAt`/`UpdatedAt`
  - EF Core configurations para todas as entidades
  - `JwtTokenService` (`JsonWebTokenHandler`)
  - `PasswordHasherService` (PBKDF2 nativo)
  - `EmailService` (MailKit)
  - `CurrentUserService`
- **Api:**
  - `AuthEndpoints` (Minimal API) — todos os 8 endpoints de auth
  - `ExceptionHandlingMiddleware` (ValidationException → 400, Exception → 500)
  - `Program.cs` configurado com JWT, Swagger, CORS, Serilog
- **Migration:** `InitialAuth` criada e incluída no repositório

---

#### Fase 2 — Contas, Categorias, Transações, Perfil (backend) ✅
- **Domain:** `Account`, `Category`, `Transaction` + enums `AccountType`, `CategoryType`, `TransactionType`
- **Application:**
  - Interfaces: `IIdEncoder`
  - Models: `PagedResult<T>`
  - Erros adicionais: `NotFound`, `Forbidden`, `CannotDelete`, `WrongPassword`, `EmailInUse`, `SameAccount`, etc.
  - Accounts: `CreateAccount`, `UpdateAccount`, `DeactivateAccount`, `GetAccounts`, `GetAccountById`
  - Categories: `CreateCategory`, `UpdateCategory`, `DeleteCategory`, `GetCategories`
  - Transactions: `CreateTransaction`, `UpdateTransaction`, `DeleteTransaction`, `GetTransactions` (paginado)
  - Profile: `GetProfile`, `UpdateProfile`, `ChangePassword`, `ChangeEmail`, `DeleteUserAccount`
  - `VerifyEmailCommandHandler` atualizado para suportar `IsEmailChange`
- **Infrastructure:**
  - `IdEncoderService` (Hashids)
  - `AccountConfiguration`, `CategoryConfiguration`, `TransactionConfiguration`
  - `DatabaseSeeder` — categorias padrão (15 categorias de receita/despesa)
  - `UserConfiguration` atualizado com `PendingEmail` + relações Account/Category
- **Migration:** `Phase2AccountsCategoriesTransactions` gerada
- **Api:** `AccountEndpoints`, `CategoryEndpoints`, `TransactionEndpoints`, `ProfileEndpoints`

### 🔲 Pendente

#### Fase 3 — Dashboard (backend)
- Query `GetDashboardSummary` (saldo total, resumo do mês, total de dívidas, últimas transações)
- Endpoint `/api/dashboard`

#### Fase 4 — Dívidas (backend)
- Entidades: `Debt`, `DebtPayment`
- Enums: `DebtType` (Loan, Financing, CreditCard)
- Commands: `CreateDebt`, `UpdateDebt`, `DeleteDebt`, `RegisterDebtPayment`
- Queries: `GetDebts`, `GetDebtById`, `GetDebtPayments`, `GetSnowballStrategy`
- Lógica de gamificação (marcos de progresso), desconto por antecipação, Snowball
- RabbitMQ: publicar `DebtPaidOffEvent` quando saldo zera

#### Fase 5 — Orçamento e Metas (backend)
- Entidades: `Budget`, `FinancialGoal`, `GoalContribution`
- Commands e Queries correspondentes

#### Fase 6 — Relatórios e Notificações (backend)
- Queries de relatórios (por período, por categoria, evolução)
- Entidade `Notification`
- Consumer RabbitMQ para triggers de notificação

#### Frontend (todas as fases)
- Scaffold Vite + React + TypeScript + HeroUI + Tailwind
- Configuração TanStack Query, Zustand, Axios com interceptors JWT
- Todas as páginas e componentes (ver FEATURES.md)

---

## Commits realizados

| Hash | Descrição |
|------|-----------|
| `35c2f3b` | Initial commit |
| `89f595c` | feat: scaffold backend com autenticação completa (Fase 1) |
| `644ec93` | docs: adiciona PROGRESS.md |
| (próximo) | feat: Fase 2 — Contas, Categorias, Transações e Perfil (backend) |

---

## Como retomar

1. Abrir este arquivo para ver o que está pendente
2. Continuar a partir de **Fase 2 — backend**: entidades `Account`, `Category`, `Transaction`
3. Após o backend de cada fase, implementar o frontend correspondente
