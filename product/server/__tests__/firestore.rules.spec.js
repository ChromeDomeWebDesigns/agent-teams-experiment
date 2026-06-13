/**
 * Firestore security rules tests.
 *
 * Requires the Firebase Emulator Suite running locally:
 *   firebase emulators:start --only firestore
 *
 * Run with:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 npm --prefix product/server test
 *
 * The suite is skipped automatically when FIRESTORE_EMULATOR_HOST is not set,
 * so it never blocks CI without the emulator infra.
 */

const fs = require('fs')
const path = require('path')

const RULES_PATH = path.resolve(__dirname, '../../../firestore.rules')
const PROJECT_ID = 'vault-rules-test'

const emulatorRunning = !!process.env.FIRESTORE_EMULATOR_HOST

// describe.skip skips the callback body too — but only `beforeAll`/`it` hooks,
// NOT the synchronous describe body itself. We therefore guard the require inside
// beforeAll so the undici-dependent module is never loaded when the emulator is absent.
const describeOrSkip = emulatorRunning ? describe : describe.skip

describeOrSkip('firestore.rules', () => {
  let testEnv
  let assertFails
  let assertSucceeds

  beforeAll(async () => {
    // Deferred require — only runs when the emulator is up (describeOrSkip === describe).
    const testing = require('@firebase/rules-unit-testing')
    assertFails = testing.assertFails
    assertSucceeds = testing.assertSucceeds

    testEnv = await testing.initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(RULES_PATH, 'utf8'),
        host: 'localhost',
        port: 8080,
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  afterEach(async () => {
    await testEnv.clearFirestore()
  })

  // Seed a known item under the per-user subcollection (bypasses rules).
  async function seedItem(itemId, userId) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('users')
        .doc(userId)
        .collection('items')
        .doc(itemId)
        .set({ userId, make: 'Leica', model: 'M6', condition: 'Excellent' })
    })
  }

  /* ------------------------------------------------------------------
   * users/{userId}/items subcollection
   * ------------------------------------------------------------------ */

  describe('items — create', () => {
    it('allows an authed user to create an item in their own subcollection', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-1')
          .set({ make: 'Leica', model: 'M6', condition: 'Excellent' })
      )
    })

    it("denies create in another user's subcollection", async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(
        db
          .collection('users')
          .doc('uid-bob')
          .collection('items')
          .doc('item-2')
          .set({ make: 'Nikon', model: 'F3', condition: 'Good' })
      )
    })

    it('denies create for unauthenticated callers', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-3')
          .set({ make: 'Leica', model: 'M6', condition: 'Excellent' })
      )
    })
  })

  describe('items — read', () => {
    beforeEach(() => seedItem('item-alice', 'uid-alice'))

    it('allows the owner to read their own item', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-alice')
          .get()
      )
    })

    it("denies a different user from reading another user's item", async () => {
      const db = testEnv.authenticatedContext('uid-bob').firestore()
      await assertFails(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-alice')
          .get()
      )
    })

    it('denies unauthenticated read', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-alice')
          .get()
      )
    })
  })

  describe('items — update', () => {
    beforeEach(() => seedItem('item-alice', 'uid-alice'))

    it('allows the owner to update their own item', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-alice')
          .update({ condition: 'Good' })
      )
    })

    it("denies a different user from updating another user's item", async () => {
      const db = testEnv.authenticatedContext('uid-bob').firestore()
      await assertFails(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-alice')
          .update({ condition: 'Poor' })
      )
    })
  })

  describe('items — delete', () => {
    beforeEach(() => seedItem('item-alice', 'uid-alice'))

    it('allows the owner to delete their own item', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-alice')
          .delete()
      )
    })

    it("denies a different user from deleting another user's item", async () => {
      const db = testEnv.authenticatedContext('uid-bob').firestore()
      await assertFails(
        db
          .collection('users')
          .doc('uid-alice')
          .collection('items')
          .doc('item-alice')
          .delete()
      )
    })
  })

  /* ------------------------------------------------------------------
   * logs collection
   * ------------------------------------------------------------------ */

  describe('logs — create', () => {
    it('allows an authed user to create a log entry', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(
        db
          .collection('logs')
          .doc('log-1')
          .set({ message: 'test', severity: 'INFO' })
      )
    })

    it('denies unauthenticated log create', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        db
          .collection('logs')
          .doc('log-2')
          .set({ message: 'test', severity: 'INFO' })
      )
    })
  })

  describe('logs — read / update / delete', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx
          .firestore()
          .collection('logs')
          .doc('log-seed')
          .set({ message: 'seeded', severity: 'INFO' })
      })
    })

    it('denies read on logs even for the authed user who wrote it', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(db.collection('logs').doc('log-seed').get())
    })

    it('denies update on logs', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(
        db.collection('logs').doc('log-seed').update({ message: 'tampered' })
      )
    })

    it('denies delete on logs', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(db.collection('logs').doc('log-seed').delete())
    })
  })

  /* ------------------------------------------------------------------
   * comps collection — crowd-sourced sales dataset
   * ------------------------------------------------------------------ */

  /** Minimal valid user-submitted comp payload. */
  function validComp(uid) {
    return {
      contributedBy: uid,
      status: 'user-submitted',
      make: 'Leica',
      model: 'M3',
      modelKey: 'leica-m3',
      condition: 'Good',
      salePrice: 1000,
      saleDate: '2026-05-01',
    }
  }

  /** Seed a comp directly (bypassing rules) so read/update/delete tests have data. */
  async function seedComp(compId, data) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('comps').doc(compId).set(data)
    })
  }

  describe('comps — read', () => {
    beforeEach(() =>
      seedComp('comp-seed', {
        contributedBy: 'uid-alice',
        status: 'seed',
        make: 'Leica',
        model: 'M3',
        modelKey: 'leica-m3',
        condition: 'Good',
        salePrice: 1000,
        saleDate: '2025-01-01',
      })
    )

    it('allows an authenticated user to read a comp', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(db.collection('comps').doc('comp-seed').get())
    })

    it('allows a different authenticated user to read a comp', async () => {
      const db = testEnv.authenticatedContext('uid-bob').firestore()
      await assertSucceeds(db.collection('comps').doc('comp-seed').get())
    })

    it('denies unauthenticated read', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(db.collection('comps').doc('comp-seed').get())
    })
  })

  describe('comps — create (user-submitted)', () => {
    it('allows an authed user to create their own user-submitted comp', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(
        db.collection('comps').doc('comp-alice').set(validComp('uid-alice'))
      )
    })

    it('denies create when contributedBy != auth.uid', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(
        db
          .collection('comps')
          .doc('comp-spoof')
          .set({
            ...validComp('uid-alice'),
            contributedBy: 'uid-bob', // spoofed uid
          })
      )
    })

    it('denies create with status "seed" (admin-only)', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(
        db
          .collection('comps')
          .doc('comp-seed-attempt')
          .set({
            ...validComp('uid-alice'),
            status: 'seed',
          })
      )
    })

    it('denies create with status "verified" (admin-only)', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(
        db
          .collection('comps')
          .doc('comp-verified-attempt')
          .set({
            ...validComp('uid-alice'),
            status: 'verified',
          })
      )
    })

    it('denies unauthenticated create', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        db.collection('comps').doc('comp-anon').set(validComp('uid-alice'))
      )
    })

    it('denies create when required field "make" is missing', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      const { make, ...withoutMake } = validComp('uid-alice')
      await assertFails(
        db.collection('comps').doc('comp-no-make').set(withoutMake)
      )
    })

    it('denies create when required field "salePrice" is missing', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      const { salePrice, ...withoutPrice } = validComp('uid-alice')
      await assertFails(
        db.collection('comps').doc('comp-no-price').set(withoutPrice)
      )
    })

    it('denies create when "make" is an empty string', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(
        db
          .collection('comps')
          .doc('comp-empty-make')
          .set({ ...validComp('uid-alice'), make: '' })
      )
    })
  })

  describe('comps — update / delete (always denied for clients)', () => {
    beforeEach(() => seedComp('comp-existing', validComp('uid-alice')))

    it('denies update even by the contributing user', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(
        db.collection('comps').doc('comp-existing').update({ salePrice: 9999 })
      )
    })

    it('denies delete even by the contributing user', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(db.collection('comps').doc('comp-existing').delete())
    })

    it('denies update by a different user', async () => {
      const db = testEnv.authenticatedContext('uid-bob').firestore()
      await assertFails(
        db.collection('comps').doc('comp-existing').update({ salePrice: 1 })
      )
    })
  })
})
