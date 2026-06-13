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
              type="text"
              required
            />
          </div>
          <div class="form-field">
            <label class="form-field__label" for="model">Model *</label>
            <input
              id="model"
              v-model="form.model"
              class="form-field__input"
              type="text"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="serial">Serial Number</label>
            <input
              id="serial"
              v-model="form.serial"
              class="form-field__input"
              type="text"
            />
          </div>
          <div class="form-field">
            <label class="form-field__label" for="condition">Condition</label>
            <select
              id="condition"
              v-model="form.condition"
              class="form-field__input"
            >
              <option value="">— select —</option>
              <option value="Mint">Mint</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="purchasePrice">
              Purchase Price ($)
            </label>
            <input
              id="purchasePrice"
              v-model="form.purchasePrice"
              class="form-field__input"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <div class="form-field">
            <label class="form-field__label" for="currentValue">
              Current Value ($)
            </label>
            <input
              id="currentValue"
              v-model="form.currentValue"
              class="form-field__input"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
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

        <div class="form-field">
          <label class="form-field__label" for="photo">Photo</label>
          <input
            id="photo"
            class="form-field__input form-field__input--file"
            type="file"
            accept="image/*"
            @change="handleFileChange"
          />
          <p v-if="photoFile" class="form-field__hint">{{ photoFile.name }}</p>
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
          <button class="btn btn--primary" type="submit" :disabled="loading">
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
        currentValue: '',
        purchaseDate: '',
      },
      photoFile: null,
      errorMessage: null,
    }
  },

  computed: {
    ...mapState('items', ['loading']),
  },

  methods: {
    handleFileChange(e) {
      this.photoFile = e.target.files[0] || null
    },

    async handleSubmit() {
      this.errorMessage = null
      try {
        await this.$store.dispatch('items/addItem', {
          formData: this.form,
          photoFile: this.photoFile,
        })
        this.$emit('saved')
      } catch (err) {
        this.errorMessage = 'Failed to save item. Please try again.'
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
  }

  &__hint {
    font-size: 0.8rem;
    color: $color-text-muted;
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
</style>
