import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod'
import { ZodError } from 'zod'

export class ApiError extends Error {
  statusCode: number
  error: string

  constructor(statusCode: number, error: string, message: string) {
    super(message)
    this.name = error
    this.statusCode = statusCode
    this.error = error
  }
}

export function errorHandler(
  error: FastifyError | ApiError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ApiError) {
    return reply
      .status(error.statusCode)
      .send({ error: error.error, message: error.message, statusCode: error.statusCode })
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    const message = error.validation
      .map((v) => {
        const issue = v.params?.issue
        const path = issue?.path?.join('.') || 'campo'
        return `${path}: ${issue?.message ?? v.message}`
      })
      .join('; ')
    return reply.status(400).send({ error: 'Bad Request', message, statusCode: 400 })
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return reply.status(400).send({ error: 'Bad Request', message, statusCode: 400 })
  }

  if (isResponseSerializationError(error)) {
    request.log.error(error)
    return reply
      .status(500)
      .send({
        error: 'Internal Server Error',
        message: 'Erro ao serializar resposta',
        statusCode: 500,
      })
  }

  const statusCode = error.statusCode ?? 500
  if (statusCode >= 500) request.log.error(error)
  return reply.status(statusCode).send({
    error: error.name ?? 'Internal Server Error',
    message: statusCode >= 500 ? 'Erro interno do servidor' : error.message,
    statusCode,
  })
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(404).send({
    error: 'Not Found',
    message: `Rota ${request.method} ${request.url} não encontrada`,
    statusCode: 404,
  })
}
