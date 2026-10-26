import { readFileSync } from 'fs';
import { resolve } from 'path';
import { emailConfig } from '../config/email';

export interface EmailContent {
  title: string;
  body: string;
  organization?: string;
  details?: string;
  reason: string;
  action?: { label: string; url: string };
  image?: { url: string; alt: string };
  code?: string;
}

export function escapeEmail(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}

function safeUrl(value: string): string {
  const url = new URL(value);
  const local = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password) {
    throw new Error('Unsafe email URL');
  }
  return escapeEmail(url.toString());
}

let compiled: string;
export function renderEmail(content: EmailContent): { html: string; text: string; subject: string } {
  compiled ??= readFileSync(resolve(__dirname, 'transactional.html'), 'utf8');
  const config = emailConfig();
  const actionUrl = content.action ? safeUrl(content.action.url) : '';
  const values: Record<string, string> = {
    TITLE: escapeEmail(content.title), PREVIEW: escapeEmail(content.body.slice(0, 140)),
    ORGANIZATION: escapeEmail(content.organization ?? 'Sua conta UseAyni'),
    BODY: escapeEmail(content.body).replace(/\n/g, '<br />'),
    DETAILS: escapeEmail(content.details ?? '').replace(/\n/g, '<br />'),
    REASON: escapeEmail(content.reason),
    PRIVACY_URL: safeUrl(new URL('/politica-de-privacidade', config.publicUrl).toString()),
    TERMS_URL: safeUrl(new URL('/termos-de-uso', config.publicUrl).toString()),
    IMAGE_BLOCK: content.image ? `<tr><td style="padding:8px 24px"><img src="${safeUrl(content.image.url)}" alt="${escapeEmail(content.image.alt)}" width="550" style="border:0;display:block;width:100%;max-width:550px;height:auto" /></td></tr>` : '',
    CODE_BLOCK: content.code ? `<tr><td style="padding:16px 24px;font-family:Arial,sans-serif;font-size:30px;font-weight:bold;color:#0d1b2a">${escapeEmail(content.code)}</td></tr>` : '',
    ACTION_BLOCK: content.action ? `<tr><td style="padding:16px 24px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#0e79b2" style="border-radius:4px"><a href="${actionUrl}" style="display:inline-block;padding:14px 20px;color:#ffffff;font:700 16px Arial,sans-serif;text-decoration:none">${escapeEmail(content.action.label)}</a></td></tr></table><p style="font:12px/20px Arial,sans-serif;color:#475569;word-break:break-all">Ou acesse: <a href="${actionUrl}">${actionUrl}</a></p></td></tr>` : '',
  };
  const html = compiled.replace(/{{([A-Z_]+)}}/g, (_match, key: string) => values[key] ?? '');
  if (Buffer.byteLength(html) >= 90000) throw new Error('Email content exceeds 90KB');
  return {
    html, subject: content.title.replace(/[\r\n]/g, ' ').slice(0, 200),
    text: [content.organization ?? 'UseAyni', content.title, content.body, content.details,
      content.code, content.action ? `${content.action.label}: ${content.action.url}` : '', content.reason,
      'Mensagem automática UseAyni. Não responda a este endereço.'].filter(Boolean).join('\n\n'),
  };
}