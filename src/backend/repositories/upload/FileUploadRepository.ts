import type { PrismaClient } from '@prisma/client'
import type { UUID } from '@shared/types/common.types'
import type { UploadedFile } from '../../services/upload/UploadService'

// Note: This assumes there's a FileUpload model in the Prisma schema
// If it doesn't exist, it would need to be added to the schema

export interface CreateFileInput {
  userId: UUID
  filename: string
  originalName: string
  url: string
  mimeType: string
  size: number
  category: string
  isPublic: boolean
}

export interface FindByUserIdParams {
  userId: UUID
  category?: string
  page: number
  limit: number
}

export interface ListResult {
  files: UploadedFile[]
  total: number
  page: number
  limit: number
}

export interface FileUploadRepository {
  create(input: CreateFileInput): Promise<UploadedFile>
  findById(fileId: string): Promise<UploadedFile | null>
  findByUserId(params: FindByUserIdParams): Promise<ListResult>
  delete(fileId: string): Promise<void>
  update(fileId: string, data: Partial<CreateFileInput>): Promise<UploadedFile>
}

export class PrismaFileUploadRepository implements FileUploadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateFileInput): Promise<UploadedFile> {
    const file = await this.prisma.fileUpload.create({
      data: {
        userId: input.userId,
        filename: input.filename,
        originalName: input.originalName,
        url: input.url,
        mimeType: input.mimeType,
        size: input.size,
        category: input.category,
        isPublic: input.isPublic,
      },
    })

    return this.mapPrismaToFile(file)
  }

  async findById(fileId: string): Promise<UploadedFile | null> {
    const file = await this.prisma.fileUpload.findUnique({
      where: { id: fileId },
    })

    return file ? this.mapPrismaToFile(file) : null
  }

  async findByUserId(params: FindByUserIdParams): Promise<ListResult> {
    const where: Record<string, unknown> = {
      userId: params.userId,
    }

    if (params.category) {
      where.category = params.category
    }

    const skip = (params.page - 1) * params.limit

    const [files, total] = await Promise.all([
      this.prisma.fileUpload.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fileUpload.count({ where }),
    ])

    return {
      files: files.map(this.mapPrismaToFile),
      total,
      page: params.page,
      limit: params.limit,
    }
  }

  async delete(fileId: string): Promise<void> {
    await this.prisma.fileUpload.delete({
      where: { id: fileId },
    })
  }

  async update(fileId: string, data: Partial<CreateFileInput>): Promise<UploadedFile> {
    const file = await this.prisma.fileUpload.update({
      where: { id: fileId },
      data: {
        ...(data.category && { category: data.category }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.originalName && { originalName: data.originalName }),
      },
    })

    return this.mapPrismaToFile(file)
  }

  private mapPrismaToFile(file: any): UploadedFile {
    return {
      id: file.id,
      userId: file.userId,
      filename: file.filename,
      originalName: file.originalName,
      url: file.url,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      isPublic: file.isPublic,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }
  }
}