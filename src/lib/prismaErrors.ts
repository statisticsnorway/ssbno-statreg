import { Prisma } from '@/generated/prisma/client'

// Please refer to https://www.prisma.io/docs/orm/reference/error-reference#error-codes for error codes in Prisma

export function checkForKnownPrismaErrors(err: Error): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return 'Prisma unique constraint error: ' + getLastLineFromErrorMessage(err.message)
    }
    return getLastLineFromErrorMessage(err.message)
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return 'Unknown Prisma error: ' + getLastLineFromErrorMessage(err.message)
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    return 'Prisma validation error: ' + getLastLineFromErrorMessage(err.message)
  }
  return ''
}

export function getLastLineFromErrorMessage(message: string): string {
  const lastLinebreakIndex = message.lastIndexOf('\n')
  return message.slice(lastLinebreakIndex + 1)
}
