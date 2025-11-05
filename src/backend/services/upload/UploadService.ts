import type { UUID } from '@shared/types/common.types'
import type { FileUploadRepository } from '../../repositories/upload/FileUploadRepository'
import { AppError } from '../../errors/AppError'

export interface UploadedFile {
  id: string
  userId: UUID
  filename: string
  originalName: string
  url: string
  mimeType: string
  size: number
  category: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UploadFileParams {
  userId: UUID
  file: Buffer
  filename: string
  originalName: string
  mimeType: string
  size: number
  category: string
  isPublic: boolean
}

export interface GetFileParams {
  userId: UUID
  fileId: string
}

export interface ListUserFilesParams {
  userId: UUID
  category?: string
  page: number
  limit: number
}

export interface CSVContactRow {
  name: string
  phone: string
  email?: string
  custom1?: string
  custom2?: string
  custom3?: string
}

export interface CSVParseResult {
  uploadId: string
  totalRows: number
  validRows: CSVContactRow[]
  invalidRows: Array<{ row: number; data: any; error: string }>
  duplicateRows: Array<{ row: number; phone: string }>
  errors: string[]
  preview: CSVContactRow[]
}

export interface ParseContactCSVParams {
  userId: UUID
  csvContent: string
  originalName: string
}

export interface CreateContactSegmentParams {
  userId: UUID
  uploadId: string
  name: string
  description?: string
}

export class UploadService {
  constructor(private uploadRepository: FileUploadRepository) {}

  async uploadFile(params: UploadFileParams): Promise<UploadedFile> {
    try {
      // Validate file size (100MB max)
      const maxSize = 100 * 1024 * 1024
      if (params.size > maxSize) {
        throw new AppError('File too large', 'FILE_TOO_LARGE', 400)
      }

      // Validate file type
      const allowedMimeTypes = [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        // Videos
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
        // Audio
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        // Documents
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ]

      if (!allowedMimeTypes.includes(params.mimeType)) {
        throw new AppError('File type not allowed', 'FILE_TYPE_NOT_ALLOWED', 400)
      }

      // Store file (this would integrate with cloud storage like S3, Supabase Storage, etc.)
      const fileUrl = await this.storeFile(params)

      // Save file metadata to database
      const uploadedFile = await this.uploadRepository.create({
        userId: params.userId,
        filename: params.filename,
        originalName: params.originalName,
        url: fileUrl,
        mimeType: params.mimeType,
        size: params.size,
        category: params.category,
        isPublic: params.isPublic,
      })

      return uploadedFile
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to upload file', 'UPLOAD_FAILED', 500)
    }
  }

  async getFile(params: GetFileParams): Promise<UploadedFile | null> {
    try {
      const file = await this.uploadRepository.findById(params.fileId)

      if (!file) {
        return null
      }

      // Check if user owns the file or it's public
      if (file.userId !== params.userId && !file.isPublic) {
        throw new AppError('Access denied', 'ACCESS_DENIED', 403)
      }

      return file
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to get file', 'GET_FILE_FAILED', 500)
    }
  }

  async listUserFiles(params: ListUserFilesParams): Promise<{
    files: UploadedFile[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const result = await this.uploadRepository.findByUserId({
        userId: params.userId,
        category: params.category,
        page: params.page,
        limit: params.limit,
      })

      return result
    } catch (error) {
      throw new AppError('Failed to list files', 'LIST_FILES_FAILED', 500)
    }
  }

  async deleteFile(params: GetFileParams): Promise<void> {
    try {
      const file = await this.uploadRepository.findById(params.fileId)

      if (!file) {
        throw new AppError('File not found', 'FILE_NOT_FOUND', 404)
      }

      // Check if user owns the file
      if (file.userId !== params.userId) {
        throw new AppError('Access denied', 'ACCESS_DENIED', 403)
      }

      // Delete from storage
      await this.deleteFileFromStorage(file.url)

      // Delete from database
      await this.uploadRepository.delete(params.fileId)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to delete file', 'DELETE_FILE_FAILED', 500)
    }
  }

  async parseContactCSV(params: ParseContactCSVParams): Promise<CSVParseResult> {
    try {
      const uploadId = `csv_upload_${Date.now()}_${Math.random().toString(36).substring(2)}`

      // Parse CSV content
      const lines = params.csvContent.split(/\r?\n/).filter(line => line.trim())

      if (lines.length < 2) {
        throw new AppError('CSV must have header and at least one data row', 'INVALID_CSV', 400)
      }

      // Extract headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
      const requiredColumns = ['name', 'phone']
      const missingColumns = requiredColumns.filter(col => !headers.includes(col))

      if (missingColumns.length > 0) {
        throw new AppError(
          `Missing required columns: ${missingColumns.join(', ')}`,
          'MISSING_COLUMNS',
          400
        )
      }

      // Parse data rows
      const validRows: CSVContactRow[] = []
      const invalidRows: Array<{ row: number; data: any; error: string }> = []
      const duplicateRows: Array<{ row: number; phone: string }> = []
      const seenPhones = new Set<string>()
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i])
          const contact: Partial<CSVContactRow> = {}

          headers.forEach((header, index) => {
            const value = values[index] || ''
            if (header === 'name') contact.name = value.trim()
            if (header === 'phone') contact.phone = value.trim()
            if (header === 'email') contact.email = value.trim()
            if (header === 'custom1') contact.custom1 = value.trim()
            if (header === 'custom2') contact.custom2 = value.trim()
            if (header === 'custom3') contact.custom3 = value.trim()
          })

          // Validate required fields
          if (!contact.name?.trim()) {
            invalidRows.push({ row: i + 1, data: contact, error: 'Name is required' })
            continue
          }

          if (!contact.phone?.trim()) {
            invalidRows.push({ row: i + 1, data: contact, error: 'Phone is required' })
            continue
          }

          // Validate phone format (basic validation)
          const cleanPhone = contact.phone.replace(/\D/g, '')
          if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            invalidRows.push({ row: i + 1, data: contact, error: 'Invalid phone format' })
            continue
          }

          // Check for duplicates
          if (seenPhones.has(cleanPhone)) {
            duplicateRows.push({ row: i + 1, phone: contact.phone })
            continue
          }
          seenPhones.add(cleanPhone)

          // Validate email if present
          if (contact.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(contact.email)) {
              invalidRows.push({ row: i + 1, data: contact, error: 'Invalid email format' })
              continue
            }
          }

          validRows.push({
            name: contact.name!,
            phone: contact.phone!,
            email: contact.email,
            custom1: contact.custom1,
            custom2: contact.custom2,
            custom3: contact.custom3,
          })
        } catch (error) {
          invalidRows.push({
            row: i + 1,
            data: null,
            error: 'Failed to parse row'
          })
        }
      }

      // Store upload session for potential confirmation
      await this.storeUploadSession({
        uploadId,
        userId: params.userId,
        originalName: params.originalName,
        validRows,
        invalidRows,
        duplicateRows,
      })

      return {
        uploadId,
        totalRows: lines.length - 1,
        validRows,
        invalidRows,
        duplicateRows,
        errors,
        preview: validRows.slice(0, 5), // First 5 valid contacts
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('Failed to parse CSV', 'CSV_PARSE_FAILED', 500)
    }
  }

  // Private helper methods
  private async storeFile(params: UploadFileParams): Promise<string> {
    // This would integrate with cloud storage (S3, Supabase Storage, etc.)
    // For now, return a mock URL
    return `https://storage.example.com/uploads/${params.filename}`
  }

  private async deleteFileFromStorage(url: string): Promise<void> {
    // This would delete the file from cloud storage
    // Implementation depends on storage provider
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = []
    let currentValue = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          currentValue += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }

    // Add the last value
    values.push(currentValue.trim())

    return values
  }

  private async storeUploadSession(session: {
    uploadId: string
    userId: UUID
    originalName: string
    validRows: CSVContactRow[]
    invalidRows: Array<{ row: number; data: any; error: string }>
    duplicateRows: Array<{ row: number; phone: string }>
  }): Promise<void> {
    // This would store the upload session in Redis or database
    // Implementation would depend on the chosen storage solution
  }
}