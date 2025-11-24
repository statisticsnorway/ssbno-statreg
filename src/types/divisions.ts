export interface Division {
  code: number
  name: string
  notes?: string
}

export interface Department {
  code: number
  divisions: Division[]
  name: string
  notes?: string
}
