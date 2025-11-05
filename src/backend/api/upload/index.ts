import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import { createAuthGuard } from '../../middleware/authGuard'
import { uploadLimiter } from '../../middleware/rateLimit'
import type { ApiServices } from '../types'
import { respondError, respondSuccess, respondValidationError } from '../utils/responses'

// Configure multer for file uploads
const storage = multer.memoryStorage()

// File filter to validate file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true)
  }
  // Accept videos
  if (file.mimetype.startsWith('video/')) {
    return cb(null, true)
  }
  // Accept audio
  if (file.mimetype.startsWith('audio/')) {
    return cb(null, true)
  }
  // Accept documents
  const allowedDocuments = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
  ]
  if (allowedDocuments.includes(file.mimetype)) {
    return cb(null, true)
  }

  cb(new Error('Tipo de arquivo não permitido'))
}

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 1, // Only one file at a time for now
  },
})

// Validation schemas
const uploadSchema = z.object({
  category: z.string().optional(), // 'campaign_media', 'course_cover', 'resource', 'avatar', etc.
  isPublic: z.coerce.boolean().optional(),
})

export function createUploadRouter(services: ApiServices) {
  const router = Router()
  const authGuard = createAuthGuard(services.tokenService)

  // Upload file endpoint
  router.post('/file', authGuard, uploadLimiter, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return respondError(res, 400, { code: 'NO_FILE', message: 'Nenhum arquivo enviado' })
      }

      const parsedBody = uploadSchema.safeParse(req.body)
      if (!parsedBody.success) {
        return respondValidationError(res, 'Dados inválidos', parsedBody.error.flatten())
      }

      // Generate unique filename
      const fileExt = path.extname(req.file.originalname)
      const uniqueFilename = `${req.user!.userId}_${Date.now()}_${Math.random().toString(36).substring(2)}${fileExt}`

      // Upload to storage service (this would need to be implemented)
      const uploadResult = await services.uploadService.uploadFile({
        userId: req.user!.userId,
        file: req.file.buffer,
        filename: uniqueFilename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category: parsedBody.data.category || 'general',
        isPublic: parsedBody.data.isPublic ?? false,
      })

      return respondSuccess(res, 201, {
        id: uploadResult.id,
        url: uploadResult.url,
        filename: uploadResult.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        category: uploadResult.category,
        isPublic: uploadResult.isPublic,
        uploadedAt: uploadResult.createdAt,
      })
    } catch (err) {
      return next(err)
    }
  })

  // Upload CSV for contact import
  router.post('/csv-contacts', authGuard, uploadLimiter, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return respondError(res, 400, { code: 'NO_FILE', message: 'Nenhum arquivo CSV enviado' })
      }

      if (!req.file.originalname.endsWith('.csv') && req.file.mimetype !== 'text/csv') {
        return respondError(res, 400, { code: 'INVALID_FORMAT', message: 'Apenas arquivos CSV são permitidos' })
      }

      // Parse CSV content (this would need to be implemented in the service)
      const csvContent = req.file.buffer.toString('utf-8')
      const parseResult = await services.hidraService.parseContactCSV({
        userId: req.user!.userId,
        csvContent,
        originalName: req.file.originalname,
      })

      return respondSuccess(res, 200, {
        uploadId: parseResult.uploadId,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        duplicateRows: parseResult.duplicateRows,
        errors: parseResult.errors,
        preview: parseResult.preview, // First 5 valid contacts for preview
      })
    } catch (err) {
      return next(err)
    }
  })

  // Create contact segment from CSV
  router.post('/csv-contacts/confirm', authGuard, uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const confirmSchema = z.object({
        uploadId: z.string(),
        segmentName: z.string().min(3).max(100),
        segmentDescription: z.string().max(500).optional(),
      })

      const parsed = confirmSchema.safeParse(req.body)
      if (!parsed.success) {
        return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
      }

      const segment = await services.hidraService.createContactSegmentFromCSV({
        userId: req.user!.userId,
        uploadId: parsed.data.uploadId,
        name: parsed.data.segmentName,
        description: parsed.data.segmentDescription,
      })

      return respondSuccess(res, 201, segment)
    } catch (err) {
      return next(err)
    }
  })

  // Get uploaded file info
  router.get('/file/:id', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.id
      const file = await services.uploadService.getFile({
        userId: req.user!.userId,
        fileId,
      })

      if (!file) {
        return respondError(res, 404, { code: 'NOT_FOUND', message: 'Arquivo não encontrado' })
      }

      return respondSuccess(res, 200, file)
    } catch (err) {
      return next(err)
    }
  })

  // List user uploads
  router.get('/files', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listSchema = z.object({
        category: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      })

      const parsed = listSchema.safeParse(req.query)
      if (!parsed.success) {
        return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
      }

      const result = await services.uploadService.listUserFiles({
        userId: req.user!.userId,
        category: parsed.data.category,
        page: parsed.data.page,
        limit: parsed.data.limit,
      })

      return respondSuccess(res, 200, result)
    } catch (err) {
      return next(err)
    }
  })

  // Delete uploaded file
  router.delete('/file/:id', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.id
      await services.uploadService.deleteFile({
        userId: req.user!.userId,
        fileId,
      })

      return respondSuccess(res, 204, null)
    } catch (err) {
      return next(err)
    }
  })

  return router
}