export const navigateToRoom = (router, roomCode, from = '/home') => {
  return router.push({
    path: `/room/${roomCode}`,
    query: { from },
  })
}

export const goBackWithFallback = (router, fallback = '/home') => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
    return
  }

  router.push(fallback)
}
