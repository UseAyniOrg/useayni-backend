import { AppDataBase } from '../db';

export async function expireInvitesJob() {
  await AppDataBase.query(
    `UPDATE miscellaneous_invites
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at < NOW()`,
  );
}

export async function expireRequestsJob() {
  await AppDataBase.query(
    `UPDATE miscellaneous_requests
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at < NOW()`,
  );
}

export async function closeRegistrationsByDateJob() {
  // Fechamento automático por data de término de inscrição
  // Não altera o status da miscelânea — a lógica de "inscrições abertas"
  // é resolvida via query: registration_end_date IS NULL OR registration_end_date > NOW()
  // Nada a fazer em tabela separada.
}
