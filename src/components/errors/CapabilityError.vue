<script setup lang="ts">
import type { CapabilityError } from '@/core/rendering/capabilities';

interface Props {
  error: CapabilityError;
}

defineProps<Props>();
</script>

<template>
  <div class="capability-error">
    <div class="capability-error__container">
      <div class="capability-error__icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 class="capability-error__title">Graphics Not Available</h1>

      <p class="capability-error__message">
        {{ error.userMessage }}
      </p>

      <div class="capability-error__details">
        <span class="capability-error__code">Error Code: {{ error.code }}</span>
      </div>

      <div class="capability-error__suggestions">
        <h2 class="capability-error__suggestions-title">Suggestions</h2>
        <ul class="capability-error__suggestions-list">
          <li
            v-for="(suggestion, index) in error.suggestions"
            :key="index"
            class="capability-error__suggestion"
          >
            {{ suggestion }}
          </li>
        </ul>
      </div>

      <div class="capability-error__actions">
        <a
          href="https://get.webgl.org/"
          target="_blank"
          rel="noopener noreferrer"
          class="capability-error__link"
        >
          Check WebGL Support
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.capability-error {
  position: fixed;
  inset: 0;
  background-color: $color-black;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-lg;
  z-index: $z-modal;

  &__container {
    background-color: $color-black-panel;
    border: $panel-border-width solid $color-danger;
    border-radius: $radius-lcars-corner;
    padding: $space-xl;
    max-width: 600px;
    width: 100%;
    text-align: center;
  }

  &__icon {
    width: 80px;
    height: 80px;
    margin: 0 auto $space-lg;
    color: $color-danger;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__title {
    font-family: $font-display;
    font-size: $font-size-xxl;
    font-weight: $font-weight-bold;
    color: $color-danger;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 $space-md;
  }

  &__message {
    font-family: $font-body;
    font-size: $font-size-lg;
    color: $color-white;
    margin: 0 0 $space-lg;
    line-height: $line-height-relaxed;
  }

  &__details {
    margin-bottom: $space-lg;
  }

  &__code {
    font-family: $font-mono;
    font-size: $font-size-sm;
    color: $color-gray;
    background-color: $color-black-light;
    padding: $space-xs $space-sm;
    border-radius: $radius-sm;
  }

  &__suggestions {
    text-align: left;
    margin-bottom: $space-xl;
    background-color: $color-black-light;
    padding: $space-md;
    border-radius: $radius-md;
  }

  &__suggestions-title {
    font-family: $font-display;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: $color-gold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 $space-sm;
  }

  &__suggestions-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__suggestion {
    font-family: $font-body;
    font-size: $font-size-md;
    color: $color-gray-light;
    padding: $space-xs 0;
    padding-left: $space-md;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 6px;
      background-color: $color-gold;
      border-radius: 50%;
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: $space-md;
  }

  &__link {
    font-family: $font-display;
    font-size: $font-size-md;
    font-weight: $font-weight-bold;
    color: $color-black;
    background-color: $color-gold;
    padding: $space-sm $space-lg;
    border-radius: $radius-pill;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: background-color $transition-normal;

    &:hover {
      background-color: $color-gold-light;
    }

    &:active {
      background-color: $color-gold-dark;
    }
  }
}
</style>
