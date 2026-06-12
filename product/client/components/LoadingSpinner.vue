<template>
  <div class="loading-spinner" role="status" aria-label="Loading">
    <div class="loading-spinner__ring" />
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
}
</script>

<style lang="scss" scoped>
.loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__ring {
    width: 32px;
    height: 32px;
    border: 3px solid $color-border;
    border-top-color: $color-accent;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
