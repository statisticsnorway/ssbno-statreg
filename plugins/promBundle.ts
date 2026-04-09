import promBundle from 'express-prom-bundle'

export const promBundleMetrics = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    deployment: 'ssbno-statreg',
    namespace: 'ssbno',
    team: 'ssbno',
  },
  promClient: {
    collectDefaultMetrics: {},
  },
})
