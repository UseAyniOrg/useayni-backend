export interface HierarchyTemplateDefinition {
  version: 1;
  slug: string;
  name: string;
  description: string;
  organization_profile: string;
  types: Array<{ slug: string; name: string }>;
  units: Array<{ slug: string; name: string; type_slug: string; parent_slug?: string }>;
  positions: Array<{
    name: string;
    type_slug: string;
    investiture_type: 'ELECTION' | 'APPOINTMENT' | 'AUTOMATIC';
    mandate_duration_days?: number;
    allows_deputy?: boolean;
  }>;
}

export const HIERARCHY_TEMPLATES: HierarchyTemplateDefinition[] = [
  {
    version: 1,
    slug: 'centro-academico',
    name: 'Centro Acadêmico',
    organization_profile: 'Entidade estudantil de representação de estudantes de um curso ou campus.',
    description: 'Estrutura enxuta para centros acadêmicos: uma diretoria eleita, representações por curso e comissões temporárias. Use quando a entidade precisa organizar cargos executivos, delegar atividades por curso e criar grupos de trabalho sem impor níveis estaduais ou regionais fixos.',
    types: [
      { slug: 'diretoria', name: 'Diretoria' },
      { slug: 'representacao', name: 'Representação acadêmica' },
      { slug: 'comissao', name: 'Comissão' },
    ],
    units: [
      { slug: 'diretoria-executiva', name: 'Diretoria Executiva', type_slug: 'diretoria' },
      { slug: 'representacoes-de-curso', name: 'Representações de Curso', type_slug: 'representacao', parent_slug: 'diretoria-executiva' },
      { slug: 'comissoes', name: 'Comissões', type_slug: 'comissao', parent_slug: 'diretoria-executiva' },
    ],
    positions: [
      { name: 'Presidência', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 365, allows_deputy: true },
      { name: 'Vice-presidência', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 365, allows_deputy: true },
      { name: 'Secretaria', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 365 },
      { name: 'Tesouraria', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 365 },
      { name: 'Representante de Curso', type_slug: 'representacao', investiture_type: 'ELECTION', mandate_duration_days: 365, allows_deputy: true },
      { name: 'Coordenação de Comissão', type_slug: 'comissao', investiture_type: 'APPOINTMENT', mandate_duration_days: 365 },
    ],
  },
  {
    version: 1,
    slug: 'entidade-de-classe',
    name: 'Entidade de Classe',
    organization_profile: 'Associação profissional com representação territorial, conselhos e comissões temáticas.',
    description: 'Ponto de partida para associações de profissionais e entidades de classe. Separa assembleia, diretoria, conselho fiscal, núcleos territoriais e comissões. Os mandatos e formas de investidura são exemplos editáveis; adapte nomes, duração e regras eleitorais ao estatuto da entidade.',
    types: [
      { slug: 'assembleia', name: 'Assembleia' },
      { slug: 'diretoria', name: 'Diretoria' },
      { slug: 'conselho', name: 'Conselho' },
      { slug: 'nucleo-territorial', name: 'Núcleo territorial' },
      { slug: 'comissao', name: 'Comissão temática' },
    ],
    units: [
      { slug: 'assembleia-geral', name: 'Assembleia Geral', type_slug: 'assembleia' },
      { slug: 'diretoria-estadual', name: 'Diretoria', type_slug: 'diretoria', parent_slug: 'assembleia-geral' },
      { slug: 'conselho-fiscal', name: 'Conselho Fiscal', type_slug: 'conselho', parent_slug: 'assembleia-geral' },
      { slug: 'nucleos-territoriais', name: 'Núcleos Territoriais', type_slug: 'nucleo-territorial', parent_slug: 'diretoria-estadual' },
      { slug: 'comissoes-tematicas', name: 'Comissões Temáticas', type_slug: 'comissao', parent_slug: 'diretoria-estadual' },
    ],
    positions: [
      { name: 'Presidência', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 730, allows_deputy: true },
      { name: 'Vice-presidência', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 730, allows_deputy: true },
      { name: 'Secretaria Geral', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 730 },
      { name: 'Diretoria Financeira', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 730 },
      { name: 'Conselheiro Fiscal', type_slug: 'conselho', investiture_type: 'ELECTION', mandate_duration_days: 730 },
      { name: 'Representante Territorial', type_slug: 'nucleo-territorial', investiture_type: 'ELECTION', mandate_duration_days: 730 },
      { name: 'Coordenador de Comissão', type_slug: 'comissao', investiture_type: 'APPOINTMENT', mandate_duration_days: 365 },
    ],
  },
  {
    version: 1,
    slug: 'associacao-comercial',
    name: 'Associação Comercial',
    organization_profile: 'Associação empresarial com governança, núcleos setoriais e representação de associados.',
    description: 'Base para associações comerciais e empresariais. Organiza assembleia, diretoria executiva, conselho deliberativo, núcleos por setor econômico e comissões de projeto. Use os núcleos para participação setorial e as comissões para atividades com prazo; personalize os cargos conforme o estatuto e a realidade local.',
    types: [
      { slug: 'assembleia', name: 'Assembleia' },
      { slug: 'diretoria', name: 'Diretoria executiva' },
      { slug: 'conselho', name: 'Conselho deliberativo' },
      { slug: 'nucleo-setorial', name: 'Núcleo setorial' },
      { slug: 'comissao', name: 'Comissão' },
    ],
    units: [
      { slug: 'assembleia-associados', name: 'Assembleia de Associados', type_slug: 'assembleia' },
      { slug: 'diretoria-executiva', name: 'Diretoria Executiva', type_slug: 'diretoria', parent_slug: 'assembleia-associados' },
      { slug: 'conselho-deliberativo', name: 'Conselho Deliberativo', type_slug: 'conselho', parent_slug: 'assembleia-associados' },
      { slug: 'nucleos-setoriais', name: 'Núcleos Setoriais', type_slug: 'nucleo-setorial', parent_slug: 'diretoria-executiva' },
      { slug: 'comissoes-de-projeto', name: 'Comissões de Projeto', type_slug: 'comissao', parent_slug: 'diretoria-executiva' },
    ],
    positions: [
      { name: 'Presidência', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 730, allows_deputy: true },
      { name: 'Vice-presidência', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 730, allows_deputy: true },
      { name: 'Diretoria Administrativa', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 730 },
      { name: 'Diretoria Financeira', type_slug: 'diretoria', investiture_type: 'ELECTION', mandate_duration_days: 730 },
      { name: 'Conselheiro Deliberativo', type_slug: 'conselho', investiture_type: 'ELECTION', mandate_duration_days: 730 },
      { name: 'Coordenador Setorial', type_slug: 'nucleo-setorial', investiture_type: 'APPOINTMENT', mandate_duration_days: 365 },
      { name: 'Coordenador de Comissão', type_slug: 'comissao', investiture_type: 'APPOINTMENT', mandate_duration_days: 365 },
    ],
  },
];
