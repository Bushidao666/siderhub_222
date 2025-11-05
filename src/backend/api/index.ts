import { Router, type Request, type Response, type NextFunction } from 'express'
import { randomUUID } from 'crypto'
import { createAuthRouter } from './auth'
import { createUploadRouter } from './upload'
import { createHidraRouter } from './hidra'
import { createAcademyRouter } from './academy'
import { createCybervaultRouter } from './cybervault'
import { createAdminRouter } from './admin'
import { createHubRouter } from './hub'
import type { ApiServices } from './types'
import { errorHandler } from '../middleware/errorHandler'

export function createApiRouter(services: ApiServices) {
  const router = Router()

  // requestId middleware
  router.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.requestId = (req.get('x-request-id') as string | undefined) || randomUUID()
    next()
  })

  // Mount routers
  router.use('/auth', createAuthRouter(services))
  router.use('/hidra', createHidraRouter(services))
  router.use('/academy', createAcademyRouter(services))
  router.use('/cybervault', createCybervaultRouter(services))
  router.use('/admin', createAdminRouter(services))
  router.use('/hub', createHubRouter(services))

  router.use(errorHandler())

  return router
}
