// Run script in terminal with the following command:
// npx tsx ./src/scripts/addResponsiblePersonFromOldContact.ts

import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Fetching statistic_contacts with related contact and statistic...')

  const rows = await prisma.statistic_contacts.findMany({
    include: {
      contact: true,
      statistic: true,
    },
  })

  console.log(`Found ${rows.length} contact relations\n`)

  let upsertedLinks = 0

  for (const row of rows) {
    const contact = row.contact
    const statistic = row.statistic

    let email = contact.email

    if (!email) {
      if (contact.initials) {
        email = `${contact.initials}@ssb.no`
        console.log('email derived from username: ' + contact.initials)
      } else {
        console.log(`Contact ${contact.id} has neither email or initials - cannot create ResponsiblePerson. Skipped.`)
        continue
      }
    }

    // Upsert responsible person by unique email
    const responsible = await prisma.responsiblePerson.upsert({
      where: { email: contact.email },
      update: {},
      create: {
        email: contact.email,
        username: contact.initials ?? null,
      },
    })

    await prisma.responsiblePerson.update({
      where: { id: responsible.id },
      data: {
        statistics: {
          connect: { id: statistic.id },
        },
      },
    })

    upsertedLinks++
  }

  console.log(`Done.`)
  console.log(`New statistic links created: ${upsertedLinks}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
