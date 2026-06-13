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
        <button class="btn btn--ghost" @click="handleSignOut">Sign Out</button>
      </div>
    </header>

    <section class="page-items__summary">
      <div class="summary-card">
        <span class="summary-card__label">Total Collection Value</span>
        <span class="summary-card__value"
          >${{ totalValue.toLocaleString() }}</span
        >
      </div>
      <div class="summary-card">
        <span class="summary-card__label">Items</span>
        <span class="summary-card__value">{{ items.length }}</span>
      </div>
    </section>

    <section class="page-items__gallery">
      <LoadingSpinner v-if="loading" />
      <p v-else-if="!items.length" class="page-items__empty">
        No items yet — add your first piece of gear.
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
  </main>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'IndexPage',

  data() {
    return {
      showAddItem: false,
    }
  },

  computed: {
    ...mapState('items', ['items', 'loading']),
    ...mapState('users', ['currentUser']),
    ...mapGetters('items', ['totalValue']),
  },

  async created() {
    await this.$store.dispatch('items/fetchItems')
  },

  methods: {
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
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
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
