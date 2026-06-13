<template>
  <form class="item-form" @submit.prevent="handleSubmit">
    <div class="form-field">
      <label class="form-field__label" for="name">Name *</label>
      <input
        id="name"
        v-model="form.name"
        name="name"
        class="form-field__input"
        type="text"
        required
      />
    </div>

    <div class="form-field">
      <label class="form-field__label" for="currentValue"
        >Current Value ($) *</label
      >
      <input
        id="currentValue"
        v-model="form.currentValue"
        name="currentValue"
        class="form-field__input"
        type="number"
        min="0"
        step="0.01"
        required
      />
    </div>

    <p v-if="errorMessage" class="item-form__error">{{ errorMessage }}</p>

    <button class="btn btn--primary" type="submit" :disabled="loading">
      <span v-if="loading" class="loading-spinner" data-testid="loading"
        >Saving...</span
      >
      <span v-else>Save Item</span>
    </button>
  </form>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'AddItemForm',

  data() {
    return {
      form: {
        name: '',
        currentValue: '',
      },
      errorMessage: null,
    }
  },

  computed: {
    ...mapState('items', ['loading']),
    ...mapGetters('users', { userId: 'uid' }),
  },

  methods: {
    async handleSubmit() {
      this.errorMessage = null
      try {
        await this.$store.dispatch('items/addItem', {
          userId: this.userId,
          name: this.form.name,
          currentValue: this.form.currentValue
            ? Number(this.form.currentValue)
            : null,
        })
        this.$emit('saved')
      } catch (err) {
        this.errorMessage = 'Failed to save item. Please try again.'
      }
    },
  },
}
</script>
