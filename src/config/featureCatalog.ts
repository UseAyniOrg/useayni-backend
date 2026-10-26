export interface FeatureDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
  available: boolean;
  required?: boolean;
  requires?: string[];
}

export const FEATURE_CATALOG: FeatureDefinition[] = [
  { slug: 'core', name: 'Base da plataforma', description: 'Cadastro, perfis e área de membros.', category: 'Essencial', available: true, required: true },
  { slug: 'hierarchy', name: 'Hierarquia e cargos', description: 'Unidades organizacionais, cargos, permissões e mandatos.', category: 'Gestão', available: true },
  { slug: 'miscellaneous_full', name: 'Miscelâneas e eventos', description: 'Projetos, eventos, reuniões e atividades.', category: 'Gestão', available: true },
  { slug: 'miscellaneous_forms', name: 'Formulários', description: 'Formulários, votações e resultados.', category: 'Gestão', available: true, requires: ['miscellaneous_full'] },
  { slug: 'miscellaneous_attendance', name: 'Controle de presença', description: 'Sessões de presença e check-in.', category: 'Gestão', available: true, requires: ['miscellaneous_full'] },
  { slug: 'miscellaneous_public', name: 'Publicação pública', description: 'Páginas públicas de eventos e formulários.', category: 'Comunicação', available: true, requires: ['miscellaneous_full'] },
  { slug: 'media_storage', name: 'Armazenamento de mídia', description: 'Uploads de mídia com cota individual por organização.', category: 'Conteúdo', available: true },
  { slug: 'registration_approval', name: 'Aprovação de cadastros', description: 'Revisão administrativa de novos membros.', category: 'Membros', available: true },
  { slug: 'custom_fields', name: 'Campos customizados', description: 'Dados adicionais definidos pela organização.', category: 'Membros', available: true },
  { slug: 'finance_manual', name: 'Financeiro manual', description: 'Categorias financeiras e registro manual de pagamentos.', category: 'Financeiro', available: false },
  { slug: 'finance_gateway', name: 'Gateway de pagamento', description: 'Cobranças, split de pagamentos e webhooks.', category: 'Financeiro', available: false },
  { slug: 'communication_email', name: 'Email transacional', description: 'Confirmação de inscrição externa por email. Convites e recuperação de conta são serviços essenciais da plataforma.', category: 'Comunicação', available: true },
  { slug: 'communication_blast', name: 'Email marketing', description: 'Envio manual de campanhas para segmentos de membros.', category: 'Comunicação', available: false },
  { slug: 'communication_chat', name: 'Chat interno', description: 'Mensagens diretas e grupos entre membros.', category: 'Comunicação', available: false },
  { slug: 'governance', name: 'Governança', description: 'Eleições formais e votações em plenária.', category: 'Governança', available: false },
  { slug: 'blog', name: 'Blog', description: 'Publicações públicas da organização.', category: 'Conteúdo', available: false },
  { slug: 'documents', name: 'Documentos e wiki', description: 'Documentos e conteúdos organizados por pastas.', category: 'Conteúdo', available: false },
  { slug: 'space_booking', name: 'Reserva de espaços', description: 'Reserva de salas e espaços físicos.', category: 'Operações', available: false },
  { slug: 'courses_embed', name: 'Cursos', description: 'Cursos com vídeos incorporados e certificados.', category: 'Conteúdo', available: false },
  { slug: 'sponsors', name: 'Parceiros', description: 'Seção pública de parceiros e apoiadores na home.', category: 'Conteúdo', available: true },
  { slug: 'talent_network', name: 'Rede de talentos', description: 'Chamada pública para a futura rede de talentos da organização.', category: 'Conteúdo', available: true },
  { slug: 'member_card', name: 'Carteirinha digital', description: 'Carteirinha de membro digital e em PDF.', category: 'Membros', available: false },
  { slug: 'otp_login', name: 'OTP no login', description: 'Verificação adicional no acesso.', category: 'Segurança', available: false },
  { slug: 'otp_registration', name: 'OTP no cadastro', description: 'Verificação de email ou telefone no cadastro.', category: 'Segurança', available: false },
  { slug: 'profile_visibility', name: 'Visibilidade de perfil', description: 'Controle de privacidade dos perfis públicos.', category: 'Membros', available: false },
  { slug: 'notifications_inapp', name: 'Notificações in-app', description: 'Central de notificações da plataforma.', category: 'Comunicação', available: false },
];

export const getFeatureDefinition = (slug: string) =>
  FEATURE_CATALOG.find((feature) => feature.slug === slug);
