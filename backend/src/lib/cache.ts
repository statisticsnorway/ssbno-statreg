import { NodeCache } from '@cacheable/node-cache'

const timeCache = new NodeCache({ stdTTL: 20, checkperiod: 5 })

function resetTimeCache(): Date {
  const currentTime = new Date()

  timeCache.set('time', currentTime)

  return currentTime
}

export function getTimeCache(): Date {
  const cachedTime: Date | undefined = timeCache.get('time') as Date | undefined
  return cachedTime ?? resetTimeCache()
}
