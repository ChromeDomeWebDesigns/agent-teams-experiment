<template>
  <article class="item-card">
    <div class="item-card__photo">
      <img
        v-if="item.photoPath"
        :src="item.photoPath"
        :alt="`${item.make} ${item.model}`"
        class="item-card__img"
      />
      <div v-else class="item-card__photo-placeholder">
        <span>No Photo</span>
      </div>
    </div>

    <div class="item-card__body">
      <div class="item-card__header-row">
        <p class="item-card__name">{{ item.make }} {{ item.model }}</p>
        <span v-if="item.condition" class="condition-pill">{{
          item.condition
        }}</span>
      </div>
      <p v-if="item.serial" class="item-card__meta">S/N: {{ item.serial }}</p>

      <div class="item-card__valuation">
        <ValuationBadge
          :estimate="item.estimatedValue ? item.estimatedValue.estimate : null"
          :low="item.estimatedValue ? item.estimatedValue.low : null"
          :high="item.estimatedValue ? item.estimatedValue.high : null"
          :sample-size="
            item.estimatedValue ? item.estimatedValue.sampleSize : 0
          "
          :override="
            item.userOverrideValue != null ? item.userOverrideValue : null
          "
          :compact="true"
        />
      </div>

      <div class="item-card__refresh">
        <button
          class="btn btn--ghost btn--sm"
          :disabled="refreshing"
          type="button"
          @click="handleRefresh"
        >
          <span v-if="refreshing" class="loading-spinner loading-spinner--sm" />
          <span v-else>Refresh estimate</span>
        </button>
        <span v-if="refreshError" class="item-card__refresh-error">{{
          refreshError
        }}</span>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  name: 'ItemCard',

  props: {
    item: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      refreshing: false,
      refreshError: null,
    }
  },

  methods: {
    async handleRefresh() {
      this.refreshing = true
      this.refreshError = null
      try {
        await this.$store.dispatch('items/refreshEstimate', this.item.id)
      } catch (_err) {
        this.refreshError = 'Could not refresh — try again.'
      } finally {
        this.refreshing = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.item-card {
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: $border-radius;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__photo {
    width: 100%;
    aspect-ratio: 4 / 3;
    background: $color-bg;
    overflow: hidden;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-text-muted;
    font-size: 0.875rem;
  }

  &__body {
    padding: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    flex: 1;
  }

  &__header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-xs;
  }

  &__name {
    font-weight: 700;
    font-size: 1rem;
    color: $color-primary;
    margin: 0;
  }

  &__meta {
    font-size: 0.8rem;
    color: $color-text-muted;
    margin: 0;
  }

  &__valuation {
    margin-top: $spacing-xs;
  }

  &__refresh {
    margin-top: $spacing-sm;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__refresh-error {
    font-size: 0.75rem;
    color: $color-accent;
  }
}

.condition-pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 99px;
  background: $color-bg;
  border: 1px solid $color-border;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
}

.btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--ghost {
    background: transparent;
    color: $color-text-muted;
    border: 1px solid $color-border;
  }

  &--sm {
    padding: 4px $spacing-sm;
    font-size: 0.75rem;
    height: auto;
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

  &--sm {
    width: 10px;
    height: 10px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
