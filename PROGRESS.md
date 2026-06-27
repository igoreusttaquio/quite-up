# Progresso de Implementação — Quite-Up

> Arquivo de referência para retomar o desenvolvimento entre sessões.

---

## Stack definida

- **Backend:** .NET 10 + ASP.NET Core — Clean Architecture, Minimal APIs, CQRS com MediatR
- **Frontend:** React 19 + Vite 8 + TypeScript 6 + **shadcn/ui** (componentes próprios em `src/components/ui/`) + Tailwind CSS v4 + lucide-react + sonner + vaul
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

| Fase | Módulos                                                   |
| ---- | --------------------------------------------------------- |
| 1    | Autenticação e cadastro de usuário                        |
| 2    | Contas, Categorias, Transações, Perfil                    |
| 3    | Dashboard                                                 |
| 4    | Dívidas (Snowball, gamificação, desconto por antecipação) |
| 5    | Orçamento + Metas financeiras                             |
| 6    | Relatórios + Notificações                                 |

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

### ✅ Concluído

#### Fase 3 — Dashboard (backend) ✅

- Query `GetDashboardSummary` (saldo total, resumo do mês, últimas transações)
- Endpoint `/api/dashboard`

#### Fase 4 — Dívidas (backend) ✅

- **Domain:** `Debt`, `DebtPayment`, `DebtType` (Loan, Financing, CreditCard)
- **Application:**
  - Commands: `CreateDebt`, `UpdateDebt`, `DeleteDebt`, `RegisterDebtPayment`
  - Queries: `GetDebts`, `GetDebtById`, `GetDebtPayments`, `GetSnowballStrategy`
  - Event: `DebtPaidOffEvent` publicado via RabbitMQ quando saldo zera
  - Lógica Snowball (ordenar por menor saldo), desconto por antecipação (`IsEarlyPayment` + `Discount`)
- **Infrastructure:** `DebtConfiguration`, `DebtPaymentConfiguration`
- **Api:** `DebtEndpoints` — CRUD + payments + snowball

#### Fase 5 — Orçamento e Metas (backend) ✅

- **Domain:** `Budget`, `FinancialGoal`, `GoalContribution`
- **Application:**
  - Budgets: `CreateBudget`, `UpdateBudget`, `DeleteBudget`, `GetBudgets` (com spent/remaining computado)
  - FinancialGoals: `CreateFinancialGoal`, `UpdateFinancialGoal`, `DeleteFinancialGoal`, `AddGoalContribution`, `GetFinancialGoals`, `GetFinancialGoalById`, `GetGoalContributions`
- **Infrastructure:** `BudgetConfiguration`, `FinancialGoalConfiguration`, `GoalContributionConfiguration`
- **Api:** `BudgetEndpoints`, `FinancialGoalEndpoints`

#### Fase 6 — Relatórios e Notificações (backend) ✅

- **Domain:** `Notification` (title, message, type, is_read, reference)
- **Application:**
  - Notificações: `GetNotifications`, `GetUnreadCount`, `MarkNotificationRead`, `MarkAllNotificationsRead`
  - Relatórios: `GetPeriodReport` (income/expense/net + categorias), `GetEvolutionReport` (12 meses)
- **Infrastructure:** `NotificationConfiguration`
- **Api:** `NotificationEndpoints`, `ReportEndpoints`
- **Infrastructure:** `NotificationConsumer` RabbitMQ, `NotificationConfiguration`
- **Api:** `NotificationEndpoints`, `ReportEndpoints`

---

### ✅ Concluído

#### Frontend (Fases 1–6) ✅

Stack: React 19 + Vite 8 + **shadcn/ui** + Tailwind CSS v4 + lucide-react + sonner + vaul + framer-motion.

- Componentes próprios em `src/components/ui/`: Button, Input, Label, Field, NativeSelect, Dialog, Sheet, Avatar, Tooltip, Badge, Spinner, Alert, Separator
- Ícones: lucide-react (não @fluentui/react-icons)
- Toasts globais: sonner via `useAppToast()`
- Drawers de create/edit: vaul (`Sheet`)
- Dark mode: classe `.dark` no `<html>`, toggle persistido em localStorage
- Design tokens oklch no `index.css` com `@theme inline` (Tailwind v4)
- Páginas implementadas: Login, Register, ForgotPassword, ResetPassword, VerifyEmail, Dashboard, Contas, Categorias, Transações, Perfil, Dívidas, Orçamento, Metas, Notificações, Relatórios
- Filtros de URL em Transações: `useSearchParams` com keys `account`, `type`, `from`, `to`, `page`
- Skeleton loading + ErrorBoundary em todas as páginas
- **Atenção:** nunca instalar `tailwindcss-animate` — incompatível com Tailwind v4

---

## Commits realizados

| Hash      | Descrição                                                                     |
| --------- | ----------------------------------------------------------------------------- |
| `35c2f3b` | Initial commit                                                                |
| `89f595c` | feat: scaffold backend com autenticação completa (Fase 1)                     |
| `644ec93` | docs: adiciona PROGRESS.md                                                    |
| `f90386a` | feat: frontend com React + Vite + Tailwind                                    |
| `5c1bc5a` | feat: adiciona container frontend com nginx e proxy reverso para api          |
| `bc2b36a` | feat: frontend com HeroUI v3 + animações framer-motion                        |
| `8391222` | feat: Fase 2 — Contas, Categorias, Transações e Perfil (backend)              |
| `1e48af3` | fix: [FromBody] no MapDelete de perfil                                        |
| `0c69e45` | fix: VerifyEmailPage em loop infinito                                         |
| `897fcc1` | fix: token URL-safe e APP_URL configurável                                    |
| `dd8b61c` | feat: redesign visual completo do frontend (design system, dark mode, toasts) |
| `bc3bc69` | feat: aprimora visual com design tokens e ícones Fluent                       |
| `ca03730` | feat: migra frontend de Fluent UI para shadcn/ui                              |
| `17dbecf` | docs: atualiza README e PROGRESS com stack shadcn/ui                           |
| `30bc698` | feat: Fase 3 — Dashboard (backend)                                             |
| `eacbe7c` | feat: Fases 4, 5 e 6 — Dívidas, Orçamento/Metas e Relatórios/Notificações      |
| `2216984` | feat: Fases 4, 5 e 6 — backend completo                                           |
| `2cd565d` | feat: frontend Fases 4–6 + NotificationConsumer + migration Phase3to6                |

---

## Como retomar

1. Abrir este arquivo para ver o que está pendente
2. Rodar `make up` para iniciar o ambiente
3. A migração `Phase3to6` já foi gerada e será aplicada automaticamente no startup
