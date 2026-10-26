"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireInvitesJob = expireInvitesJob;
exports.expireRequestsJob = expireRequestsJob;
exports.closeRegistrationsByDateJob = closeRegistrationsByDateJob;
const db_1 = require("../db");
async function expireInvitesJob() {
    await db_1.AppDataBase.query(`UPDATE miscellaneous_invites
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at < NOW()`);
}
async function expireRequestsJob() {
    await db_1.AppDataBase.query(`UPDATE miscellaneous_requests
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at < NOW()`);
}
async function closeRegistrationsByDateJob() {
    // Fechamento automático por data de término de inscrição
    // Não altera o status da miscelânea — a lógica de "inscrições abertas"
    // é resolvida via query: registration_end_date IS NULL OR registration_end_date > NOW()
    // Nada a fazer em tabela separada.
}
