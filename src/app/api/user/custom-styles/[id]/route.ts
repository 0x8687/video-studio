import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { ApiError, apiHandler } from '@/lib/api-errors'

// PATCH - 更新自定义风格
export const PATCH = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const existing = await prisma.userCustomStyle.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    throw new ApiError('NOT_FOUND')
  }

  const body = await request.json()
  const updateData: Record<string, string> = {}
  if (typeof body.name === 'string' && body.name.trim()) {
    updateData.name = body.name.trim()
  }
  if (typeof body.prompt === 'string' && body.prompt.trim()) {
    updateData.prompt = body.prompt.trim()
  }
  if (typeof body.preview === 'string') {
    updateData.preview = body.preview.trim().slice(0, 2) || '自'
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const style = await prisma.userCustomStyle.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ style })
})

// DELETE - 删除自定义风格
export const DELETE = apiHandler(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const existing = await prisma.userCustomStyle.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    throw new ApiError('NOT_FOUND')
  }

  await prisma.userCustomStyle.delete({ where: { id } })

  return NextResponse.json({ ok: true })
})
