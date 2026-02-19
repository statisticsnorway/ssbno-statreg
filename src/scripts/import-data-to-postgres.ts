import { prisma } from '../lib/prisma'
import fs from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { parser } from 'stream-json'
import { streamArray } from 'stream-json/streamers/StreamArray'

const BATCH_SIZE = 1000

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: npm tsx scripts/import-data.ts <file.json>')
    process.exit(1)
  }

  const batch: any[] = []

  await pipeline(fs.createReadStream(file), parser(), streamArray(), async function (source) {
    for await (const { value } of source) {
      // TODO: add mapping
      batch.push(value)

      if (batch.length >= BATCH_SIZE) {
        await prisma.myTable.createMany({
          data: batch,
          skipDuplicates: true,
        })
        console.log(`Inserted ${batch.length}`)
        batch.length = 0
      }
    }
  })

  // final batch
  if (batch.length > 0) {
    await prisma.myTable.createMany({ data: batch, skipDuplicates: true })
    console.log(`Inserted final ${batch.length}`)
  }

  console.log('Import finished.')
}

main().finally(() => prisma.$disconnect())
