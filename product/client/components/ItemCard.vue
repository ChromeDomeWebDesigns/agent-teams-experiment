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
      <p class="item-card__name">{{ item.make }} {{ item.model }}</p>
      <p v-if="item.serial" class="item-card__meta">S/N: {{ item.serial }}</p>
      <p v-if="item.condition" class="item-card__meta">
        Condition: {{ item.condition }}
      </p>
      <p v-if="item.currentValue" class="item-card__value">
        ${{ Number(item.currentValue).toLocaleString() }}
      </p>
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

  &__name {
    font-weight: 700;
    font-size: 1rem;
    color: $color-primary;
  }

  &__meta {
    font-size: 0.8rem;
    color: $color-text-muted;
  }

  &__value {
    margin-top: auto;
    font-size: 1.1rem;
    font-weight: 700;
    color: $color-accent;
  }
}
</style>
