<template>
  <main class="page-index">
    <section class="hero">
      <h1 class="hero__title">Vault</h1>
      <p class="hero__sub">Catalog, value, and insure your collection.</p>
    </section>
  </main>
</template>

<script>
export default {
  name: 'IndexPage',
}
</script>

<style lang="scss" scoped>
.page-index {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: $spacing-xl;
}

.hero {
  text-align: center;

  &__title {
    font-size: 3rem;
    font-weight: 700;
    color: $color-primary;
    letter-spacing: -0.5px;
    margin-bottom: $spacing-md;
  }

  &__sub {
    font-size: 1.25rem;
    color: $color-text-muted;
  }
}
</style>
