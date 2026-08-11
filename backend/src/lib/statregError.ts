export class StatregError extends Error {
  readonly status: number
  readonly statregError: string

  constructor(statregError: string, status = 400) {
    super(statregError)
    this.name = 'StatregError'
    this.status = status
    this.statregError = statregError
  }
}
