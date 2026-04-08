import { AppDataBase } from '../db';

async function seedCaes() {
  await AppDataBase.initialize();

  try {
    // Buscar estados
    const states = await AppDataBase.query('SELECT id, name, uf FROM states');

    // Criar CAEs para cada estado
    for (const state of states) {
      const caeName = `CAE ${state.name}`;
      
      // Verificar se já existe
      const existing = await AppDataBase.query(
        'SELECT id FROM caes WHERE name = $1',
        [caeName]
      );

      if (existing.length === 0) {
        await AppDataBase.query(
          'INSERT INTO caes (name, state_id) VALUES ($1, $2)',
          [caeName, state.id]
        );
        console.log(`✓ CAE criada: ${caeName}`);
      } else {
        console.log(`- CAE já existe: ${caeName}`);
      }
    }

    console.log('\n✅ Seed de CAEs concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao popular CAEs:', error);
  } finally {
    await AppDataBase.destroy();
  }
}

seedCaes();
