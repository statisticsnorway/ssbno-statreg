import pool from '../../prisma/db';
import { Statistikk } from '../types/types';

export async function getAllStatistics(): Promise<Statistikk[]> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        s.id,
        s.version,
        s.kortnavn_id,
        s.dir_flyt,
        s.triggerord,
        s.prioritet,
        s.desk_flyt,
        s.sprak,
        s.triggerord_en,
        s.eierseksjon_id,
        s.forstegangspublisering,
        s.arsrapportering,
        s.status,
        s.gamle_emnekoder,
        s.relasjon_id,
        s.statistikknavn,
        s.last_updated,
        s.intern_kommentar,
        s.statistikknavn_en,
        s.date_created
      FROM statreg_data."STATISTIKK" s
      ORDER BY s.id;
    `;

    const result = await client.query<Statistikk>(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  } finally {
    client.release();
  }
}
