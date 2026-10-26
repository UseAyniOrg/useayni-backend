import { z } from 'zod';

const publicLink = z.string().trim().max(2048).refine(
  (value) => value.startsWith('/') || /^https:\/\/[^/]+/i.test(value),
  'Use uma rota local ou uma URL HTTPS.',
);
const assetId = z.string().uuid();
const text = z.string().trim().max(5000);

export const ORG_HOME_SECTION_TYPES = [
  'HERO',
  'CAMINHOS',
  'VANTAGENS',
  'NUMEROS',
  'SOBRE_HISTORIA',
  'AGENDA',
  'NOTICIAS',
  'PUBLICACOES',
  'ESPACOS_SERVICOS',
  'PROGRAMAS_NUCLEOS',
  'MIDIA',
  'DIRETORIA',
  'PARCEIROS',
  'TALENTOS',
  'CONTATO',
  'FAQ',
  'CTA_FINAL',
  'TEXTO_LIVRE',
] as const;

export type OrgHomeSectionType = typeof ORG_HOME_SECTION_TYPES[number];

const schemas: Record<OrgHomeSectionType, z.ZodType<Record<string, unknown>>> = {
  HERO: z.object({
    slides: z.array(z.object({
      title: text.max(180),
      description: text.max(1000).optional(),
      image_asset_id: assetId.optional(),
      image_alt: z.string().trim().max(250).optional(),
      video_url: z.string().url().startsWith('https://').optional(),
      button_text: z.string().trim().max(80).optional(),
      button_url: publicLink.optional(),
    }).strict().superRefine((slide, context) => {
      if (slide.image_asset_id && !slide.image_alt?.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['image_alt'],
          message: 'Informe o texto alternativo da imagem.',
        });
      }
    })).max(10),
  }).strict(),
  CAMINHOS: z.object({
    items: z.array(z.object({
      title: z.string().trim().min(1).max(100),
      description: text.max(600),
      icon: z.string().trim().max(50).optional(),
      url: publicLink,
    }).strict()).max(12),
  }).strict(),
  VANTAGENS: z.object({
    items: z.array(z.object({
      title: z.string().trim().min(1).max(100),
      description: text.max(600),
      icon: z.string().trim().max(50).optional(),
    }).strict()).max(12),
  }).strict(),
  NUMEROS: z.object({
    include_member_count: z.boolean().default(false),
    items: z.array(z.object({
      label: z.string().trim().min(1).max(80),
      value: z.string().trim().max(40).optional(),
      key: z.enum(['members']).optional(),
    }).strict()).max(8),
  }).strict(),
  SOBRE_HISTORIA: z.object({}).strict(),
  AGENDA: z.object({
    limit: z.number().int().min(1).max(12).default(4),
    manual_highlight_ids: z.array(assetId).max(12).default([]),
  }).strict(),
  NOTICIAS: z.object({
    limit: z.number().int().min(1).max(12).default(4),
    manual_highlight_ids: z.array(assetId).max(12).default([]),
  }).strict(),
  PUBLICACOES: z.object({ limit: z.number().int().min(1).max(12).default(4) }).strict(),
  ESPACOS_SERVICOS: z.object({}).strict(),
  PROGRAMAS_NUCLEOS: z.object({}).strict(),
  MIDIA: z.object({
    embeds: z.array(z.object({
      provider: z.enum(['youtube', 'spotify']),
      url: z.string().url().startsWith('https://'),
      title: z.string().trim().min(1).max(150),
    }).strict()).max(12),
  }).strict(),
  DIRETORIA: z.object({ limit: z.number().int().min(1).max(24).default(12) }).strict(),
  PARCEIROS: z.object({
    items: z.array(z.object({
      name: z.string().trim().min(1).max(120),
      logo_asset_id: assetId.optional(),
      image_alt: z.string().trim().max(250).optional(),
      url: publicLink.optional(),
    }).strict().superRefine((item, context) => {
      if (item.logo_asset_id && !item.image_alt?.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['image_alt'],
          message: 'Informe o texto alternativo do logotipo.',
        });
      }
    })).max(40),
    button_text: z.string().trim().max(80).default('Conheça nossos parceiros'),
  }).strict(),
  TALENTOS: z.object({
    description: text.max(1000).default('Conheça a comunidade e os talentos que fazem parte dela.'),
    button_text: z.string().trim().max(80).default('Conheça os talentos'),
  }).strict(),
  CONTATO: z.object({ show_map: z.boolean().default(true) }).strict(),
  FAQ: z.object({}).strict(),
  CTA_FINAL: z.object({}).strict(),
  TEXTO_LIVRE: z.object({}).strict(),
};

export function validateOrgHomeSectionConfig(type: OrgHomeSectionType, config: unknown) {
  return schemas[type].safeParse(config);
}

export function defaultOrgHomeSections() {
  return [
    {
      type: 'HERO' as const,
      order_index: 0,
      enabled: true,
      title: '',
      subtitle: '',
      config: {
        slides: [{
          title: 'Uma comunidade que transforma participação em impacto.',
          description: 'Conecte-se, participe de atividades e ajude a construir o futuro da organização.',
          button_text: 'Quero fazer parte',
          button_url: '/cadastro',
        }],
      },
    },
    {
      type: 'CAMINHOS' as const,
      order_index: 1,
      enabled: true,
      title: 'Explore os caminhos',
      subtitle: 'Encontre a melhor forma de se conectar com a nossa comunidade.',
      config: {
        items: [
          { title: 'Quero me associar', description: 'Faça parte da organização e acompanhe as oportunidades.', icon: 'Users', url: '/cadastro' },
          { title: 'Quero apoiar', description: 'Apoie iniciativas e aproxime sua organização da comunidade.', icon: 'HeartHandshake', url: '/#contato' },
          { title: 'Quero participar de eventos', description: 'Descubra atividades abertas para a comunidade.', icon: 'CalendarDays', url: '/#agenda' },
          { title: 'Quero contratar um membro', description: 'Conheça a rede de talentos da organização.', icon: 'BriefcaseBusiness', url: '/talentos' },
        ],
      },
    },
    {
      type: 'VANTAGENS' as const,
      order_index: 2,
      enabled: true,
      title: 'Cresça junto com a comunidade',
      subtitle: 'Conexões, experiências e oportunidades em um só lugar.',
      config: {
        items: [
          { title: 'Conexões reais', description: 'Aproxime-se de pessoas com interesses e objetivos em comum.', icon: 'Users' },
          { title: 'Experiência prática', description: 'Participe de projetos, eventos e atividades da organização.', icon: 'Rocket' },
          { title: 'Novas oportunidades', description: 'Descubra caminhos para aprender, colaborar e crescer.', icon: 'Sparkles' },
        ],
      },
    },
    {
      type: 'NUMEROS' as const,
      order_index: 3,
      enabled: false,
      title: 'Nossa comunidade em números',
      subtitle: '',
      config: { include_member_count: false, items: [] },
    },
    {
      type: 'AGENDA' as const,
      order_index: 4,
      enabled: true,
      title: 'Agenda da comunidade',
      subtitle: 'Próximos eventos e atividades abertas.',
      config: { limit: 4, manual_highlight_ids: [] },
    },
    {
      type: 'NOTICIAS' as const,
      order_index: 5,
      enabled: true,
      title: 'Novidades',
      subtitle: 'Projetos e atividades recentes da organização.',
      config: { limit: 4, manual_highlight_ids: [] },
    },
    {
      type: 'PARCEIROS' as const,
      order_index: 6,
      enabled: true,
      title: 'Quem caminha com a gente',
      subtitle: 'Apoiadores que ajudam a fortalecer a comunidade.',
      config: { items: [], button_text: 'Conheça nossos parceiros' },
    },
    {
      type: 'TALENTOS' as const,
      order_index: 7,
      enabled: true,
      title: 'Talentos da comunidade',
      subtitle: 'Conecte-se a pessoas e trajetórias que inspiram.',
      config: { description: 'Conheça a comunidade e os talentos que fazem parte dela.', button_text: 'Conheça os talentos' },
    },
    {
      type: 'CONTATO' as const,
      order_index: 8,
      enabled: true,
      title: 'Vamos conversar?',
      subtitle: 'Fale com a equipe da organização.',
      config: { show_map: true },
    },
  ];
}
