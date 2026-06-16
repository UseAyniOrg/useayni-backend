import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MiscellaneousRepository } from '../repositories/MiscellaneousRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { CreateMiscellaneousDto } from '../dto/miscellaneous/create-miscellaneous.dto';
import { InvitationResponse } from '../dto/miscellaneous/respond-invitation.dto';
import { JWTPayload } from '../helpers/tokenHelper';
import { Miscellaneous } from '../models/miscellaneous';
import {
  MiscellaneousNotification,
  MiscellaneousNotificationType,
} from '../models/miscellaneousNotification';
import {
  MiscellaneousMemberStatus,
  MiscellaneousScope,
  MiscellaneousStatus,
  MiscellaneousType,
} from '../helpers/miscellaneous.enums';
import {
  childScopeWithinParent,
  getCreatorLevel,
  isNestingAllowed,
  scopeExceedsCreatorLevel,
} from '../helpers/miscellaneousRules';

@Injectable()
export class MiscellaneousService {
  constructor(
    private readonly miscellaneousRepository: MiscellaneousRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  async create(dto: CreateMiscellaneousDto, user: JWTPayload) {
    // --- Validação de campos comuns por tipo ---
    this.validateDates(dto);

    // --- Validação de aninhamento (RN-004, RN-005, RN-006) ---
    let parent: Miscellaneous | null = null;
    if (dto.parentId) {
      parent = await this.miscellaneousRepository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('Miscelânea pai não encontrada');
      }

      if (!isNestingAllowed(parent.type, dto.type)) {
        throw new BadRequestException(
          `O tipo "${dto.type}" não pode ser aninhado em "${parent.type}"`,
        );
      }

      if (!childScopeWithinParent(dto.scope, parent.scope)) {
        throw new BadRequestException(
          'O escopo do filho não pode ser mais amplo que o do pai (RN-004)',
        );
      }
    }

    // --- Validação da seleção individual (RN-003) ---
    if (
      dto.scope === MiscellaneousScope.SELECAO_INDIVIDUAL &&
      (!dto.memberIds || dto.memberIds.length === 0)
    ) {
      throw new BadRequestException(
        'Seleção individual exige ao menos um membro convidado',
      );
    }

    // --- Validação de existência de donos e membros ---
    const extraOwnerIds = dto.ownerIds ?? [];
    const memberIds = dto.memberIds ?? [];
    await this.assertMembersExist([...extraOwnerIds, ...memberIds]);

    // RN-001: o criador é sempre dono (principal).
    const ownerIds = [user.id, ...extraOwnerIds];

    // --- Determinação automática do status ---
    const status = this.determineStatus(dto, user);

    // --- Montagem das notificações ---
    const notifications = await this.buildNotifications(dto, user, status, memberIds);

    const created = await this.miscellaneousRepository.createWithRelations({
      miscellaneous: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        visibility: dto.visibility,
        scope: dto.scope,
        status,
        cep: dto.cep ?? null,
        bairro: dto.bairro ?? null,
        rua: dto.rua ?? null,
        numero: dto.numero ?? null,
        cidade: dto.cidade ?? null,
        estado: dto.estado ?? null,
        cover_photo_url: dto.cover_photo_url ?? null,
        banner_url: dto.banner_url ?? null,
        parent_id: dto.parentId ?? null,
        creator_id: user.id,
      },
      ownerIds,
      memberIds,
      notifications,
    });

    return this.miscellaneousRepository.findById(created.id);
  }

  /** end_date é obrigatório para todos os tipos, exceto Meta. */
  private validateDates(dto: CreateMiscellaneousDto) {
    if (dto.type !== MiscellaneousType.META && !dto.end_date) {
      throw new BadRequestException(
        `Data de término é obrigatória para o tipo "${dto.type}"`,
      );
    }

    if (dto.end_date && new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException(
        'Data de término não pode ser anterior à data de início',
      );
    }
  }

  private async assertMembersExist(memberIds: string[]) {
    const uniqueIds = Array.from(new Set(memberIds));
    for (const id of uniqueIds) {
      const member = await this.memberRepository.findById(id);
      if (!member) {
        throw new BadRequestException(`Membro não encontrado: ${id}`);
      }
    }
  }

  /**
   * Determina o status com base no escopo e no nível do criador.
   * - isDraft → rascunho
   * - seleção individual → ativa (RN-003, apenas aceite dos convidados)
   * - escopo maior que o nível do criador → pendente_aprovacao (RN-002)
   * - caso contrário → ativa
   */
  private determineStatus(
    dto: CreateMiscellaneousDto,
    user: JWTPayload,
  ): MiscellaneousStatus {
    if (dto.isDraft) {
      return MiscellaneousStatus.RASCUNHO;
    }

    if (dto.scope === MiscellaneousScope.SELECAO_INDIVIDUAL) {
      return MiscellaneousStatus.ATIVA;
    }

    const creatorLevel = getCreatorLevel(user.positions, user.roles);
    if (scopeExceedsCreatorLevel(dto.scope, creatorLevel)) {
      return MiscellaneousStatus.PENDENTE_APROVACAO;
    }

    return MiscellaneousStatus.ATIVA;
  }

  private async buildNotifications(
    dto: CreateMiscellaneousDto,
    user: JWTPayload,
    status: MiscellaneousStatus,
    memberIds: string[],
  ): Promise<Partial<MiscellaneousNotification>[]> {
    const notifications: Partial<MiscellaneousNotification>[] = [];

    // RN-002: notificar gestores quando pendente de aprovação.
    if (status === MiscellaneousStatus.PENDENTE_APROVACAO) {
      const managerIds = await this.miscellaneousRepository.findManagerIdsForScope(
        dto.scope,
      );
      for (const managerId of managerIds) {
        if (managerId === user.id) continue;
        notifications.push({
          recipient_id: managerId,
          type: MiscellaneousNotificationType.APROVACAO,
          message: `Nova miscelânea "${dto.title}" aguarda sua aprovação.`,
        });
      }
    }

    // RN-003: convidar membros na seleção individual.
    if (dto.scope === MiscellaneousScope.SELECAO_INDIVIDUAL) {
      for (const memberId of memberIds) {
        notifications.push({
          recipient_id: memberId,
          type: MiscellaneousNotificationType.CONVITE,
          message: `Você foi convidado para a miscelânea "${dto.title}".`,
        });
      }
    }

    // Confirmação ao criador.
    notifications.push({
      recipient_id: user.id,
      type: MiscellaneousNotificationType.CONFIRMACAO,
      message:
        status === MiscellaneousStatus.PENDENTE_APROVACAO
          ? `Sua miscelânea "${dto.title}" foi enviada para aprovação.`
          : `Sua miscelânea "${dto.title}" foi criada com sucesso.`,
    });

    return notifications;
  }

  async findById(id: string) {
    const misc = await this.miscellaneousRepository.findById(id);
    if (!misc) throw new NotFoundException('Miscelânea não encontrada');
    return misc;
  }

  /** Listagem pública: só aparece após status ativa. */
  async findPublicActive() {
    return this.miscellaneousRepository.findPublicActive();
  }

  /**
   * Aprovação por um gestor do nível (RN-002): muda de pendente_aprovacao
   * para ativa e notifica o criador.
   */
  async approve(id: string, user: JWTPayload) {
    const misc = await this.findById(id);

    if (misc.status !== MiscellaneousStatus.PENDENTE_APROVACAO) {
      throw new BadRequestException(
        'Somente miscelâneas pendentes de aprovação podem ser aprovadas',
      );
    }

    const managerIds = await this.miscellaneousRepository.findManagerIdsForScope(
      misc.scope,
    );
    const isManager = managerIds.includes(user.id);
    const isTechTeam = user.roles?.includes('EQUIPE_TECNICA');
    if (!isManager && !isTechTeam) {
      throw new ForbiddenException(
        'Você não tem permissão para aprovar esta miscelânea',
      );
    }

    const updated = await this.miscellaneousRepository.updateStatus(
      id,
      MiscellaneousStatus.ATIVA,
    );

    await this.miscellaneousRepository.saveNotification({
      recipient_id: misc.creator_id,
      miscellaneous_id: id,
      type: MiscellaneousNotificationType.CONFIRMACAO,
      message: `Sua miscelânea "${misc.title}" foi aprovada e está ativa.`,
    });

    return updated;
  }

  /** Aceite/recusa de convite na seleção individual (RN-003). */
  async respondInvitation(
    id: string,
    user: JWTPayload,
    response: InvitationResponse,
  ) {
    const invitation = await this.miscellaneousRepository.findInvitation(
      id,
      user.id,
    );
    if (!invitation) {
      throw new NotFoundException('Convite não encontrado para este membro');
    }

    invitation.status =
      response === InvitationResponse.ACEITAR
        ? MiscellaneousMemberStatus.ACEITO
        : MiscellaneousMemberStatus.RECUSADO;

    return this.miscellaneousRepository.saveInvitation(invitation);
  }
}
