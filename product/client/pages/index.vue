<template>
  <main class="page-items">
    <header class="page-items__header">
      <div class="page-items__brand">
        <h1 class="page-items__title">Vault</h1>
        <p class="page-items__email">{{ currentUser && currentUser.email }}</p>
      </div>
      <div class="page-items__actions">
        <button class="btn btn--primary" @click="showAddItem = true">
          + Add Item
        </button>
        <button class="btn btn--ghost" @click="showLogSale = true">
          + Log a Sale
        </button>
        <nuxt-link to="/deal-check" class="btn btn--ghost">
          Deal Check
        </nuxt-link>
        <button
          class="btn btn--ghost"
          :disabled="!items.length"
          @click="handleExport"
        >
          Export
        </button>
        <button class="btn btn--ghost" @click="handleSignOut">Sign Out</button>
      </div>
    </header>

    <section class="page-items__summary">
      <div class="summary-card">
        <span class="summary-card__label">Market Value (comp-backed)</span>
        <span class="summary-card__value"
          >${{ totalValue.toLocaleString() }}</span
        >
        <span class="summary-card__sub">{{ valuationSubLabel }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-card__label">Items</span>
        <span class="summary-card__value">{{ items.length }}</span>
      </div>
    </section>

    <section class="page-items__gallery">
      <LoadingSpinner v-if="loading" />
      <p v-else-if="!items.length" class="page-items__empty">
        No items yet — add your first camera or lens.
      </p>
      <div v-else class="item-grid">
        <ItemCard v-for="item in items" :key="item.id" :item="item" />
      </div>
    </section>

    <AddItemModal
      v-if="showAddItem"
      @close="showAddItem = false"
      @saved="showAddItem = false"
    />

    <LogSaleModal v-if="showLogSale" @close="showLogSale = false" />
  </main>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'IndexPage',

  data() {
    return {
      showAddItem: false,
      showLogSale: false,
    }
  },

  computed: {
    ...mapState('items', ['items', 'loading']),
    ...mapState('users', ['currentUser']),
    ...mapGetters('items', ['totalValue']),

    valuationSubLabel() {
      const total = this.items.length
      if (total === 0) return 'Estimated from recent sales'
      const valued = this.items.filter((item) => {
        const eff =
          item.userOverrideValue != null
            ? item.userOverrideValue
            : item.estimatedValue?.estimate ?? null
        return eff != null
      }).length
      const awaiting = total - valued
      if (awaiting === 0) {
        return `Estimated from recent sales · ${valued} item${
          valued === 1 ? '' : 's'
        } valued`
      }
      return `${valued} of ${total} items valued · ${awaiting} awaiting data`
    },
  },

  async created() {
    await this.$store.dispatch('items/fetchItems')
  },

  methods: {
    async handleExport() {
      try {
        await this.$store.dispatch('items/exportInsurance')
      } catch (_err) {
        // error already logged in store action
      }
    },

    async handleSignOut() {
      await this.$store.dispatch('users/signOut')
      this.$router.push('/login')
    },
  },
}
</script>

<style lang="scss" scoped>
.page-items {
  max-width: 1100px;
  margin: 0 auto;
  padding: $spacing-lg $spacing-md;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-bottom: $spacing-xl;
  }

  &__brand {
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-size: 1.75rem;
    font-weight: 700;
    color: $color-primary;
  }

  &__email {
    font-size: 0.875rem;
    color: $color-text-muted;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  &__summary {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
  }

  &__gallery {
    min-height: 200px;
  }

  &__empty {
    color: $color-text-muted;
    text-align: center;
    padding: $spacing-xxl 0;
  }
}

.summary-card {
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: $border-radius;
  padding: $spacing-md $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &__label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $color-text-muted;
  }

  &__value {
    font-size: 1.5rem;
    font-weight: 700;
    color: $color-primary;
  }

  &__sub {
    font-size: 0.75rem;
    color: $color-text-muted;
  }
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: $spacing-md;
}

.btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
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
