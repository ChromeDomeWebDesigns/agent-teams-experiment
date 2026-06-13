<template>
  <div class="valuation-badge" :class="{ 'valuation-badge--compact': compact }">
    <!-- User override state -->
    <template v-if="override != null">
      <p class="valuation-badge__estimate">
        ${{
          Number(override).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })
        }}
      </p>
      <p class="valuation-badge__sublabel valuation-badge__sublabel--override">
        (your estimate)
      </p>
    </template>

    <!-- No-data state -->
    <template v-else-if="estimate == null || sampleSize === 0">
      <p class="valuation-badge__no-data">No estimate yet</p>
    </template>

    <!-- Low-confidence state (sampleSize 1–2) -->
    <template v-else-if="sampleSize < 3">
      <p class="valuation-badge__estimate">
        ~&nbsp;${{ fmtPrice(estimate) }}
        <span class="valuation-badge__warn" aria-label="Warning: limited data">
          &#9888; limited data
        </span>
      </p>
      <p v-if="!compact" class="valuation-badge__range">
        ${{ fmtPrice(low) }}&nbsp;&ndash;&nbsp;${{
          fmtPrice(high)
        }}
        &nbsp;&middot;&nbsp;{{ sampleSize }} sale{{
          sampleSize === 1 ? '' : 's'
        }}
      </p>
      <p v-if="compact" class="valuation-badge__range">
        ${{ fmtPrice(low) }}&nbsp;&ndash;&nbsp;${{
          fmtPrice(high)
        }}&nbsp;&middot;&nbsp;{{ sampleSize }} sale{{
          sampleSize === 1 ? '' : 's'
        }}
      </p>
    </template>

    <!-- Normal state (sampleSize >= 3) -->
    <template v-else>
      <p class="valuation-badge__estimate">~&nbsp;${{ fmtPrice(estimate) }}</p>
      <p class="valuation-badge__range">
        ${{ fmtPrice(low) }}&nbsp;&ndash;&nbsp;${{
          fmtPrice(high)
        }}
        &nbsp;&middot;&nbsp;{{ sampleSize }} sales
      </p>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ValuationBadge',

  props: {
    estimate: { type: Number, default: null },
    low: { type: Number, default: null },
    high: { type: Number, default: null },
    sampleSize: { type: Number, default: 0 },
    override: { type: Number, default: null },
    compact: { type: Boolean, default: false },
  },

  methods: {
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
.valuation-badge {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__estimate {
    font-size: 1.1rem;
    font-weight: 700;
    color: $color-accent;
    margin: 0;
  }

  &__range {
    font-size: 0.75rem;
    color: $color-text-muted;
    margin: 0;
  }

  &__warn {
    font-size: 0.75rem;
    font-weight: 600;
    color: $color-at-market;
    margin-left: 4px;
  }

  &__no-data {
    font-size: 0.875rem;
    color: $color-text-muted;
    margin: 0;
    font-style: italic;
  }

  &__sublabel {
    font-size: 0.75rem;
    color: $color-text-muted;
    margin: 0;

    &--override {
      font-style: italic;
    }
  }
}
</style>
