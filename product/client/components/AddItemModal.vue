<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <header class="modal__header">
        <h2 id="modal-title" class="modal__title">Add Item</h2>
        <button
          class="modal__close"
          type="button"
          aria-label="Close"
          @click="$emit('close')"
        >
          &times;
        </button>
      </header>

      <form class="item-form" @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="make">Make *</label>
            <input
              id="make"
              v-model="form.make"
              class="form-field__input"
              :class="{ 'form-field__input--error': fieldErrors.make }"
              type="text"
              @input="debounceFetchValuation"
              @blur="touchField('make')"
            />
            <p v-if="fieldErrors.make" class="form-field__error">
              {{ fieldErrors.make }}
            </p>
          </div>
          <div class="form-field">
            <label class="form-field__label" for="model">Model *</label>
            <input
              id="model"
              v-model="form.model"
              class="form-field__input"
              :class="{ 'form-field__input--error': fieldErrors.model }"
              type="text"
              @input="debounceFetchValuation"
              @blur="touchField('model')"
            />
            <p v-if="fieldErrors.model" class="form-field__error">
              {{ fieldErrors.model }}
            </p>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="condition">Condition *</label>
            <select
              id="condition"
              v-model="form.condition"
              class="form-field__input"
              :class="{ 'form-field__input--error': fieldErrors.condition }"
              @change="debounceFetchValuation"
              @blur="touchField('condition')"
            >
              <option value="">— select —</option>
              <option value="Mint">Mint</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
            <p v-if="fieldErrors.condition" class="form-field__error">
              {{ fieldErrors.condition }}
            </p>
          </div>
          <div class="form-field">
            <label class="form-field__label" for="serial">Serial Number</label>
            <input
              id="serial"
              v-model="form.serial"
              class="form-field__input"
              type="text"
            />
          </div>
        </div>

        <!-- Valuation preview block -->
        <div class="form-field valuation-preview">
          <p class="form-field__label">Market Estimate</p>
          <div class="valuation-preview__body">
            <p v-if="valuationState === 'idle'" class="valuation-preview__idle">
              Enter make, model, and condition to see an estimate.
            </p>
            <p
              v-else-if="valuationState === 'loading'"
              class="valuation-preview__loading"
            >
              <span class="loading-spinner" aria-hidden="true" />
              Checking recent sales&hellip;
            </p>
            <template v-else-if="valuationState === 'ready'">
              <p class="valuation-preview__estimate">
                ~&nbsp;${{ fmtPrice(valuationPreview.estimate) }}
                &nbsp;&nbsp;
                <span class="valuation-preview__range">
                  ${{ fmtPrice(valuationPreview.low) }}&nbsp;&ndash;&nbsp;${{
                    fmtPrice(valuationPreview.high)
                  }}
                  range
                </span>
              </p>
              <p class="valuation-preview__meta">
                Based on {{ valuationPreview.sampleSize }} recent sales
              </p>
            </template>
            <template v-else-if="valuationState === 'low-confidence'">
              <p class="valuation-preview__estimate">
                ~&nbsp;${{ fmtPrice(valuationPreview.estimate) }}
                <span
                  class="valuation-preview__warn"
                  aria-label="Warning: limited data"
                  >&#9888; limited data ({{
                    valuationPreview.sampleSize
                  }}
                  sale{{ valuationPreview.sampleSize === 1 ? '' : 's' }})</span
                >
              </p>
              <p class="valuation-preview__meta">
                ${{ fmtPrice(valuationPreview.low) }}&nbsp;&ndash;&nbsp;${{
                  fmtPrice(valuationPreview.high)
                }}
                range &mdash; treat as rough guide
              </p>
            </template>
            <p
              v-else-if="valuationState === 'no-data'"
              class="valuation-preview__no-data"
            >
              No sales data yet for this model. We&rsquo;ll track it as the
              dataset grows. You can add an override value after saving.
            </p>
            <p
              v-else-if="valuationState === 'error'"
              class="valuation-preview__error"
            >
              Could not load estimate &mdash; check your connection. You can
              save the item and check back later.
            </p>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="purchasePrice">
              Purchase Price ($)
              <span class="form-field__label-note"
                >What you paid — optional</span
              >
            </label>
            <input
              id="purchasePrice"
              v-model="form.purchasePrice"
              class="form-field__input"
              :class="{ 'form-field__input--error': fieldErrors.purchasePrice }"
              type="number"
              min="0"
              step="0.01"
              @blur="touchField('purchasePrice')"
            />
            <p v-if="fieldErrors.purchasePrice" class="form-field__error">
              {{ fieldErrors.purchasePrice }}
            </p>
          </div>
          <div class="form-field">
            <label class="form-field__label" for="purchaseDate">
              Purchase Date
            </label>
            <input
              id="purchaseDate"
              v-model="form.purchaseDate"
              class="form-field__input"
              type="date"
            />
          </div>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="photo">Photo *</label>
          <input
            id="photo"
            class="form-field__input form-field__input--file"
            :class="{ 'form-field__input--error': fieldErrors.photo }"
            type="file"
            accept="image/*"
            @change="handleFileChange"
          />
          <p v-if="photoFile" class="form-field__hint">{{ photoFile.name }}</p>
          <p v-if="fieldErrors.photo" class="form-field__error">
            {{ fieldErrors.photo }}
          </p>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="notes">Notes</label>
          <textarea
            id="notes"
            v-model="form.notes"
            class="form-field__input form-field__input--textarea"
            maxlength="1000"
          />
        </div>

        <p v-if="errorMessage" class="item-form__error">{{ errorMessage }}</p>

        <div class="item-form__footer">
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="loading"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            class="btn btn--primary"
            type="submit"
            :disabled="loading || hasValidationErrors"
          >
            <span
              v-if="loading"
              class="loading-spinner"
              data-testid="loading"
            />
            <span v-else>Save Item</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'AddItemModal',

  emits: ['close', 'saved'],

  data() {
    return {
      form: {
        make: '',
        model: '',
        serial: '',
        condition: '',
        purchasePrice: '',
        purchaseDate: '',
        notes: '',
      },
      photoFile: null,
      errorMessage: null,
      // local valuation state: 'idle' | 'loading' | 'ready' | 'low-confidence' | 'no-data' | 'error'
      valuationState: 'idle',
      valuationPreview: null,
      // tracks which fields have been interacted with (show errors only after touch)
      touched: {},
    }
  },

  computed: {
    ...mapState('items', ['loading']),

    fieldErrors() {
      const errors = {}
      if (this.touched.make && !this.form.make.trim()) {
        errors.make = 'Make is required.'
      }
      if (this.touched.model && !this.form.model.trim()) {
        errors.model = 'Model is required.'
      }
      if (this.touched.condition && !this.form.condition) {
        errors.condition = 'Condition is required.'
      }
      if (
        this.touched.purchasePrice &&
        this.form.purchasePrice !== '' &&
        Number(this.form.purchasePrice) < 0
      ) {
        errors.purchasePrice = 'Purchase price cannot be negative.'
      }
      if (this.touched.photo && !this.photoFile) {
        errors.photo = 'At least one photo is required.'
      }
      return errors
    },

    hasValidationErrors() {
      // Run full validation (without requiring touch) to gate the submit
      if (!this.form.make.trim()) return true
      if (!this.form.model.trim()) return true
      if (!this.form.condition) return true
      if (this.form.purchasePrice !== '' && Number(this.form.purchasePrice) < 0)
        return true
      if (!this.photoFile) return true
      return false
    },
  },

  methods: {
    touchField(field) {
      this.$set(this.touched, field, true)
    },

    handleFileChange(e) {
      this.photoFile = e.target.files[0] || null
      this.touchField('photo')
    },

    debounceFetchValuation() {
      if (this._debounceTimer) clearTimeout(this._debounceTimer)
      this._debounceTimer = setTimeout(() => {
        this._triggerValuationFetch()
      }, 600)
    },

    async _triggerValuationFetch() {
      const { make, model, condition } = this.form
      if (!make || !model || !condition) {
        this.valuationState = 'idle'
        this.valuationPreview = null
        return
      }
      this.valuationState = 'loading'
      this.valuationPreview = null
      try {
        const result = await this.$store.dispatch('items/fetchValuation', {
          make,
          model,
          condition,
        })
        if (!result || result.sampleSize === 0) {
          this.valuationState = 'no-data'
          this.valuationPreview = result || null
        } else if (result.sampleSize < 3) {
          this.valuationState = 'low-confidence'
          this.valuationPreview = result
        } else {
          this.valuationState = 'ready'
          this.valuationPreview = result
        }
      } catch (_err) {
        this.valuationState = 'error'
        this.valuationPreview = null
      }
    },

    async handleSubmit() {
      this.errorMessage = null

      // Touch all validated fields so inline errors become visible on submit
      ;['make', 'model', 'condition', 'purchasePrice', 'photo'].forEach((f) =>
        this.touchField(f)
      )

      if (this.hasValidationErrors) return

      // If still loading valuation, wait up to 3s then proceed regardless
      if (this.valuationState === 'loading') {
        await Promise.race([
          new Promise((resolve) => {
            const poll = setInterval(() => {
              if (this.valuationState !== 'loading') {
                clearInterval(poll)
                resolve()
              }
            }, 100)
          }),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ])
      }

      const estimatedValue =
        this.valuationPreview && this.valuationPreview.sampleSize > 0
          ? this.valuationPreview
          : null

      try {
        await this.$store.dispatch('items/addItem', {
          formData: {
            ...this.form,
            estimatedValue,
          },
          photoFile: this.photoFile,
        })
        this.$emit('saved')
      } catch (_err) {
        this.errorMessage = 'Failed to save item. Please try again.'
      }
    },

    fmtPrice(val) {
      if (val == null) return '—'
      return Number(val).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
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
  max-width: 600px;
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

.item-form {
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__error {
    color: $color-accent;
    font-size: 0.875rem;
  }

  &__footer {
    display: flex;
    gap: $spacing-sm;
    justify-content: flex-end;
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
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label-note {
    font-weight: 400;
    font-size: 0.75rem;
    color: $color-text-muted;
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

    &--file {
      padding: $spacing-xs;
    }

    &--textarea {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }
  }

  &__hint {
    font-size: 0.8rem;
    color: $color-text-muted;
  }

  &__error {
    font-size: 0.8rem;
    color: $color-accent;
    margin: 0;
  }

  &__input--error {
    border-color: $color-accent;
  }
}

// Valuation preview block
.valuation-preview {
  border: 1px solid $color-border;
  border-radius: $border-radius;
  background: $color-bg;
  padding: $spacing-md;

  &__body {
    margin-top: $spacing-xs;
  }

  &__idle {
    font-size: 0.8rem;
    color: $color-text-muted;
    font-style: italic;
    margin: 0;
  }

  &__loading {
    font-size: 0.875rem;
    color: $color-text-muted;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin: 0;
  }

  &__estimate {
    font-size: 1rem;
    font-weight: 700;
    color: $color-primary;
    margin: 0 0 2px;
  }

  &__range {
    font-size: 0.8rem;
    color: $color-text-muted;
    font-weight: 400;
  }

  &__meta {
    font-size: 0.8rem;
    color: $color-text-muted;
    margin: 0;
  }

  &__warn {
    font-size: 0.75rem;
    font-weight: 600;
    color: $color-at-market;
    margin-left: 4px;
  }

  &__no-data {
    font-size: 0.875rem;
    color: $color-text-muted;
    margin: 0;
  }

  &__error {
    font-size: 0.875rem;
    color: $color-accent;
    margin: 0;
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
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
