<template>
  <main class="page-deal-check">
    <header class="page-deal-check__header">
      <div class="page-deal-check__brand">
        <nuxt-link to="/" class="page-deal-check__back">
          &larr; Vault
        </nuxt-link>
      </div>
    </header>

    <section class="page-deal-check__content">
      <h1 class="page-deal-check__title">Deal Check</h1>
      <p class="page-deal-check__subtitle">Is this listing worth the price?</p>

      <form class="deal-form" @submit.prevent="handleCheck">
        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="dc-make">Make</label>
            <input
              id="dc-make"
              v-model="form.make"
              class="form-field__input"
              type="text"
              placeholder="e.g. Leica"
              required
            />
          </div>
          <div class="form-field">
            <label class="form-field__label" for="dc-model">Model</label>
            <input
              id="dc-model"
              v-model="form.model"
              class="form-field__input"
              type="text"
              placeholder="e.g. M3"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="form-field__label" for="dc-condition"
              >Condition</label
            >
            <select
              id="dc-condition"
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
            <label class="form-field__label" for="dc-asking">
              Asking Price (USD)
            </label>
            <input
              id="dc-asking"
              v-model="form.askingPrice"
              class="form-field__input"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 850"
              required
            />
          </div>
        </div>

        <p v-if="error" class="deal-form__error">{{ error }}</p>

        <div class="deal-form__actions">
          <button class="btn btn--primary" type="submit" :disabled="loading">
            <span v-if="loading" class="loading-spinner" aria-hidden="true" />
            <span v-else>Check Deal</span>
          </button>
        </div>
      </form>

      <!-- Verdict block -->
      <div v-if="result" class="verdict-block">
        <!-- Low-confidence banner -->
        <div
          v-if="result.sampleSize > 0 && result.sampleSize < 3"
          class="verdict-block__low-conf"
          role="alert"
        >
          <span aria-label="Warning:">&#9888;</span>
          Limited data &mdash; only {{ result.sampleSize }} sale{{
            result.sampleSize === 1 ? '' : 's'
          }}
          found for this model. Treat this as a rough guide only.
        </div>

        <!-- No-data state -->
        <div v-if="result.sampleSize === 0" class="verdict-block__no-data">
          <p>No sales data found for this model yet.</p>
          <p>
            Help build the dataset by
            <button class="btn-link" type="button" @click="showLogSale = true">
              logging a sale</button
            >.
          </p>
        </div>

        <!-- Verdict card (only when we have data) -->
        <div
          v-else
          class="verdict-card"
          :class="`verdict-card--${result.verdict}`"
        >
          <div class="verdict-card__badge">
            <span
              class="verdict-badge"
              :class="`verdict-badge--${result.verdict}`"
            >
              {{ verdictLabel }}
            </span>
          </div>

          <dl class="verdict-card__details">
            <div class="verdict-card__detail-row">
              <dt>Asking</dt>
              <dd>${{ fmtPrice(result.askingPrice) }}</dd>
            </div>
            <div class="verdict-card__detail-row">
              <dt>Estimate</dt>
              <dd>${{ fmtPrice(result.estimate) }}</dd>
            </div>
            <div class="verdict-card__detail-row">
              <dt>Range</dt>
              <dd>
                ${{ fmtPrice(result.low) }}&nbsp;&ndash;&nbsp;${{
                  fmtPrice(result.high)
                }}
              </dd>
            </div>
          </dl>

          <p class="verdict-card__description">{{ verdictDescription }}</p>

          <p class="verdict-card__sample">
            Based on {{ result.sampleSize }} recent sale{{
              result.sampleSize === 1 ? '' : 's'
            }}.
          </p>
        </div>

        <!-- Log a sale CTA -->
        <p class="verdict-block__log-cta">
          Know the actual sale price?
          <button class="btn-link" type="button" @click="showLogSale = true">
            Log a Sale &rarr;
          </button>
        </p>
      </div>
    </section>

    <LogSaleModal
      v-if="showLogSale"
      :prefill-make="form.make"
      :prefill-model="form.model"
      @close="showLogSale = false"
    />
  </main>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DealCheckPage',

  data() {
    return {
      form: {
        make: '',
        model: '',
        condition: '',
        askingPrice: '',
      },
      showLogSale: false,
    }
  },

  computed: {
    ...mapState('dealCheck', ['loading', 'result', 'error']),

    verdictLabel() {
      if (!this.result) return ''
      const labels = {
        under: 'UNDER MARKET',
        at: 'AT MARKET',
        over: 'OVER MARKET',
      }
      return labels[this.result.verdict] || ''
    },

    verdictDescription() {
      if (!this.result) return ''
      const asking = this.result.askingPrice
      const estimate = this.result.estimate
      if (!estimate) return ''
      const pct = Math.round(Math.abs((asking - estimate) / estimate) * 100)
      if (this.result.verdict === 'under') {
        return `This asking price is ${pct}% below the estimated market value.`
      }
      if (this.result.verdict === 'over') {
        return `This asking price is ${pct}% above the estimated market value. Proceed with caution.`
      }
      return 'Asking price is within the expected market range.'
    },
  },

  methods: {
    async handleCheck() {
      this.$store.commit('dealCheck/SET_ERROR', null)
      try {
        await this.$store.dispatch('dealCheck/check', {
          make: this.form.make,
          model: this.form.model,
          condition: this.form.condition,
          askingPrice: Number(this.form.askingPrice),
        })
      } catch (_err) {
        // error already set in store by the action
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
.page-deal-check {
  max-width: 700px;
  margin: 0 auto;
  padding: $spacing-lg $spacing-md;

  &__header {
    margin-bottom: $spacing-lg;
  }

  &__back {
    font-size: 0.875rem;
    color: $color-text-muted;
    text-decoration: none;

    &:hover {
      color: $color-primary;
    }
  }

  &__title {
    font-size: 1.75rem;
    font-weight: 700;
    color: $color-primary;
    margin: 0 0 $spacing-xs;
  }

  &__subtitle {
    font-size: 1rem;
    color: $color-text-muted;
    margin: 0 0 $spacing-lg;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }
}

.deal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: $border-radius;
  padding: $spacing-lg;

  &__error {
    color: $color-accent;
    font-size: 0.875rem;
    margin: 0;
  }

  &__actions {
    display: flex;
    justify-content: flex-start;
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

.verdict-block {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__low-conf {
    background: $color-low-conf-bg;
    color: $color-low-conf;
    border-left: 3px solid $color-at-market;
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius;
    font-size: 0.875rem;
  }

  &__no-data {
    background: $color-bg;
    border: 1px solid $color-border;
    border-radius: $border-radius;
    padding: $spacing-lg;
    font-size: 0.9rem;
    color: $color-text-muted;

    p {
      margin: 0 0 $spacing-xs;

      &:last-child {
        margin: 0;
      }
    }
  }

  &__log-cta {
    font-size: 0.875rem;
    color: $color-text-muted;
    margin: 0;
  }
}

.verdict-card {
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: $border-radius;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__badge {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    margin: 0;
  }

  &__detail-row {
    display: flex;
    gap: $spacing-md;
    font-size: 0.9rem;

    dt {
      color: $color-text-muted;
      min-width: 80px;
      font-weight: 600;
    }

    dd {
      color: $color-primary;
      margin: 0;
      font-weight: 700;
    }
  }

  &__description {
    font-size: 0.9rem;
    color: $color-text;
    margin: 0;
  }

  &__sample {
    font-size: 0.8rem;
    color: $color-text-muted;
    margin: 0;
  }
}

.verdict-badge {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
  font-weight: 700;
  font-size: 0.875rem;
  display: inline-block;

  &--under {
    background: lighten(#16a34a, 52%);
    color: $color-under-market;
    border: 1px solid lighten(#16a34a, 35%);
  }

  &--at {
    background: lighten(#d97706, 45%);
    color: $color-at-market;
    border: 1px solid lighten(#d97706, 25%);
  }

  &--over {
    background: lighten(#dc2626, 48%);
    color: $color-over-market;
    border: 1px solid lighten(#dc2626, 30%);
  }
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
  color: $color-accent;
  cursor: pointer;
  font-size: inherit;
  text-decoration: underline;

  &:hover {
    opacity: 0.8;
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
  gap: $spacing-xs;
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
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: $color-white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
