import authenticated, { GUEST_ROUTES } from '@/middleware/authenticated'

/**
 * Build a minimal Nuxt middleware context.
 *
 * @param {boolean} isAuthenticated
 * @param {string}  path
 * @returns {{ store: object, route: object, redirect: jest.Mock }}
 */
function makeCtx(isAuthenticated, path) {
  return {
    store: {
      getters: {
        'users/isAuthenticated': isAuthenticated,
      },
    },
    route: { path },
    redirect: jest.fn(),
  }
}

describe('middleware/authenticated', () => {
  describe('GUEST_ROUTES constant', () => {
    it('contains /login', () => {
      expect(GUEST_ROUTES).toContain('/login')
    })

    it('contains /sign-up', () => {
      expect(GUEST_ROUTES).toContain('/sign-up')
    })
  })

  describe('regression: no infinite redirect loop on guest-only routes', () => {
    it('unauthenticated + /login → redirect is NOT called', () => {
      const ctx = makeCtx(false, '/login')
      authenticated(ctx)
      expect(ctx.redirect).not.toHaveBeenCalled()
    })

    it('unauthenticated + /sign-up → redirect is NOT called', () => {
      const ctx = makeCtx(false, '/sign-up')
      authenticated(ctx)
      expect(ctx.redirect).not.toHaveBeenCalled()
    })
  })

  describe('unauthenticated user on a protected route', () => {
    it('redirects to /login when visiting /', () => {
      const ctx = makeCtx(false, '/')
      authenticated(ctx)
      expect(ctx.redirect).toHaveBeenCalledTimes(1)
      expect(ctx.redirect).toHaveBeenCalledWith('/login')
    })

    it('redirects to /login when visiting /items', () => {
      const ctx = makeCtx(false, '/items')
      authenticated(ctx)
      expect(ctx.redirect).toHaveBeenCalledTimes(1)
      expect(ctx.redirect).toHaveBeenCalledWith('/login')
    })
  })

  describe('authenticated user on a guest-only route', () => {
    it('redirects to / when visiting /login', () => {
      const ctx = makeCtx(true, '/login')
      authenticated(ctx)
      expect(ctx.redirect).toHaveBeenCalledTimes(1)
      expect(ctx.redirect).toHaveBeenCalledWith('/')
    })

    it('redirects to / when visiting /sign-up', () => {
      const ctx = makeCtx(true, '/sign-up')
      authenticated(ctx)
      expect(ctx.redirect).toHaveBeenCalledTimes(1)
      expect(ctx.redirect).toHaveBeenCalledWith('/')
    })
  })

  describe('authenticated user on a protected route', () => {
    it('does NOT redirect when visiting /', () => {
      const ctx = makeCtx(true, '/')
      authenticated(ctx)
      expect(ctx.redirect).not.toHaveBeenCalled()
    })

    it('does NOT redirect when visiting /items', () => {
      const ctx = makeCtx(true, '/items')
      authenticated(ctx)
      expect(ctx.redirect).not.toHaveBeenCalled()
    })
  })
})
