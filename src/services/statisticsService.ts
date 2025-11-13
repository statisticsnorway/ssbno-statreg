import pool from '../../schema/db'
import type { Statistikk } from '../types/types'

export async function getAllStatistics(): Promise<Statistikk[]> {
  const query = `
    SELECT *
    FROM statreg_data."STATISTIKK"
    ORDER BY id;
  `
  try {
    const { rows } = await pool.query<Statistikk>(query)
    return rows
  } catch (err) {
    console.error('Error fetching statistics:', err)
    throw err
  }
}
