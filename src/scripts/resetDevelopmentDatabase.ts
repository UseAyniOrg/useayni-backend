import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataBase } from '../db';

const adminEmail = (process.env.SUPERADMIN_EMAIL || 'leonardopaniz@outlook.com').trim().toLowerCase();
const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;

function validateTarget(): { host: string; database: string } {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Reset bloqueado: NODE_ENV precisa ser development.');
  }
  if (!databaseUrl) throw new Error('DATABASE_URL não configurada.');

  const target = new URL(databaseUrl);
  const database = target.pathname.replace(/^\//, '');
  if (!target.hostname.endsWith('.neon.tech') || database !== 'neondb') {
    throw new Error('Reset bloqueado: o alvo precisa ser o banco neondb em um host Neon.');
  }
  if (process.env.CONFIRM_RESET_DATABASE !== database) {
    throw new Error('Defina CONFIRM_RESET_DATABASE=neondb para confirmar o alvo.');
  }
  return { host: target.hostname, database };
}

async function main() {
  const target = validateTarget();
  const password = process.env.INITIAL_SUPERADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('INITIAL_SUPERADMIN_PASSWORD precisa ter ao menos 12 caracteres.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await AppDataBase.initialize();
  console.log(`Alvo validado: ${target.host} / ${target.database}`);

  await AppDataBase.query('DROP SCHEMA public CASCADE');
  await AppDataBase.query('CREATE SCHEMA public');
  await AppDataBase.query('GRANT ALL ON SCHEMA public TO public');
  const migrations = await AppDataBase.runMigrations({ transaction: 'all' });
  const account = await AppDataBase.transaction(async (manager) => {
    await manager.query(
      `INSERT INTO roles (name, description)
       VALUES ('EQUIPE_TECNICA', 'Super administrador da plataforma')
       ON CONFLICT (name) DO NOTHING`,
    );

    const [created] = await manager.query(
      `INSERT INTO user_accounts (email, password)
       VALUES ($1, $2)
       ON CONFLICT (lower(email)) DO UPDATE
         SET password = EXCLUDED.password, updated_at = now()
       RETURNING id`,
      [adminEmail, passwordHash],
    ) as { id: string }[];

    await manager.query(`DELETE FROM user_account_roles WHERE role_name = 'EQUIPE_TECNICA'`);
    await manager.query(`DELETE FROM user_accounts WHERE id <> $1`, [created.id]);
    await manager.query(
      `INSERT INTO user_account_roles (account_id, role_name)
       VALUES ($1, 'EQUIPE_TECNICA')
       ON CONFLICT DO NOTHING`,
      [created.id],
    );
    return created;
  });

  const [{ total: organizationCount }] = await AppDataBase.query(
    `SELECT COUNT(*)::int AS total FROM organizations`,
  ) as { total: number }[];
  console.log(`Migrações aplicadas: ${migrations.length}`);
  console.log(`Organizações: ${organizationCount}; superadmins: 1 (${adminEmail})`);
  console.log(`Conta global criada/atualizada: ${account.id}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha ao reconstruir o banco.');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataBase.isInitialized) await AppDataBase.destroy();
  });