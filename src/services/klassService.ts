import { Department } from '@/types/department'
import { KlassClassification } from '@/types/klassClassification'
import process from 'node:process'

export let DEPARTMENTS: Department[]

export function getDivisionFromCode(code: number) {
  const divisions = DEPARTMENTS.map(({ divisions }) => divisions)
  return divisions.flat().filter((division) => division.code === code)
}

export async function initializeDepartments() {
  DEPARTMENTS = await getDepartmentsFromKlass()
}

export async function getDepartmentsFromKlass(): Promise<Department[]> {
  let departments: Department[] = []
  try {
    const dataBaseUrl = process.env.KLASS_BASE_URL || 'https://data.ssb.no'

    const response = await fetch(`${dataBaseUrl}/api/klass/v1/versions/3009.json`)
    const data = (await response.json()) as KlassClassification
    const classifications = data?.classificationItems ?? []
    let currentDepartment: Department | null = null

    for (const classification of classifications) {
      if (classification.level === '1') {
        currentDepartment = {
          code: Number(classification.code),
          divisions: [],
          name: classification.name,
        }
        departments.push(currentDepartment)
      } else if (classification.level === '2') {
        if (!currentDepartment || currentDepartment.code !== Number(classification.parentCode)) {
          departments = []
          throw new Error('Unexpected object structure from klass API')
        }
        currentDepartment.divisions.push({
          code: Number(classification.code),
          name: classification.name,
        })
      }
    }
  } catch (error) {
    console.error(error)
  }
  return departments
}
