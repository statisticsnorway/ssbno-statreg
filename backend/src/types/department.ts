import { Division } from '@ssbno-statreg/shared'

export interface Department {
  code: string
  divisions: Division[]
  name: string
  notes?: string
}
