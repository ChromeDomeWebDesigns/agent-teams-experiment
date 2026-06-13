/**
 * Initialise the Firebase Auth state observer once, before any navigation.
 * This ensures store/users.currentUser is populated before route middleware runs.
 */
export default async function ({ store }) {
  await store.dispatch('users/initAuthObserver')
}
