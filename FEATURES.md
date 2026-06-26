# Features — Quite-Up

---

## Fase 1 — Autenticação e Cadastro de Usuário

### Cadastro

**Fluxo:**
1. Usuário preenche: nome completo, email e senha
2. Sistema valida os dados
3. Cria a conta com status `inativo`
4. Envia email de verificação
5. Redireciona para tela de "Verifique seu email"

**Validações:**
- Nome: obrigatório, mínimo 2 caracteres, máximo 100
- Email: obrigatório, formato válido, único no sistema
- Senha: obrigatório, mínimo 8 caracteres, deve conter ao menos 1 letra maiúscula, 1 minúscula e 1 número
- Confirmar senha: deve ser idêntica à senha

**Regras:**
- Senha armazenada com hash via `IPasswordHasher<T>` do ASP.NET Core
- Conta criada com status `inativo` — nenhuma ação é permitida até verificação do email
- Se o email já existir no sistema: retornar erro genérico ("Email ou senha inválidos") para não vazar informação

---

### Verificação de email

**Fluxo:**
1. Email enviado com link contendo token único
2. Usuário clica no link
3. Sistema valida o token
4. Conta é ativada (status `ativo`)
5. Usuário é redirecionado para o login com mensagem de sucesso

**Regras:**
- Token de uso único — invalidado após uso
- Token expira em **24 horas**
- Link expirado: usuário pode solicitar reenvio do email de verificação
- Reenvio permitido no máximo **3 vezes por hora** por email (proteção contra abuso)

---

### Login

**Fluxo:**
1. Usuário informa email e senha
2. Sistema valida credenciais
3. Retorna access token (JWT) no corpo da resposta
4. Refresh token salvo em cookie HttpOnly

**Regras:**
- Conta inativa (email não verificado): retornar erro específico com mensagem orientando o usuário a verificar o email
- Credenciais inválidas: mensagem genérica ("Email ou senha inválidos")
- Após **5 tentativas falhas consecutivas**, conta bloqueada por **15 minutos**
- Access token com duração de **15 minutos**
- Refresh token com duração de **7 dias**

---

### Logout

**Fluxo:**
1. Usuário clica em "Sair"
2. Sistema invalida o refresh token no banco
3. Cookie é removido do cliente
4. Usuário redirecionado para a tela de login

**Regras:**
- Logout invalida apenas o refresh token do dispositivo atual
- Access tokens existentes expiram naturalmente (não há blacklist de access tokens)

---

### Refresh token

**Fluxo:**
1. Frontend detecta que o access token expirou (resposta 401)
2. Chama automaticamente o endpoint `/auth/refresh`
3. Sistema valida o refresh token do cookie
4. Emite novo access token e novo refresh token (rotating)
5. Frontend repete a request original com o novo access token

**Regras:**
- Refresh token é **rotacionado** a cada uso — o anterior é invalidado imediatamente
- Refresh token armazenado no banco com **hash** (nunca em texto puro)
- Se refresh token inválido ou expirado: usuário é deslogado e redirecionado para o login
- Detecção de reutilização: se um refresh token já usado for apresentado novamente, **todos os refresh tokens do usuário são invalidados** (possível roubo de token)

---

### Recuperação de senha

**Fluxo:**
1. Usuário acessa "Esqueci minha senha" e informa o email
2. Sistema envia email com link de redefinição
3. Usuário clica no link e define nova senha
4. Token é invalidado, usuário redirecionado para o login

**Regras:**
- Se o email não existir: resposta de sucesso genérica (não vazar informação)
- Token expira em **1 hora**
- Token de uso único — invalidado após uso
- Máximo de **3 solicitações por hora** por email
- Nova senha deve seguir as mesmas regras de validação do cadastro
- Após redefinição, todos os refresh tokens do usuário são invalidados (forçar novo login)

---

## Fase 2 — Contas, Categorias, Transações e Perfil

### Contas

**O que é:**
Representação das contas financeiras reais do usuário. Toda transação é vinculada a uma conta.

**Campos:**
- Nome (ex: "Nubank", "Carteira", "Poupança Itaú")
- Tipo: Conta corrente, Poupança, Carteira (dinheiro físico), Outro
- Saldo inicial (valor no momento do cadastro da conta no app)
- Ativa/inativa

**Fluxo de criação:**
1. Usuário informa nome, tipo e saldo inicial
2. Sistema cria a conta com o saldo inicial registrado como uma transação de entrada do tipo "Saldo inicial"

**Regras:**
- Mínimo de 1 conta ativa por usuário
- Conta com transações **não pode ser excluída** — apenas desativada
- Conta desativada não aparece nas opções de nova transação
- Saldo é calculado dinamicamente: saldo inicial + receitas - despesas - transferências saídas + transferências entradas
- Usuário pode ter múltiplas contas

---

### Categorias

**O que é:**
Agrupadores para classificar transações. Cada categoria pertence ao tipo receita ou despesa.

**Campos:**
- Nome
- Tipo: Receita ou Despesa
- Ícone (selecionado de uma lista pré-definida)
- Cor (selecionada de uma paleta pré-definida)

**Categorias padrão (pré-cadastradas):**
- Despesa: Alimentação, Transporte, Saúde, Moradia, Educação, Lazer, Vestuário, Outros
- Receita: Salário, Freelance, Investimentos, Outros

**Regras:**
- Usuário pode criar, editar e excluir categorias personalizadas
- Categorias padrão **não podem ser excluídas**, apenas as criadas pelo usuário
- Categoria com transações vinculadas **não pode ser excluída** — usuário deve reclassificar as transações antes
- Nome único por usuário (por tipo)

---

### Transações

**O que é:**
Registro de movimentações financeiras: entradas (receitas), saídas (despesas) e transferências entre contas.

**Campos:**
- Tipo: Receita, Despesa ou Transferência
- Valor (positivo)
- Data
- Conta de origem
- Categoria (não se aplica a transferências)
- Conta de destino (apenas para transferências)
- Descrição (opcional)

**Fluxo — Receita/Despesa:**
1. Usuário informa tipo, valor, data, conta, categoria e descrição opcional
2. Saldo da conta é atualizado imediatamente

**Fluxo — Transferência:**
1. Usuário informa valor, data, conta de origem e conta de destino
2. Saldo da conta de origem diminui, saldo da conta de destino aumenta

**Regras:**
- Valor deve ser maior que zero
- Data pode ser passada, presente ou futura (lançamento futuro)
- Transações futuras **não afetam o saldo atual** — apenas o saldo projetado
- Transação pode ser editada ou excluída
- Ao excluir, o saldo da(s) conta(s) é revertido
- Transferência entre a mesma conta: não permitida

---

### Perfil do usuário

**Fluxo — Editar nome:**
1. Usuário altera o nome e salva
2. Atualizado imediatamente

**Fluxo — Alterar email:**
1. Usuário informa novo email e senha atual (para confirmar identidade)
2. Email de verificação enviado para o novo endereço
3. Email só é alterado após confirmação
4. Todos os refresh tokens são invalidados após a troca

**Fluxo — Alterar senha:**
1. Usuário informa senha atual e nova senha
2. Validação da senha atual antes de alterar
3. Todos os refresh tokens são invalidados após a troca (forçar novo login em todos os dispositivos)

**Fluxo — Excluir conta:**
1. Usuário solicita exclusão e confirma com a senha
2. Todos os dados do usuário são excluídos permanentemente (sem soft delete)
3. Sessão encerrada imediatamente

---

## Fase 3 — Dashboard

**O que é:**
Tela inicial após o login. Visão consolidada da saúde financeira do usuário.

**Seções:**

**Saldo total:**
- Soma dos saldos de todas as contas ativas
- Opção de mostrar/ocultar o valor (privacidade)

**Resumo do mês atual:**
- Total de receitas do mês
- Total de despesas do mês
- Saldo do período (receitas - despesas)
- Comparação com o mês anterior (ex: "Você gastou 12% a mais que o mês passado")

**Dívidas:**
- Total restante de todas as dívidas ativas
- Progresso geral de quitação (barra de progresso)
- Próxima dívida da estratégia Snowball em destaque

**Orçamento do mês:**
- Mini resumo por categoria: quanto foi gasto vs o limite definido
- Destaque para categorias próximas do limite ou estouradas

**Últimas transações:**
- Lista das 5 transações mais recentes
- Link para ver todas

**Responsividade:**
- Layout adaptado para mobile: seções empilhadas verticalmente
- Cards com informações densas em desktop, simplificados no mobile

---

## Fase 4 — Dívidas

### Cadastro de dívidas

**Tipos:**
- Empréstimo
- Financiamento
- Cartão de crédito

**Campos:**
- Nome do credor (ex: "Banco Inter", "Financeira X")
- Tipo
- Valor total original da dívida
- Saldo restante atual (pode diferir do total se já houve pagamentos antes de usar o app)
- Taxa de juros mensal
- Valor da parcela mensal (mínimo)
- Data de vencimento da parcela (dia do mês)
- Data de encerramento prevista
- Desconto por antecipação: sim/não — se sim, percentual de desconto oferecido

**Regras:**
- Saldo restante não pode ser maior que o valor total original
- Taxa de juros deve ser maior ou igual a zero
- Data de encerramento deve ser futura

---

### Registro de pagamentos

**Fluxo:**
1. Usuário seleciona a dívida e registra um pagamento
2. Informa: valor pago, data do pagamento e observação opcional
3. Saldo restante da dívida é decrementado
4. Se saldo restante chegar a zero: dívida marcada como **quitada**

**Regras:**
- Valor do pagamento não pode ser maior que o saldo restante
- Pagamento pode ser vinculado a uma conta do usuário (opcional — para refletir na movimentação)
- Histórico de pagamentos preservado mesmo após a dívida ser quitada
- Pagamento pode ser excluído — saldo restante é revertido

---

### Desconto por antecipação

**Fluxo:**
1. Se a dívida tem desconto por antecipação cadastrado, o app exibe o **valor com desconto** caso o usuário queira quitar antecipadamente
2. Ao registrar um pagamento que quite o saldo total com desconto, o app pergunta: "Você está quitando com desconto de X%? O valor final será R$ Y."
3. Usuário confirma e a dívida é marcada como quitada

---

### Gamificação

- Barra de progresso visual em cada dívida (% pago / % restante)
- Marcos comemorativos: 25%, 50%, 75% e 100% quitado
- Animação de celebração ao quitar uma dívida
- Tela de "Parabéns" ao quitar, mostrando total pago e tempo levado
- Histórico de dívidas quitadas com data de conclusão

---

### Estratégia Snowball

**Como funciona no app:**
1. App lista as dívidas ordenadas por saldo restante (menor primeiro)
2. Usuário informa quanto pode colocar de **valor extra por mês** além dos pagamentos mínimos
3. App calcula e sugere: "Coloque R$ X extra na dívida [nome] (menor saldo)"
4. Exibe projeção mês a mês: quando cada dívida será quitada nesse ritmo
5. Ao quitar uma dívida, o app recalcula automaticamente e redireciona o valor liberado para a próxima

**Projeção:**
- Tabela/linha do tempo mostrando mês a mês o progresso esperado
- Data estimada de quitação de cada dívida
- Data estimada de quitação total de todas as dívidas

**Regras:**
- Projeção é uma estimativa — não considera variação de juros nem pagamentos extras esporádicos
- Recalculada automaticamente a cada novo pagamento registrado

---

## Fase 5 — Orçamento e Metas

### Orçamento

**O que é:**
Limite de gastos mensais por categoria. Permite ao usuário planejar e controlar os gastos.

**Fluxo de criação:**
1. Usuário seleciona uma categoria de despesa
2. Define o valor limite para o mês
3. Pode definir o mesmo limite para todos os meses ou personalizar por mês

**Acompanhamento:**
- Barra de progresso por categoria: gasto atual vs limite
- Status: Normal (< 80%), Atenção (80–99%), Estourado (≥ 100%)
- No Dashboard: mini-resumo das categorias com orçamento

**Regras:**
- Orçamento definido apenas para categorias de despesa
- Limite deve ser maior que zero
- Orçamento é opcional — usuário escolhe quais categorias quer controlar

---

### Metas financeiras

**O que é:**
Objetivo de economia com valor alvo e prazo.

**Campos:**
- Nome da meta (ex: "Viagem para Europa")
- Valor alvo
- Prazo (data)
- Descrição opcional

**Fluxo:**
1. Usuário cria a meta com nome, valor alvo e prazo
2. Registra aportes periodicamente (valor + data + observação opcional)
3. App acompanha progresso e projeta conclusão

**Acompanhamento:**
- Barra de progresso: valor acumulado vs valor alvo
- Percentual concluído
- Projeção: "No ritmo atual, você atingirá a meta em [data]"
- Comparação com o prazo definido: "X meses antes do prazo" ou "X meses atrasado"

**Regras:**
- Meta pode ser marcada como concluída manualmente mesmo sem atingir o valor
- Meta pode ser arquivada (sai da lista principal mas preserva histórico)
- Valor dos aportes **não é descontado automaticamente** de nenhuma conta — o usuário decide se vincula a uma conta ou não
- Prazo pode ser editado

---

## Fase 6 — Relatórios e Notificações

### Relatórios

**Filtros disponíveis:**
- Período: mês atual, mês anterior, últimos 3 meses, últimos 6 meses, último ano, personalizado

**Gráficos e relatórios:**

1. **Gastos por categoria** — gráfico de pizza/donut mostrando distribuição de despesas no período
2. **Receitas vs Despesas** — gráfico de barras mês a mês comparando entradas e saídas
3. **Evolução do saldo** — gráfico de linha mostrando o saldo consolidado ao longo do tempo
4. **Progresso das dívidas** — gráfico de linha mostrando redução do total de dívidas ao longo do tempo
5. **Maiores gastos do período** — lista das transações de maior valor no período

**Regras:**
- Relatórios gerados sob demanda (não pré-calculados)
- Exportação em PDF — fase futura, fora do escopo atual

---

### Notificações

**Tipos:**

| Evento | Canal | Quando |
|---|---|---|
| Vencimento de dívida | Email + in-app | 3 dias antes |
| Orçamento próximo do limite | In-app | Ao atingir 80% |
| Orçamento estourado | Email + in-app | Ao ultrapassar 100% |
| Meta financeira atingida | Email + in-app | Ao atingir 100% |
| Dívida quitada | Email + in-app | Ao registrar pagamento que zera o saldo |

**Notificações in-app:**
- Ícone de sino no header com contador de não lidas
- Lista de notificações com data, tipo e mensagem
- Marcar como lida individualmente ou todas de uma vez

**Notificações por email:**
- Enviadas via SMTP próprio
- Usuário pode desativar cada tipo de notificação por email nas configurações do perfil

**Regras:**
- Notificações in-app armazenadas no banco com status (lida/não lida)
- Notificações antigas (> 90 dias) removidas automaticamente
- Não enviar o mesmo alerta de vencimento mais de uma vez por dívida por período

---

## Notas técnicas

- App totalmente responsivo — mobile-first
- Envio de email: SMTP próprio via **MailKit**
- Refresh token: cookie HttpOnly, rotating, armazenado no banco com hash
- IDs expostos na API: string curta via **Hashids.net** (decodifica para ID interno `long`)
- Estratégia de quitação: apenas **Snowball** (menor saldo primeiro)
- Transações futuras não afetam saldo atual, apenas projetado
