<template>
  <div id="app">
    <seam-carving />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator"
import SeamCarving from "@/components/SeamCarving.vue"

@Component({
  components: {
    SeamCarving
  }
})
export default class App extends Vue {}
</script>
<style lang="stylus">
body
  background black
  margin 0
</style>
