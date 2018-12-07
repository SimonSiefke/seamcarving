
<template>
  <div
    v-show="loading"
    class="basic-loading-spinner">
    <svg
      id="loader-1"
      version="1.1"
      x="0px"
      y="0px"
      width="60px"
      height="60px"
      viewBox="0 0 50 50">
      <path
        fill="#000"
        d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">
        <animateTransform
          attributeType="xml"
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="0.6s"
          repeatCount="indefinite" />
      </path>
    </svg>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator"

@Component
export default class BasicLoadingSpinner extends Vue {
  /*********
   * Props *
   *********/
  @Prop({ type: Boolean, required: true })
  private loading!: boolean
}
</script>

<style lang="stylus" scoped>

.basic-loading-spinner
  display inline-block
  height 100px
  margin 0 0 2em
  margin 0 auto 1em
  padding 1em
  text-align center
  vertical-align top
  width 20%

svg path, svg rect
  fill var(--theme-color)
</style>
