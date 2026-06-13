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

  // Seed a known item owned by userId directly (bypasses rules).
  async function seedItem(itemId, userId) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('items')
        .doc(itemId)
        .set({ userId, make: 'Leica', model: 'M6', currentValue: 1500 })
    })
  }

  /* ------------------------------------------------------------------
   * items collection
   * ------------------------------------------------------------------ */

  describe('items — create', () => {
    it('allows an authed user to create their own item', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(
        db.collection('items').doc('item-1').set({
          userId: 'uid-alice',
          make: 'Leica',
          model: 'M6',
          currentValue: 1500,
        })
      )
    })

    it('denies create when userId != auth.uid', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertFails(
        db.collection('items').doc('item-2').set({
          userId: 'uid-bob',
          make: 'Nikon',
          model: 'F3',
          currentValue: 800,
        })
      )
    })

    it('denies create for unauthenticated callers', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        db.collection('items').doc('item-3').set({
          userId: 'uid-alice',
          make: 'Leica',
          model: 'M6',
          currentValue: 1500,
        })
      )
    })
  })

  describe('items — read', () => {
    beforeEach(() => seedItem('item-alice', 'uid-alice'))

    it('allows the owner to read their own item', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(db.collection('items').doc('item-alice').get())
    })

    it("denies a different user from reading another user's item", async () => {
      const db = testEnv.authenticatedContext('uid-bob').firestore()
      await assertFails(db.collection('items').doc('item-alice').get())
    })

    it('denies unauthenticated read', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(db.collection('items').doc('item-alice').get())
    })
  })

  describe('items — update', () => {
    beforeEach(() => seedItem('item-alice', 'uid-alice'))

    it('allows the owner to update their own item', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(
        db.collection('items').doc('item-alice').update({ currentValue: 2000 })
      )
    })

    it("denies a different user from updating another user's item", async () => {
      const db = testEnv.authenticatedContext('uid-bob').firestore()
      await assertFails(
        db.collection('items').doc('item-alice').update({ currentValue: 99 })
      )
    })
  })

  describe('items — delete', () => {
    beforeEach(() => seedItem('item-alice', 'uid-alice'))

    it('allows the owner to delete their own item', async () => {
      const db = testEnv.authenticatedContext('uid-alice').firestore()
      await assertSucceeds(db.collection('items').doc('item-alice').delete())
    })

    it("denies a different user from deleting another user's item", async () => {
      const db = testEnv.authenticatedContext('uid-bob').firestore()
      await assertFails(db.collection('items').doc('item-alice').delete())
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
})
