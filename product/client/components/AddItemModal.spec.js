import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

// Firebase stubs
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
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
  default: { get: jest.fn(), post: jest.fn() },
}))
jest.mock('@/lib/logger', () => ({
  createLog: jest.fn(),
  LOG_SEVERITIES: { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR' },
}))

const localVue = createLocalVue()
localVue.use(Vuex)

/**
 * Build a minimal Vuex store that exposes the state properties AddItemModal
 * actually reads: `items/loading`. The `addItem` and `fetchValuation` actions
 * are replaceable so individual tests can control resolve/reject.
 */
function makeStore({
  loading = false,
  addItem = jest.fn().mockResolvedValue(),
  fetchValuation = jest.fn().mockResolvedValue(null),
} = {}) {
  return new Vuex.Store({
    modules: {
      items: {
        namespaced: true,
        state: () => ({ items: [], loading, valuationPreview: null }),
        mutations: {
          SET_VALUATION_PREVIEW(state, val) {
            state.valuationPreview = val
          },
        },
        actions: { addItem, fetchValuation },
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
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
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

    it('does NOT render a currentValue input field', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('input#currentValue').exists()).toBe(false)
    })

    it('renders a condition select field', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('select#condition').exists()).toBe(true)
    })

    it('renders the valuation preview block', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('.valuation-preview').exists()).toBe(true)
    })

    it('shows idle state in valuation preview initially', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(wrapper.find('.valuation-preview__idle').exists()).toBe(true)
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
  // Client-side validation
  // -------------------------------------------------------------------------
  describe('client-side validation', () => {
    it('submit button is disabled initially because required fields are empty', () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      expect(
        wrapper.find('button[type="submit"]').attributes('disabled')
      ).toBeDefined()
    })

    it('shows make error after blur when make is empty', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      await wrapper.find('input#make').trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.fieldErrors.make).toBeTruthy()
    })

    it('shows model error after blur when model is empty', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      await wrapper.find('input#model').trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.fieldErrors.model).toBeTruthy()
    })

    it('shows condition error after blur when condition is not selected', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      await wrapper.find('select#condition').trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.fieldErrors.condition).toBeTruthy()
    })

    it('shows photo error when touchField("photo") is called with no file chosen', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      wrapper.vm.touchField('photo')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.fieldErrors.photo).toBeTruthy()
    })

    it('shows purchasePrice error when a negative value is entered and touched', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      await wrapper.find('input#purchasePrice').setValue('-10')
      wrapper.vm.touchField('purchasePrice')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.fieldErrors.purchasePrice).toBeTruthy()
    })

    it('does NOT flag purchasePrice error when the field is left empty (it is optional)', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      wrapper.vm.touchField('purchasePrice')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.fieldErrors.purchasePrice).toBeFalsy()
    })

    it('hasValidationErrors is false when all required fields are filled', async () => {
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore(),
      })
      wrapper.vm.form.make = 'Leica'
      wrapper.vm.form.model = 'M3'
      wrapper.vm.form.condition = 'Excellent'
      wrapper.vm.photoFile = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.hasValidationErrors).toBe(false)
    })

    it('does not dispatch addItem when form is submitted with empty required fields', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()
      expect(addItem).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Successful submit
  // -------------------------------------------------------------------------
  describe('successful submit', () => {
    // Helper: fill all required fields and attach a mock photo so validation
    // passes. Required fields added in cycle 6: make, model, condition, photo.
    async function fillRequiredFields(wrapper, overrides = {}) {
      await wrapper
        .find('input#make')
        .setValue(overrides.make !== undefined ? overrides.make : 'Leica')
      await wrapper
        .find('input#model')
        .setValue(overrides.model !== undefined ? overrides.model : 'M6')
      await wrapper
        .find('select#condition')
        .setValue(
          overrides.condition !== undefined ? overrides.condition : 'Good'
        )
      // Set photoFile directly on vm — file inputs can't be set via setValue in jsdom
      wrapper.vm.photoFile = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await wrapper.vm.$nextTick()
    }

    it('dispatches items/addItem with formData containing the entered make', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await fillRequiredFields(wrapper, { make: 'Leica' })
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(addItem).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          formData: expect.objectContaining({ make: 'Leica' }),
        })
      )
    })

    it('dispatches items/addItem with formData that does NOT include currentValue', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await fillRequiredFields(wrapper, { make: 'Canon' })
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(addItem).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          formData: expect.not.objectContaining({
            currentValue: expect.anything(),
          }),
        })
      )
    })

    it('dispatches items/addItem with formData including estimatedValue key', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await fillRequiredFields(wrapper)
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(addItem).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          formData: expect.objectContaining({ estimatedValue: null }),
        })
      )
    })

    it('emits "saved" after a successful addItem dispatch', async () => {
      const addItem = jest.fn().mockResolvedValue()
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await fillRequiredFields(wrapper)
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

      await fillRequiredFields(wrapper)
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.item-form__error').exists()).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Failed submit
  // -------------------------------------------------------------------------
  describe('failed submit', () => {
    // Shared helper — same as in "successful submit" group
    async function fillRequiredFields(wrapper) {
      await wrapper.find('input#make').setValue('Leica')
      await wrapper.find('input#model').setValue('M6')
      await wrapper.find('select#condition').setValue('Good')
      wrapper.vm.photoFile = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await wrapper.vm.$nextTick()
    }

    it('shows an error message when addItem rejects', async () => {
      const addItem = jest
        .fn()
        .mockRejectedValue(new Error('permission-denied'))
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ addItem }),
      })

      await fillRequiredFields(wrapper)
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

      await fillRequiredFields(wrapper)
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('saved')).toBeFalsy()
    })
  })

  // -------------------------------------------------------------------------
  // Valuation preview debounce
  // -------------------------------------------------------------------------
  describe('valuation preview', () => {
    it('does not dispatch fetchValuation while fields are incomplete', async () => {
      const fetchValuation = jest.fn().mockResolvedValue(null)
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ fetchValuation }),
      })

      await wrapper.find('input#make').setValue('Leica')
      // model and condition still empty — no dispatch expected
      jest.runAllTimers()
      await wrapper.vm.$nextTick()

      expect(fetchValuation).not.toHaveBeenCalled()
    })

    it('dispatches fetchValuation once all three fields are filled after debounce', async () => {
      const fetchValuation = jest.fn().mockResolvedValue(null)
      const wrapper = shallowMount(AddItemModal, {
        localVue,
        store: makeStore({ fetchValuation }),
      })

      await wrapper.find('input#make').setValue('Leica')
      await wrapper.find('input#model').setValue('M3')
      await wrapper.find('select#condition').setValue('Excellent')
      jest.runAllTimers()
      await wrapper.vm.$nextTick()

      expect(fetchValuation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          make: 'Leica',
          model: 'M3',
          condition: 'Excellent',
        })
      )
    })
  })
})
