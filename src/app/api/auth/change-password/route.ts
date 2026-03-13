import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { requireUserAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { logAuthAction } from '@/lib/logging/semantic'

export const POST = apiHandler(async (request: NextRequest) => {
  // 验证登录状态
  const authResult = await requireUserAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const {
    session: {
      user: { id: userId, name: username = 'unknown' },
    },
  } = authResult

  const body = await request.json().catch(() => ({}))
  const { newPassword } = body as { newPassword?: string }

  // 基础校验：必须提供新密码
  if (!newPassword || typeof newPassword !== 'string') {
    logAuthAction('CHANGE_PASSWORD', username, {
      userId,
      error: 'Missing newPassword',
    })
    throw new ApiError('INVALID_PARAMS', { field: 'newPassword' })
  }

  if (newPassword.length < 6) {
    logAuthAction('CHANGE_PASSWORD', username, {
      userId,
      error: 'Password too short',
    })
    throw new ApiError('INVALID_PARAMS', { field: 'newPassword', reason: 'too_short' })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  })

  logAuthAction('CHANGE_PASSWORD', username, {
    userId,
    success: true,
  })

  return NextResponse.json({
    success: true,
    message: 'Password updated successfully',
  })
})

