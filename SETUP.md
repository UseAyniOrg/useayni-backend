# Produção: Cloud Run e Cloudflare

## Arquitetura

 - Frontend: Cloudflare Worker Static Assets para `www.useayni.com` e `*.useayni.com`.
 - API: Cloud Run Service; `main.ts` escuta `process.env.PORT` em `0.0.0.0`.
 - Worker encaminha `api.useayni.com` à URL HTTPS `*.run.app`; os demais hosts recebem o SPA.
 - Emails: API sem worker residente. Um Cloud Run Job processa a outbox uma vez por execução; Cloud Scheduler o chama a cada minuto.
 - Neon e R2 continuam externos. Use a connection string pooled do Neon e segredos R2 no Secret Manager.

## Cloud Run

O Dockerfile multi-stage está nesta pasta. Build local de verificação:

```powershell
docker build -t useayni-api .
```

Publique a imagem em Artifact Registry via CI/Cloud Build. Não inclua `.env` na imagem. Mantenha a mesma imagem para o Service, a migration e a Job de emails.

Configure estas variáveis não secretas no Cloud Run Service:

```text
NODE_ENV=production
EMAIL_PROVIDER=brevo
EMAIL_WORKER_ENABLED=false
EMAIL_DAILY_BUDGET=300
PORT=8080
PUBLIC_APP_URL=https://www.useayni.com
PUBLIC_API_URL=https://api.useayni.com
TENANT_BASE_DOMAIN=useayni.com
ALLOWED_ORIGINS=https://www.useayni.com,https://useayni.com
```

Configure como secrets: `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `BREVO_API_KEY`, `EMAIL_TOKEN_ENCRYPTION_KEY` e `EMAIL_WEBHOOK_SECRET`. Use valores novos/rotacionados; não copie o `.env` local.

Ordem de publicação:

1. Crie a imagem de produção e publique-a no Artifact Registry.
2. Antes de direcionar tráfego para a nova revisão, crie/execute uma Cloud Run Job única com essa imagem e comando `node dist/scripts/runMigrations.js`, usando os mesmos secrets da API. Confirme sucesso nos logs.
3. Implante o Service `useayni-api` com a imagem; início recomendado: 1 vCPU, 1 GiB RAM, mínimo 0, máximo 3 instâncias na região próxima do Neon.
4. Permita invocação pública no Cloud Run, pois existem endpoints públicos de eventos. As rotas administrativas continuam protegidas pelo backend. Configure budgets e monitore egress.

## Worker de email

Crie uma segunda Cloud Run Job com a imagem da API, comando `node dist/jobs/processEmailOutbox.js` e os mesmos secrets. A Job desliga o timer e processa uma leva de até 10 mensagens. Mantenha `EMAIL_WORKER_ENABLED=false` tanto na API como na Job.

Configure Cloud Scheduler com `* * * * *`, target Cloud Run Job, OIDC e service account autorizada a executá-la. Cloud Scheduler inclui três jobs gratuitos por billing account; Cloud Run continua sujeito às cotas mensais e pode cobrar pelo excedente.

## Cloudflare Workers Static Assets

1. `.env.production` configura `VITE_BACKEND_URL=https://api.useayni.com`; essa URL é pública e vai para o bundle.
2. Crie/valide DNS proxied para `useayni.com` e `*.useayni.com`. A rota wildcard precisa do registro DNS wildcard para ser ativada.
3. Implante o Cloud Run Service e obtenha sua URL HTTPS `*.run.app`.
4. Na pasta `ayni-frontend`, publique o Worker:

```powershell
$env:CLOUD_RUN_API_ORIGIN = 'https://<servico-cloud-run>.run.app'
npm run deploy:workers
```

O script valida a URL e a passa ao Wrangler como `API_ORIGIN`. É uma origem pública, não um segredo. `wrangler.jsonc` registra as rotas apex e wildcard; confirme que a zona `useayni.com` está ativa na conta Cloudflare antes do deploy.

Após DNS/TLS propagar, valide `www`, apex, um tenant, API, CORS, login, inscrição pública e mídia `/m/:id`. A Brevo deve apontar para `https://api.useayni.com/email/webhooks/brevo` com o header `X-Email-Webhook-Secret` configurado.

## Free tier e limites

Workers Free inclui até 100 mil invocações dinâmicas por dia; assets estáticos são gratuitos. Cloud Run tem cotas mensais por região e requer billing ativo; egress e uso acima das cotas podem gerar cobrança. Budgets/alertas não interrompem automaticamente os serviços.

## Comandos operacionais

```powershell
npm run build
npm run db:migrate:once
npm run email:process-once
```

Use `email:process-once` localmente apenas com `EMAIL_PROVIDER=mock` para evitar mensagens reais.
# Produção: Cloud Run e Cloudflare

## Arquitetura

- Frontend: Cloudflare Worker Static Assets, servido em `www.useayni.com` e `*.useayni.com`.
- API: Cloud Run Service; `main.ts` escuta `process.env.PORT` e `0.0.0.0`.
- O Worker encaminha `api.useayni.com` à URL HTTPS `*.run.app`; demais hosts recebem o SPA.
- Email: API sem timer em background. Um Cloud Run Job processa uma leva da outbox; Cloud Scheduler o invoca uma vez por minuto.
- Neon e R2 permanecem serviços externos. Configure a connection string pooled do Neon e segredos R2 no Secret Manager.

## Cloud Run

Build local de verificação:

```powershell
docker build -t useayni-api .
```

Use o mesmo container para migration, API e Job. Não inclua `.env` na imagem. Faça push para Artifact Registry a partir do CI/Cloud Build e configure os serviços via Secret Manager.

Variáveis não secretas da API:

```text
NODE_ENV=production
EMAIL_PROVIDER=brevo
EMAIL_WORKER_ENABLED=false
EMAIL_DAILY_BUDGET=300
PORT=8080
PUBLIC_APP_URL=https://www.useayni.com
PUBLIC_API_URL=https://api.useayni.com
TENANT_BASE_DOMAIN=useayni.com
ALLOWED_ORIGINS=https://www.useayni.com,https://useayni.com
```

Segredos da API/Job: `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `BREVO_API_KEY`, `EMAIL_TOKEN_ENCRYPTION_KEY` e `EMAIL_WEBHOOK_SECRET`. Use valores rotacionados, não copie o `.env` local.

Ordem de publicação:

1. Crie a imagem e publique-a no Artifact Registry.
2. Antes de enviar tráfego à nova versão, rode uma Cloud Run Job única com comando `node dist/scripts/runMigrations.js`, usando a mesma imagem e conexão do banco. Confirme o log de sucesso.
3. Implante o Cloud Run Service `useayni-api` com a imagem e variáveis acima; início recomendado: 1 vCPU, 1 GiB RAM, mínimo 0 e máximo 3 instâncias na região próxima ao Neon.
4. Permita invocação pública no serviço porque há endpoints públicos de eventos; as rotas administrativas continuam protegidas pelo backend. Configure budget alerts e limite de instâncias.

Para verificar o container local sem acesso ao provedor, configure `EMAIL_PROVIDER=mock` e `EMAIL_WORKER_ENABLED=false` em ambiente local.

## Worker de email

Crie uma Cloud Run Job com a imagem da API, comando `node dist/jobs/processEmailOutbox.js` e os mesmos segredos da API. O script desliga o timer e processa uma única leva, no máximo 10 mensagens. Configure `EMAIL_WORKER_ENABLED=false` também na Job.

Crie uma Cloud Scheduler Job com agenda `* * * * *`, alvo Cloud Run Job, autenticação OIDC e uma service account com permissão para executar a Job. O plano gratuito atual inclui três Scheduler Jobs por billing account; a execução do Cloud Run continua sujeita às cotas gratuitas mensais e pode gerar cobrança ao excedê-las.

## Cloudflare Workers Static Assets

1. Configure `VITE_BACKEND_URL=https://api.useayni.com` no build. O arquivo `.env.production` já contém essa URL pública.
2. Em DNS, crie/valide registros proxied para `useayni.com` e `*.useayni.com`. A rota wildcard precisa de um registro DNS wildcard para ativar no Worker.
3. Publique primeiro o Cloud Run e copie sua URL HTTPS `*.run.app`.
4. Na pasta `ayni-frontend`, rode:

```powershell
$env:CLOUD_RUN_API_ORIGIN = 'https://<servico-cloud-run>.run.app'
npm run deploy:workers
```

O script valida a URL e passa `API_ORIGIN` ao Wrangler. Não coloque segredos nesta variável; ela é apenas a origem pública do serviço. O Worker roteia `api.useayni.com` para essa origem e serve o SPA nos demais hosts. As rotas wildcard estão em `wrangler.jsonc`.

Valide `www`, apex, um tenant, `api`, CORS, login, inscrição pública, `/m/:id` e as rotas administrativas após o DNS/TLS propagar. Configure `EMAIL_WEBHOOK_SECRET` na Brevo no header `X-Email-Webhook-Secret` da URL `https://api.useayni.com/email/webhooks/brevo`.

## Custos e limites

Cloudflare Workers Free inclui 100 mil invocações dinâmicas/dia; requisições servidas como static assets são gratuitas e ilimitadas. Cloud Run tem cotas gratuitas mensais, mas requer billing ativo, egress pode ser cobrado e limites excedidos não param automaticamente o serviço. Configure budgets/alertas e use o máximo de instâncias para controlar risco de custo.

Para limites Brevo, chaves e rotação veja [EMAILS.md](EMAILS.md).
