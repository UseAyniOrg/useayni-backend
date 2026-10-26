import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import mjml2html from 'mjml';
import { renderEmail } from '../emails/renderEmail';

async function compile() {
  const directory = resolve(__dirname, '../emails');
  const result = await mjml2html(readFileSync(resolve(directory, 'transactional.mjml'), 'utf8'), {
    validationLevel: 'strict', minify: true,
  });
  if (result.errors.length || Buffer.byteLength(result.html) >= 90000) {
    throw new Error('Invalid email template or HTML exceeds 90KB');
  }
  writeFileSync(resolve(directory, 'transactional.html'), result.html);
  console.log(`Email template compiled: ${Buffer.byteLength(result.html)} bytes`);
  if (process.argv.includes('--preview')) {
    const preview = renderEmail({
      title: 'Conclua seu acesso de administrador', organization: 'Organização de demonstração',
      body: 'Você recebeu um convite para administrar sua organização no UseAyni. Conclua seu acesso pelo link abaixo.',
      details: 'O link é válido por 24 horas. Se você já possui uma conta UseAyni, sua senha atual será preservada.',
      reason: 'Você recebeu esta mensagem porque a organização convidou este endereço.',
      action: { label: 'Concluir meu acesso', url: 'https://www.useayni.com/login' },
    });
    const output = resolve(directory, 'preview.html');
    writeFileSync(output, preview.html);
    console.log(`Preview: ${output}`);
  }
}

void compile().catch(() => { console.error('Email compilation failed'); process.exitCode = 1; });