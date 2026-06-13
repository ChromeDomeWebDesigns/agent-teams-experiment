import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

// Firebase stubs — required because AddItemModal imports the items store
// module indirectly via the Vuex store we wire up.
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
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
jest.mock('@/lib/http', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))
jest.mock('@/lib/logger', () => ({
  createLog: jest.fn(),
  LOG_SEVERITIES: { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR' },
}))

const localVue = createLocalVue()
localVue.use(Vuex)

/**
 * Build a minimal Vuex store that exposes the state properties AddItemModal
 * actually reads: `items/loading`. The `addItem` action is replaceable so
 * individual tests can control resolve/reject.
 */
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
        state: () => ({
          currentUser: { uid: 'uid-test', email: 'a@b.com' },
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

describe('AddItemModal component', () => {
  let AddItemModal

  beforeAll(() => {
    AddItemModal = require('@/components/AddItemModal').default
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe('rendering', () => {
    it('renders the modal title "Add Item"', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.text()).toContain('Add Item')
    })

    it('renders a make input field', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('input#make').exists()).toBe(true)
    })

    it('renders a model input field', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('input#model').exists()).toBe(true)
    })

    it('renders a serial input field', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('input#serial').exists()).toBe(true)
    })

    it('renders a currentValue input field', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('input#currentValue').exists()).toBe(true)
    })

    it('renders a submit button labelled "Save Item" when not loading', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ loading: false }),
      })
      expect(wrapper.find('button[type="submit"]').text()).toContain(
        'Save Item'
      )
    })

    it('does not show an error message initially', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('.item-form__error').exists()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  describe('loading state', () => {
    it('disables the submit button when loading is true', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ loading: true }),
      })
      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })

    it('disables the cancel button when loading is true', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ loading: true }),
      })
      // Cancel button is type="button" with @click="$emit('close')"
      const cancelBtn = wrapper.find('button.btn--ghost')
      expect(cancelBtn.attributes('disabled')).toBeDefined()
    })
  })

  // -------------------------------------------------------------------------
  // Close / cancel
  // -------------------------------------------------------------------------
  describe('close / cancel', () => {
    it('emits "close" when the × header button is clicked', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      await wrapper.find('button.modal__close').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits "close" when the Cancel button is clicked', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      await wrapper.find('button.btn--ghost').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits "close" when the overlay backdrop is clicked', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      await wrapper.find('.modal-overlay').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  // -------------------------------------------------------------------------
  // Successful submit
  // -------------------------------------------------------------------------
  describe('successful submit', () => {
    it('dispatches items/addItem with formData containing the entered make', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await wrapper.find('input#make').setValue('Leica')
      await wrapper.find('input#model').setValue('M6')
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(addItem).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          formData: expect.objectContaining({ make: 'Leica' }),
        })
      )
    })

    it('dispatches items/addItem with formData containing the entered currentValue', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await wrapper.find('input#currentValue').setValue('1200')
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(addItem).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          formData: expect.objectContaining({
            currentValue: expect.anything(),
          }),
        })
      )
    })

    it('emits "saved" after a successful addItem dispatch', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('saved')).toBeTruthy()
    })

    it('does not show an error message after a successful submit', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.item-form__error').exists()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Failed submit
  // -------------------------------------------------------------------------
  describe('failed submit', () => {
    it('shows an error message when addItem rejects', async () => {
      const addItem = jest
        .fn()
        .mockRejectedValue(new Error('permission-denied'))
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.item-form__error').exists()).toBe(true)
      expect(wrapper.find('.item-form__error').text()).toContain(
        'Failed to save'
      )
    })

    it('does not emit "saved" when addItem rejects', async () => {
      const addItem = jest.fn().mockRejectedValue(new Error('fail'))
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('saved')).toBeFalsy()
    })
  })
})
