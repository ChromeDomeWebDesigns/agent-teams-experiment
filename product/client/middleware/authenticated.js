/**
 * Global route guard (registered in nuxt.config `router.middleware`).
 *
 * - Guest-only routes (login, sign-up): redirect to `/` when already signed in.
 * - Every other route: redirect to `/login` when not signed in.
 *
 * Guest routes are matched by PATH rather than page-level `meta`. Nuxt 2 (SPA)
 * does not reliably surface a page component's `meta` option on `route.meta`,
 * so the previous `route.meta.some(m => m.guestOnly)` check was always false —
 * which made `/login` itself "auth-required" and redirected it to `/login`
 * forever (an infinite loop). A path allow-list is unambiguous and loop-proof.
 */
export const GUEST_ROUTES = ['/login', '/sign-up']

export default function ({ store, route, redirect }) {
  const isAuthenticated = store.getters['users/isAuthenticated']
  const isGuestOnly = GUEST_ROUTES.includes(route.path)

  if (isGuestOnly && isAuthenticated) {
    return redirect('/')
  }

  if (!isGuestOnly && !isAuthenticated) {
    return redirect('/login')
  }
}
