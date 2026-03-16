import { getArtStylePrompt, isArtStyleValue, isCustomStyleValue, getCustomStyleId } from './constants'
import { prisma } from './prisma'

/**
 * Resolves the art style prompt for image generation.
 * Handles both built-in styles and custom user styles.
 */
export async function resolveArtStylePrompt(
  artStyle: string | null | undefined,
  locale: 'zh' | 'en',
  userId: string,
): Promise<string> {
  if (!artStyle) return ''
  if (isArtStyleValue(artStyle)) return getArtStylePrompt(artStyle, locale)
  if (isCustomStyleValue(artStyle)) {
    const id = getCustomStyleId(artStyle)
    const custom = await prisma.userCustomStyle.findFirst({ where: { id, userId } })
    return custom?.prompt ?? ''
  }
  return ''
}
