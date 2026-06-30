// Run script in terminal with the following command:
// npx tsx ./src/scripts/addPrincipalToExistingContacts.ts

import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Fetching responsiblePerson and updating principalName field')

  const rows = await prisma.responsiblePerson.findMany({})

  rows.forEach(async (row) => {
    const principalName = row.username ? row.username + '@ssb.no' : row.email
    await prisma.responsiblePerson.update({
      where: {
        id: row.id,
      },
      data: {
        principalName,
      },
    })
  })
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
