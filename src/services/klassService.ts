import { Department } from '@/types/divisions'
import { KlassClassification } from '@/types/klass'

export let departments: Department[] = []

// TODO: Legg til feilhåndtering
// TODO: Enhetstester
export async function getDepartmentsFromKlass() {
  try {
    // TODO: dynamically set url from env
    const response = await fetch('https://data.qa.ssb.no/api/klass/v1/versions/3009.json')
    const data = (await response.json()) as KlassClassification
    const classifications = data?.classificationItems ?? []

    for (const classification of classifications) {
      if (classification.level === '1') {
        departments.push({
          code: Number(classification.code),
          divisions: [],
          name: classification.name,
        })
      } else if (classification.level === '2') {
        // TODO: legge inn sjekk på at siste element er parent eller anta at det alltid er tilfellet?
        departments[departments.length - 1].divisions.push({
          code: Number(classification.code),
          name: classification.name,
        })
      }
    }
  } catch (error) {
    console.log(error)
  }
}
