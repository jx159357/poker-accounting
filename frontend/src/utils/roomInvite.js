export const buildRoomShareUrl = (roomCode) => {
  const normalizedCode = String(roomCode || '').trim().toUpperCase()
  if (!normalizedCode) return ''

  const configuredBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  if (configuredBaseUrl) {
    return new URL(`/room/${normalizedCode}`, configuredBaseUrl.endsWith('/') ? configuredBaseUrl : `${configuredBaseUrl}/`).toString()
  }

  if (typeof window === 'undefined') {
    return `/room/${normalizedCode}`
  }

  return new URL(`/room/${normalizedCode}`, window.location.origin).toString()
}

export const buildRoomShareText = (roomName, roomCode) => {
  const normalizedCode = String(roomCode || '').trim().toUpperCase()
  const title = roomName?.trim() || '打牌记账'
  return `来打牌！房间: ${title}，房间号: ${normalizedCode}`
}

export const extractRoomCodeFromText = input => {
  const text = String(input || '').trim()
  if (!text) return ''

  try {
    const parsed = new URL(text, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const roomMatch = parsed.pathname.match(/\/room\/([A-Za-z0-9]{6,12})/i)
    if (roomMatch?.[1]) {
      return roomMatch[1].toUpperCase()
    }

    const queryRoomCode = parsed.searchParams.get('roomCode')
    if (queryRoomCode && /^[A-Za-z0-9]{6,12}$/.test(queryRoomCode)) {
      return queryRoomCode.toUpperCase()
    }
  } catch {
    // 不是合法 URL 时继续按普通文本处理
  }

  const labeledMatch = text.match(/(?:房间号|roomCode|room)\s*[:：=]?\s*([A-Za-z0-9]{6,12})/i)
  if (labeledMatch?.[1]) {
    return labeledMatch[1].toUpperCase()
  }

  const rawCodeMatch = text.match(/\b([A-Za-z0-9]{6,12})\b/)
  if (rawCodeMatch?.[1]) {
    return rawCodeMatch[1].toUpperCase()
  }

  return ''
}
