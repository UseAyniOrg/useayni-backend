# Emails transacionais

## Estado da implementação

Primeira etapa implementada:

- Porta `EmailProvider`, adapter REST Brevo e provider mock sem disparos.
- Outbox PostgreSQL com payload AES-256-GCM, chave idempotente, prioridade, expiração, leases e orçamento global diário.
- Convite de administrador chefe na criação da organização, junto da transação de criação. `settings.provisioning.admin_email` é o administrador operacional; `chief_email` continua sendo o responsável legal.
- Convites individuais/importação substituem senhas temporárias nas respostas administrativas. Conta existente precisa da senha atual para aceitar; conta nova define nome e senha. Nenhum acesso é concedido antes do aceite.
- Organização DRAFT pode concluir onboarding pelo link global, mas continua sem acesso ao painel até ACTIVE/TRIAL.
- Recuperação real por email, link de 30 minutos, consumo único e revogação de sessões globais após redefinir senha.
- Confirmação da inscrição externa, na mesma transação da participação, quando `communication_email` está habilitado. Sem envio retroativo. Imagens opcionais PNG/JPEG em URL HTTPS pública sem query ou assets PUBLIC/ACTIVE servidos por `/m/:id`; imagens privadas e links temporários não são publicados. WebP pode não aparecer em clientes Outlook antigos; título/dados essenciais continuam em texto.
- Template MJML e HTML compilado pertencem à aplicação, não ao provedor.
- Webhook autenticado e consulta/tabela de consumo no SuperAdmin, com exportação CSV sem conteúdo de mensagens.

Ainda não implementado: OTP de login, verificação de cadastro em etapas, preferências operacionais, demais cenários de notificações internas, fanout de alterações/cancelamentos e lembretes. Os respectivos flags continuam indisponíveis para evitar anunciar uma implementação parcial. AWS SES é uma expansão futura do adapter.

## Configuração

Somente no ambiente do backend:

```dotenv
EMAIL_PROVIDER=mock
EMAIL_WORKER_ENABLED=false
EMAIL_DAILY_BUDGET=300
EMAIL_TOKEN_ENCRYPTION_KEY=<32 bytes aleatórios em base64>
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:3333
TENANT_BASE_DOMAIN=useayni.com
BREVO_API_KEY=<chave REST da Brevo, não SMTP_KEY>
EMAIL_WEBHOOK_SECRET=<segredo aleatório de pelo menos 32 caracteres>
EMAIL_TEST_RECIPIENT_ALLOWLIST=seu-endereco-de-teste@example.com
```

Gere cada segredo localmente, sem copiar valores de exemplos ou versioná-los:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Preserve a chave de criptografia enquanto houver mensagens pendentes. Não reutilize JWT_SECRET. Nunca coloque BREVO_API_KEY, SMTP_KEY ou chaves criptográficas em variáveis VITE_. Uma credencial preenchida em exemplo de ambiente deve ser rotacionada no provedor e seu histórico de exposição revisado; remover o valor do arquivo não revoga a chave.

Em produção, configure `PUBLIC_APP_URL=https://www.useayni.com`. Os links de tenant usam `https://{slug}.useayni.com`; localhost usa `/o/{slug}`. Não são construídos a partir de Origin fornecido pelo cliente. Links de convite/reset carregam segredo no fragmento, não na query; o frontend limpa o fragmento após ler. Recarregar a página depois disso exige reabrir o email.

O remetente é sempre `UseAyni <no-reply@useayni.com>`. Antes de usar Brevo, cadastre/verifique o remetente, autentique o domínio e configure os registros DNS indicados no painel (DKIM/DMARC e demais registros exigidos, sem criar registros SPF conflitantes). A credencial SMTP `xsmtpsib-...` não autentica o adapter REST.

## Migração e operação

1. Faça backup e aplique a migração `1793000000000-TransactionalEmail` com `npm run migration:run` no ambiente de destino. O teste de integração não aplica a migração permanentemente.
2. Configure a chave de criptografia antes de criar organizações com admin_email ou emitir convites. Sem a chave, a operação falha de forma explícita; a criação atômica é revertida.
3. Teste primeiro com `EMAIL_PROVIDER=mock`. Ao habilitar `EMAIL_WORKER_ENABLED=true`, o worker executa em intervalos de 10 segundos. Mock remove o payload após processar e registra `simulated`, nunca `accepted`.
4. Para envio real, use `EMAIL_PROVIDER=brevo` e chave REST válida. Fora de produção, todos os destinatários precisam constar na allowlist; outros serão marcados `blocked` e não serão enviados. Revise a fila antes de ativar em produção.
5. O worker usa o banco, não Redis. Mensagens não são reenfileiradas retroativamente por ações anteriores à integração. Falha de entrega não desfaz uma organização já criada.

O plano Free da Brevo tem orçamento global compartilhado de 300 emails/dia, sujeito ao painel/contrato atual. Não há limite comercial por organização nem cobrança automática. O orçamento técnico usa dias UTC; aceites do provedor e reservas de envio são contados de modo conservador. OTP e prazos de entrega não podem ser garantidos quando o provedor estiver indisponível ou sem cota.

Um timeout de rede tem resultado potencialmente ambíguo: `unknown` exige investigação/reconciliação, não retry cego. A chave idempotente enviada à Brevo é estável por dispatch, mas não implica garantia universal de exactly-once. Não altere unknown para queued sem verificar a entrega. Leases expiradas também vão para unknown. Respostas transitórias conhecidas têm backoff; tentativas repetidas não contam como novos aceites. Falhas permanentes descartam o payload criptografado.

## Webhook

Configure na Brevo uma URL HTTPS global:

```text
POST https://api.useayni.com/email/webhooks/brevo
X-Email-Webhook-Secret: <EMAIL_WEBHOOK_SECRET>
```

Configure o header na configuração do webhook Brevo. Não coloque o segredo na URL. Suportados: request/sent, delivered, deferred, soft_bounce, hard_bounce, spam, invalid_email, blocked e error. Eventos de abertura/clique não são necessários para contabilização. O handler resolve a mensagem por provider/message-id, não por tenant enviado no body, e deduplica eventos. Hard bounce, spam, blocked e invalid_email entram em supressão. Não contorne supressões para forçar recuperação de conta; investigue o endereço/canal alternativo.

## Uso no SuperAdmin

`GET /email/usage?from=YYYY-MM-DD&to=YYYY-MM-DD`, somente EQUIPE_TECNICA no contexto da plataforma. A tabela aparece na visão geral do SuperAdmin e permite filtro por organização/tipo/provedor e exportação CSV.

Métrica de consumo: mensagem por destinatário aceita pela Brevo, separada de tentativas e entregas confirmadas por webhook. Mensagens globais sem contexto validado ficam em Plataforma. Simulações não são faturáveis. Esta versão não emite faturas nem implementa retenção/agregação histórica de cobrança; retenção e reconciliação operacional são parte da etapa seguinte.

## Segurança dos fluxos

- Inspeção de convite via POST somente leitura; scanners que abrem links não consomem o convite.
- Aceite/reset com lock de linha, validade e consumo único. Cinco tentativas incorretas de senha bloqueiam o convite.
- Solicitação de reset tem resposta genérica, cooldown de 60 segundos, até cinco emissões por hora por endereço e rate limit persistido por origem. Não oferece recuperação por telefone.
- Convite de 24 horas; reenvio invalida o anterior. A senha de conta já configurada nunca é substituída por aceitar convite de outro tenant.
- A chave da outbox protege HTML/texto que contêm links sensíveis; após enviar/expirar, o payload é descartado. Não logar bodies dessas rotas ou URLs de links; não adicionar analytics nas páginas de ação.

## Templates e testes

Fonte `src/emails/transactional.mjml`, compilado `src/emails/transactional.html`; build copia HTML para dist. Uma coluna, 600px, fontes seguras, tabelas e CSS inline. O template suporta imagem opcional e CTA, sem SVG/formulário/JavaScript. O rodapé Brevo é inserido pelo provedor; não o esconder nem duplicar. Validar sua aparência em envio real de teste antes de produção.

```powershell
npm run email:compile
npm run email:preview
npm run test:email
npm run test:email:integration
npm run test:onboarding
npm run test:access-events
npm run build
```

O teste de integração usa o PostgreSQL configurado, cria migração/dados dentro de transação e faz rollback integral, inclusive DDL. Use banco de desenvolvimento/teste, nunca produção. O provider é forçado a mock. Validar também o teste de onboarding integração e o build/testes do frontend. A validação MJML não substitui testes em Gmail/Outlook/Apple Mail; nenhum envio para usuários reais deve ser realizado durante testes.