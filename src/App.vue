<template>
  <div id="app">
    <SeamCarving />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator"
import SeamCarving from "@/components/SeamCarving/SeamCarving.vue"

@Component({
  components: {
    SeamCarving
  }
})
export default class App extends Vue {}
</script>
<style lang="stylus">
:root
  --theme-color #44ABDA

body
  background black
  margin 0
</style>
