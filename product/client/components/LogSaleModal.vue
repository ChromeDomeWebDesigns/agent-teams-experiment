<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-sale-title"
    >
      <header class="modal__header">
        <h2 id="log-sale-title" class="modal__title">Log a Sale</h2>
        <button
          class="modal__close"
          type="button"
          aria-label="Close"
          @click="$emit('close')"
        >
          &times;
        </button>
      </header>

      <!-- Success state -->
      <div v-if="success" class="log-sale-success">
        <p class="log-sale-success__heading">Sale logged. Thank you!</p>
        <p class="log-sale-success__body">
          This data joins our comp pool and will improve estimates for this
          model.
        </p>
        <div class="log-sale-success__footer">
          <button
            class="btn btn--primary"
            type="button"
            @click="$emit('close')"
          >
            Close
          </button>
        </div>
      </div>

      <!-- Form state -->
      <form v-else class="sale-form" @submit.prevent="handleSubmit">
        <p class="sale-form__intro">
          Help improve estimates by sharing a real sale price. Your user ID is
          attached but never shown publicly.
        </p>

        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="sale-make">Make *</label>
            <input
              id="sale-make"
              v-model="form.make"
              class="form-field__input"
              type="text"
              required
            />
          </div>
          <div class="form-field">
            <label class="form-field__label" for="sale-model">Model *</label>
            <input
              id="sale-model"
              v-model="form.model"
              class="form-field__input"
              type="text"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="sale-condition">
              Condition *
            </label>
            <select
              id="sale-condition"
              v-model="form.condition"
              class="form-field__input"
              required
            >
              <option value="">— select —</option>
              <option value="Mint">Mint</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-field__label" for="sale-price">
              Sale Price (USD) *
            </label>
            <input
              id="sale-price"
              v-model="form.salePrice"
              class="form-field__input"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="sale-date">
              Sale Date *
            </label>
            <input
              id="sale-date"
              v-model="form.saleDate"
              class="form-field__input"
              type="date"
              :max="today"
              required
            />
          </div>
          <div class="form-field">
            <label class="form-field__label" for="sale-source">Source *</label>
            <select
              id="sale-source"
              v-model="form.source"
              class="form-field__input"
              required
            >
              <option value="">— select —</option>
              <option value="eBay">eBay</option>
              <option value="KEH">KEH</option>
              <option value="Local sale">Local sale</option>
              <option value="Auction">Auction</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <p v-if="errorMessage" class="sale-form__error">{{ errorMessage }}</p>

        <div class="sale-form__footer">
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="loading"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button class="btn btn--primary" type="submit" :disabled="loading">
            <span
              v-if="loading"
              class="loading-spinner"
              data-testid="loading"
            />
            <span v-else>Submit Sale</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'LogSaleModal',

  props: {
    prefillMake: { type: String, default: '' },
    prefillModel: { type: String, default: '' },
  },

  emits: ['close'],

  data() {
    return {
      form: {
        make: this.prefillMake || '',
        model: this.prefillModel || '',
        condition: '',
        salePrice: '',
        saleDate: '',
        source: '',
      },
      errorMessage: null,
      success: false,
    }
  },

  computed: {
    ...mapState('comps', ['loading']),
    ...mapGetters('users', ['uid']),

    today() {
      return new Date().toISOString().slice(0, 10)
    },
  },

  methods: {
    async handleSubmit() {
      this.errorMessage = null
      try {
        await this.$store.dispatch('comps/logSale', {
          make: this.form.make,
          model: this.form.model,
          condition: this.form.condition,
          salePrice: this.form.salePrice,
          saleDate: this.form.saleDate,
          source: this.form.source,
          uid: this.uid,
        })
        this.success = true
      } catch (_err) {
        this.errorMessage = 'Could not submit sale. Please try again.'
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: $spacing-md;
}

.modal {
  background: $color-white;
  border-radius: $border-radius;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-lg;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: $color-primary;
  }

  &__close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: $color-text-muted;
    line-height: 1;

    &:hover {
      color: $color-text;
    }
  }
}

.sale-form {
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__intro {
    font-size: 0.875rem;
    color: $color-text-muted;
    margin: 0;
  }

  &__error {
    color: $color-accent;
    font-size: 0.875rem;
    margin: 0;
  }

  &__footer {
    display: flex;
    gap: $spacing-sm;
    justify-content: flex-end;
    margin-top: $spacing-sm;
  }
}

.log-sale-success {
  padding: $spacing-xl $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  text-align: center;

  &__heading {
    font-size: 1.125rem;
    font-weight: 700;
    color: $color-primary;
    margin: 0;
  }

  &__body {
    font-size: 0.875rem;
    color: $color-text-muted;
    margin: 0;
  }

  &__footer {
    display: flex;
    justify-content: center;
    margin-top: $spacing-sm;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: $color-text;
  }

  &__input {
    padding: $spacing-sm $spacing-md;
    border: 1px solid $color-border;
    border-radius: $border-radius;
    font-size: 1rem;
    outline: none;
    background: $color-white;
    transition: border-color 0.15s;

    &:focus {
      border-color: $color-accent;
    }
  }
}

.btn {
  padding: $spacing-sm $spacing-lg;
  border-radius: $border-radius;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: $color-accent;
    color: $color-white;
  }

  &--ghost {
    background: transparent;
    color: $color-text-muted;
    border: 1px solid $color-border;
  }
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid $color-border;
  border-top-color: $color-accent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
