import { Department } from '@/types/department'
import { KlassClassification } from '@/types/klassClassification'
import process from 'node:process'

export let DEPARTMENTS_NB: Department[] = []
export let DEPARTMENTS_EN: Department[] = []

export function setDepartmentsNb(departments: Department[]) {
  DEPARTMENTS_NB = departments
}

export function setDepartmentsEn(departments: Department[]) {
  DEPARTMENTS_EN = departments
}

export function getDivisionFromCode(code: number, language?: string) {
  const departments = language === 'en' ? DEPARTMENTS_EN : DEPARTMENTS_NB
  return departments.flatMap(({ divisions }) => divisions).find((division) => division.code === code)
}

export async function initializeDepartments() {
  setDepartmentsNb(await getDepartmentsFromKlass())
  setDepartmentsEn(await getDepartmentsFromKlass('en'))
}

export async function getDepartmentsFromKlass(language = 'nb'): Promise<Department[]> {
  let departments: Department[] = []
  try {
    const dataBaseUrl = process.env.KLASS_BASE_URL || 'https://data.ssb.no'

    const response = await fetch(`${dataBaseUrl}/api/klass/v1/versions/3009.json?language=${language}`)
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
