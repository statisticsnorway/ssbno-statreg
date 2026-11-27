import path from 'node:path'
import { Writable } from 'node:stream'

const BATCH_SIZE = 1000

export function createImportBatchWriter<T>(
  filePath: string,
  pushBatch: (batch: T[]) => Promise<unknown>,
  mapFn: (raw: Record<string, unknown>) => T
) {
  const batch: T[] = []
  let count = 0

  async function flushBatch(isFinal = false) {
    if (batch.length === 0) return

    await pushBatch(batch)
    console.log(`Inserted ${isFinal ? 'final ' : ''}${batch.length} from ${path.basename(filePath)} (total: ${count})`)
    batch.length = 0
  }

  async function writeRow(value: Record<string, unknown>) {
    batch.push(mapFn(value))
    count++
    if (batch.length >= BATCH_SIZE) await flushBatch()
  }

  return new Writable({
    objectMode: true,
    write(value: Record<string, unknown>, _encoding, callback) {
      writeRow(value).then(() => callback(), callback)
    },
    final(callback) {
      flushBatch(true).then(() => callback(), callback)
    },
  })
}
