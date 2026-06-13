/**
 * Route middleware that guards authenticated-only and auth-only pages.
 *
 * Pages that require a logged-in user should declare:
 *   middleware: 'authenticated'
 *
 * Auth pages (login, sign-up) should declare:
 *   middleware: 'authenticated'
 *   meta: { guestOnly: true }
 *
 * The middleware is also registered globally in nuxt.config so every route
 * gets at least the redirect-to-login guard.
 */
export default function ({ store, route, redirect }) {
  const isAuthenticated = store.getters['users/isAuthenticated']
  const isGuestOnly = route.meta && route.meta.some((m) => m.guestOnly)

  if (isGuestOnly && isAuthenticated) {
    return redirect('/')
  }

  if (!isGuestOnly && !isAuthenticated) {
    return redirect('/login')
  }
}
