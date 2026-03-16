import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { ApiError, apiHandler } from '@/lib/api-errors'

// GET - 获取用户自定义风格列表
export const GET = apiHandler(async () => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const styles = await prisma.userCustomStyle.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ styles })
})

// POST - 创建自定义风格
export const POST = apiHandler(async (request: NextRequest) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  const preview = typeof body.preview === 'string' ? body.preview.trim().slice(0, 2) : 'S'

  if (!name) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MISSING_FIELD',
      field: 'name',
      message: 'name is required',
    })
  }
  if (!prompt) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MISSING_FIELD',
      field: 'prompt',
      message: 'prompt is required',
    })
  }

  const style = await prisma.userCustomStyle.create({
    data: {
      userId: session.user.id,
      name,
      preview: preview || 'S',
      prompt,
    },
  })

  return NextResponse.json({ style }, { status: 201 })
})
