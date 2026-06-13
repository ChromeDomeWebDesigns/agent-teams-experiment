import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

// Mock firebase deps so the store module imports don't fail
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
}))
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}))
jest.mock('@/plugins/firebase', () => ({
  db: {},
  auth: {},
}))
jest.mock('@/lib/logger', () => ({
  createLog: jest.fn(),
  LOG_SEVERITIES: { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR' },
}))

const localVue = createLocalVue()
localVue.use(Vuex)

// Build a lightweight store that mirrors the real module shapes
function makeStore({
  loading = false,
  addItem = jest.fn().mockResolvedValue(),
} = {}) {
  return new Vuex.Store({
    modules: {
      items: {
        namespaced: true,
        state: () => ({ items: [], loading }),
        mutations: {},
        actions: { addItem },
        getters: { totalValue: () => 0 },
      },
      users: {
        namespaced: true,
        // Real store uses currentUser, not user
        state: () => ({
          currentUser: { uid: 'uid-test', email: 'a@b.com' },
          loading: false,
        }),
        mutations: {},
        actions: {},
        getters: {
          uid: (state) => (state.currentUser ? state.currentUser.uid : null),
          isAuthenticated: (state) => !!state.currentUser,
        },
      },
    },
  })
}

describe('AddItemModal component (add-item form)', () => {
  let AddItemModal

  beforeAll(() => {
    AddItemModal = require('@/components/AddItemModal').default
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a make/model or name input field', () => {
    const store = makeStore()
    const wrapper = shallowMount(AddItemModal, { localVue, store })
    // Accept any reasonable field name the FE chooses
    const input = wrapper.find(
      'input[name="make"], input[name="model"], input[name="name"], ' +
        'input#make, input#model, [data-testid="make-input"], [data-testid="name-input"]'
    )
    expect(input.exists()).toBe(true)
  })

  it('renders a currentValue input field', () => {
    const store = makeStore()
    const wrapper = shallowMount(AddItemModal, { localVue, store })
    const input = wrapper.find(
      'input[name="currentValue"], input[name="value"], ' +
        'input#currentValue, [data-testid="value-input"], [data-testid="current-value-input"]'
    )
    expect(input.exists()).toBe(true)
  })

  it('renders a submit button', () => {
    const store = makeStore()
    const wrapper = shallowMount(AddItemModal, { localVue, store })
    expect(wrapper.find('button[type="submit"], button').exists()).toBe(true)
  })

  it('dispatches items/addItem with formData containing currentValue on submit', async () => {
    const addItem = jest.fn().mockResolvedValue()
    const store = makeStore({ addItem })
    const wrapper = shallowMount(AddItemModal, { localVue, store })

    // Fill the currentValue field — accept any of the likely names
    const valueInput = wrapper.find(
      'input[name="currentValue"], input[name="value"], ' +
        'input#currentValue, [data-testid="value-input"], [data-testid="current-value-input"]'
    )
    await valueInput.setValue('500')

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(addItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        formData: expect.objectContaining({ currentValue: expect.anything() }),
      })
    )
  })

  it('emits a close or saved event after successful submit', async () => {
    const addItem = jest.fn().mockResolvedValue()
    const store = makeStore({ addItem })
    const wrapper = shallowMount(AddItemModal, { localVue, store })

    const valueInput = wrapper.find(
      'input[name="currentValue"], input[name="value"], ' +
        'input#currentValue, [data-testid="value-input"], [data-testid="current-value-input"]'
    )
    await valueInput.setValue('500')

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted()
    const emittedSavedOrClose = emitted.saved || emitted.close
    expect(emittedSavedOrClose).toBeTruthy()
  })

  it('disables the submit button or shows a spinner when loading', () => {
    const store = makeStore({ loading: true })
    const wrapper = shallowMount(AddItemModal, {
      localVue,
      store,
      stubs: { LoadingSpinner: true },
    })

    const btn = wrapper.find('button[type="submit"]')
    // `:disabled="loading"` should set the disabled attribute when loading is true
    const hasLoadingIndicator =
      btn.exists() && btn.attributes('disabled') !== undefined
    expect(hasLoadingIndicator).toBe(true)
  })
})
