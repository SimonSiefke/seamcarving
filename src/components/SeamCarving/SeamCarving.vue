<template>
  <section :class="{'image-loaded': imageLoaded}">
    <canvas ref="canvas" />
    <small v-if="!imageHasBeenUploaded">Photo by <a href="https://unsplash.com/photos/_d0zgyMmYT8?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"> Vincent van Zalinge </a> on <a href="https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash </a> </small>
    <BasicLoadingSpinner :loading="loading" />
    <input
      ref="input"
      type="file"
      accept="image/*">
  </section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator"
import * as dat from "dat.gui"
import { Action } from "./action"
import { rotateImageData } from "@/lib/util"
import BasicLoadingSpinner from "@/components/BasicLoadingSpinner.vue"

@Component({
  components: {
    BasicLoadingSpinner
  }
})
export default class SeamCarving extends Vue {
  /********
   * Data *
   ********/
  // @ts-ignore
  private worker = new Worker("./worker.ts", { type: "module" }) // the webworker that does the heavy lifting off the mainthread
  private currentAction: Action | null = null // the action that is currently being performed (e.g. removing 136px)
  private currentHeight_ = 100 // the height of the transformed image
  private currentWidth_ = 100 // the width of the transformed image
  private executionInterrupted = false // whether the execution of the current action was interrupted by another action (used to apply only the latest user action instead of queueing them up)
  private image = new Image() // the image for which to apply the transformations
  private imageLoaded = false // whether the image has been fully loaded or not
  private imagePath = "/assets/bird.jpg" // the path of the current image
  private imageHasBeenUploaded = false
  private rotated_ = true // vertical (default) or horizontal mode
  private gui: any // framework for the control box
  private originalImageData: ImageData | null = null // the data or the image without any transformations applied
  private wantedHeight = 100 // the height specified by the user
  private wantedWidth = 100 // the width specified by the user

  /************
   * Computed *
   ************/
  get loading() {
    return this.currentAction != null
  }
  get maxWidth() {
    if (this.originalImageData !== null) {
      return Math.round(this.originalImageData.width * 1.5)
    }
    return 0
  }

  get maxHeight() {
    if (this.originalImageData !== null) {
      return Math.round(this.originalImageData.height * 1.5)
    }
    return 0
  }

  get currentWidth() {
    return this.currentWidth_
  }

  set currentWidth(value: number) {
    this.currentWidth_ = value
    this.$refs.canvas && (this.$refs.canvas.width = value)
  }

  get currentHeight() {
    return this.currentHeight_
  }

  set currentHeight(value: number) {
    this.currentHeight_ = value
    this.$refs.canvas && (this.$refs.canvas.height = value)
  }

  /************
   * Watchers *
   ************/
  @Watch("wantedWidth")
  private async adjustWantedWidth(value: number) {
    if (
      !this.originalImageData ||
      value === this.originalImageData.width ||
      value < 10
    ) {
      return
    }
    await this.setRotation(false)
    const numberOfAdditions = value - this.originalImageData.width
    if (numberOfAdditions > 0) {
      this.currentAction = {
        type: "ADD_SEAMS",
        payload: {
          numberOfSeams: numberOfAdditions
        }
      }
    } else if (numberOfAdditions < 0) {
      this.currentAction = {
        type: "REMOVE_SEAMS",
        payload: {
          numberOfSeams: numberOfAdditions
        }
      }
    }
  }

  @Watch("wantedHeight")
  private async adjustWantedHeight(value: number) {
    if (
      !this.originalImageData ||
      value === this.originalImageData.height ||
      value < 10
    ) {
      return
    }
    await this.setRotation(true)
    const numberOfAdditions = value - this.originalImageData.height
    if (numberOfAdditions > 0) {
      this.currentAction = {
        type: "ADD_SEAMS",
        payload: {
          numberOfSeams: numberOfAdditions
        }
      }
    } else if (numberOfAdditions < 0) {
      this.currentAction = {
        type: "REMOVE_SEAMS",
        payload: {
          numberOfSeams: numberOfAdditions
        }
      }
    }
  }

  @Watch("currentAction")
  private async executePendingActions(newValue: Action, oldValue: Action) {
    if (oldValue && newValue) {
      this.executionInterrupted = true
      return
    }
    if (newValue) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        this.executionInterrupted = false
        const applyResult = await this.applyAction(this.currentAction as Action)
        applyResult()
        if (!this.executionInterrupted) {
          this.currentAction = null
          break
        }
      }
    }
  }

  @Watch("imageLoaded")
  private async showGUI(value: boolean) {
    if (value) {
      ;(document.querySelector(".dg.ac") as HTMLDivElement).style.visibility =
        "visible"
    }
  }

  /************
   * Mounted *
   ************/
  async mounted() {
    this.gui = new dat.GUI()
    this.gui.add(this, "wantedWidth", 10, this.maxWidth, 1).name("Width")
    this.gui.add(this, "wantedHeight", 10, this.maxHeight, 1).name("Height")
    this.gui.add(this, "uploadImage").name("Upload Image")
    this.gui.add(this, "reset").name("Reset")
    this.gui.add(
      {
        Github: () => {
          this.openInNewTab("https://github.com/SimonSiefke/seamcarving")
        }
      },
      "Github"
    )
    const imageLoadedPromise = new Promise(resolve => {
      this.image.addEventListener("load", () => {
        this.image.setAttribute("width", `${this.image.naturalWidth}`)
        this.image.setAttribute("height", `${this.image.naturalHeight}`)
        resolve()
      })
    })
    this.image.setAttribute("src", this.imagePath)
    await imageLoadedPromise
    await this.onImageChanged()
  }

  /******************
   * Before Destroy *
   ******************/
  beforeDestroy() {
    this.gui.destroy()
  }

  /************
   * Methods *
   ************/
  private updateGUI() {
    for (var i in this.gui.__controllers) {
      const controller = this.gui.__controllers[i]
      switch (controller.property) {
        case "wantedWidth":
          controller.__max = this.maxWidth
          break
        case "wantedHeight":
          controller.__max = this.maxHeight
          break
        default:
          break
      }
      this.gui.__controllers[i].updateDisplay()
    }
  }

  private async uploadImage() {
    return new Promise(resolve => {
      const input = this.$refs.input
      const image = this.image

      input.addEventListener("change", () => {
        const file = (input.files as any)[0]
        this.imagePath = file.name
        this.updateGUI()
        const url = URL.createObjectURL(file)
        image.addEventListener("load", () => {
          image.setAttribute("width", `${image.naturalWidth}`)
          image.setAttribute("height", `${image.naturalHeight}`)
          this.onImageChanged()
          resolve()
        })
        image.setAttribute("src", url)
        this.imageHasBeenUploaded = true
      })
      input.click()
    })
  }

  private async onImageChanged() {
    this.currentAction = null
    this.worker.terminate()
    const canvas = this.$refs.canvas
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const image = this.image
    const width = image.naturalWidth
    const height = image.naturalHeight
    this.currentWidth = width
    this.currentHeight = height
    this.wantedWidth = width
    this.wantedHeight = height
    ctx.drawImage(image, 0, 0)
    this.originalImageData = ctx.getImageData(0, 0, width, height)
    this.updateGUI()
    this.imageLoaded = true
    // @ts-ignore
    this.worker = new Worker("./worker.ts", { type: "module" })
    const buffer = this.originalImageData.data.slice().buffer
    ;(await this.applyAction({
      type: "INITIALIZE",
      payload: {
        width,
        height,
        buffer
      }
    }))()
  }

  private async applyAction(action: Action) {
    const { type, payload } = action
    const rotated = this.rotated_

    return new Promise<() => void>(resolve => {
      const ctx = this.$refs.canvas.getContext("2d") as CanvasRenderingContext2D

      this.worker.onmessage = (event: any) => {
        resolve(() => {
          const action = event.data.action
          const data = event.data.data
          if (rotated) {
            if (data.width && data.height) {
              const width = data.width
              const height = data.height
              data.width = height
              data.height = width
              if (data.buffer) {
                const array = new Uint8ClampedArray(data.buffer)
                const newArray = rotateImageData({
                  data: array,
                  width,
                  height
                })
                const newBuffer = newArray.data.buffer
                data.buffer = newBuffer
              }
            }
          }

          if (data.width && data.height && data.buffer) {
            const newImageData = new ImageData(
              new Uint8ClampedArray(data.buffer),
              data.width,
              data.height
            )
            this.currentWidth = data.width
            this.currentHeight = data.height
            ctx.putImageData(newImageData, 0, 0)
          }
        })
      }

      if (rotated) {
        if (payload) {
          if (payload.width && payload.height) {
            const width = payload.width
            const height = payload.height
            payload.width = height
            payload.height = width
            if (payload.buffer) {
              const array = new Uint8ClampedArray(payload.buffer)
              const newArray = rotateImageData({ data: array, width, height })
              const newBuffer = newArray.data.buffer
              payload.buffer = newBuffer
            }
          }
        }
      }

      this.worker.postMessage(
        {
          action: type,
          data: payload || {}
        },
        payload && payload.buffer ? [payload.buffer] : []
      )
    })
  }

  private async reset() {
    await this.onImageChanged()
  }

  private async setRotation(value: boolean) {
    if (this.originalImageData && value !== this.rotated_) {
      this.rotated_ = value
      if (value) {
        this.wantedWidth = this.originalImageData.width
      } else {
        this.wantedHeight = this.originalImageData.height
      }
      this.updateGUI()
      const buffer = this.originalImageData.data.slice().buffer
      const { width, height } = this.originalImageData
      ;(await this.applyAction({
        type: "INITIALIZE",
        payload: {
          width,
          height,
          buffer
        }
      }))()
    }
  }

  private openInNewTab(url: string) {
    ;(window.open(url, "_blank") as Window).focus()
  }

  /********
   * Refs *
   ********/
  $refs!: {
    canvas: HTMLCanvasElement
    input: HTMLInputElement
  }
}
</script>

<style  lang="stylus">
section
  align-items center
  display flex
  flex-direction column
  height 100vh
  justify-content center
  opacity 1
  transition opacity 0.5s

  &:not(.image-loaded)
    opacity 0

canvas
  align-self center
  background white
  display block
  height auto
  max-height 70vh
  max-width 100%

small
  color white
  font-family Arial, sans-serif
  margin-top 0.3rem

  a
    color var(--theme-color)
    text-decoration none

input[type='file']
  display none

.basic-loading-spinner
  left 50%
  position absolute
  top 50%
  transform translate(-50%, -50%)

// dat gui
.dg.ac
  visibility hidden
</style>
