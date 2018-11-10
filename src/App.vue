<template>
  <div id="app">
    <seam-carving />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import SeamCarving from "@/components/SeamCarving.vue";

@Component({
  components: {
    SeamCarving
  }
})
export default class App extends Vue {}
</script>
<style lang="stylus">
:root
  --theme-color orange

*::-moz-focus-inner
  border none

body
  color var(--theme-color)
  font-family 'Permanent Marker', cursive, 'Times New Roman', Times, serif
  margin 0
</style>
