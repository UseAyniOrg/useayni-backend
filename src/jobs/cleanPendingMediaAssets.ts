import cron from 'node-cron';
import { AppDataBase } from '../db';
import { MediaAssetService } from '../services/MediaAssetService';

cron.schedule('15 * * * *', async () => {
  if (!AppDataBase.isInitialized) return;
  const service = new MediaAssetService();
  try {
    await service.cleanupAbandonedUploads();
  } catch (error) {
    console.error('[Media cleanup] Falha ao limpar uploads abandonados.', error);
  }
});
