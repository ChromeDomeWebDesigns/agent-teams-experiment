<template>
  <main class="page-auth">
    <div class="auth-card">
      <h1 class="auth-card__title">Create Account</h1>
      <p class="auth-card__sub">Start cataloguing your collection.</p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="form-field__label" for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            class="form-field__input"
            type="email"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-field__label" for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            class="form-field__input"
            type="password"
            autocomplete="new-password"
            minlength="6"
            required
          />
        </div>

        <p v-if="errorMessage" class="auth-form__error">{{ errorMessage }}</p>

        <button class="btn btn--primary" type="submit" :disabled="loading">
          <LoadingSpinner v-if="loading" />
          <span v-else>Create Account</span>
        </button>
      </form>

      <p class="auth-card__footer">
        Already have an account?
        <nuxt-link to="/login">Sign in</nuxt-link>
      </p>
    </div>
  </main>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'SignUpPage',

  data() {
    return {
      form: {
        email: '',
        password: '',
      },
      errorMessage: null,
    }
  },

  computed: {
    ...mapState('users', ['loading']),
  },

  methods: {
    async handleSubmit() {
      this.errorMessage = null
      try {
        await this.$store.dispatch('users/signUp', {
          email: this.form.email,
          password: this.form.password,
        })
        this.$router.push('/')
      } catch (err) {
        this.errorMessage = _friendlyError(err.code)
      }
    },
  },
}

/* private */

function _friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
  }
  return map[code] || 'Sign-up failed. Please try again.'
}
</script>

<style lang="scss" scoped>
.page-auth {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: $spacing-xl $spacing-md;
  background: $color-bg;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: $border-radius;
  padding: $spacing-xl;

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: $color-primary;
    margin-bottom: $spacing-xs;
  }

  &__sub {
    color: $color-text-muted;
    margin-bottom: $spacing-lg;
  }

  &__footer {
    margin-top: $spacing-lg;
    text-align: center;
    font-size: 0.9rem;
    color: $color-text-muted;
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__error {
    color: $color-accent;
    font-size: 0.875rem;
  }
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
    transition: border-color 0.15s;

    &:focus {
      border-color: $color-accent;
    }
  }
}

.btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: $color-accent;
    color: $color-white;
  }
}
</style>
