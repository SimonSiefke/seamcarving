<template>
  <section>


    <div class="left">
      <img
        ref="image"
        src="@/assets/animal.png"
        alt="">

      <div class="item">
        <label>Width</label>
        <paper-range-slider
          step="1"
          :min="1"
          :max="maxWidth"
          :value-max="wantedWidth"
          single-slider
          @updateValues="wantedWidth=$event.target.valueMax" />
      </div>

      <div class="item">
        <label>Height</label>
        <paper-range-slider
          step="1"
          :min="1"
          :max="maxHeight"
          :value-max="wantedHeight"
          single-slider
          @updateValues="wantedHeight=$event.target.valueMax" />
      </div>

      <div class="buttons">
        <div class="button-wrapper">
          <button
            id="upload">Upload</button>
          <input
            type="file"
            accept="image/*"
            @input="upload">
        </div>
        <div class="button-wrapper">
          <button
            id="reset"
            type="reset"
            @click="reset">Reset</button>
        </div>
      </div>
    </div>

    <div class="right">
      <canvas ref="canvas" />
    </div>

    <header>
      <h1>Seam Carving</h1>
      <div class="organic" />
    </header>

  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
type ActionType =
  | "REMOVE_SEAMS"
  | "ADD_SEAMS"
  | "SHOW_SEAMS"
  | "SHOW_SMALL_SEAMS"
  | "REMOVE_SMALL_SEAMS";

interface Action {
  type: ActionType;
  numberOfSeams: number;
}

@Component
export default class SeamCarving extends Vue {
  /********
   * Data *
   ********/
  // @ts-ignore
  worker1 = new Worker("./worker.ts", { type: "module" });
  // @ts-ignore
  worker2 = new Worker("./worker.ts", { type: "module" });
  private wantedWidth_ = 100;
  private wantedHeight_ = 100;
  private originalImageData: ImageData | null = null;
  private pendingActions: Action[] = [];

  /************
   * Computed *
   ************/
  get maxWidth() {
    if (this.originalImageData !== null) {
      return this.originalImageData.width * 2;
    }
    return 0;
  }

  get maxHeight() {
    if (this.originalImageData !== null) {
      return this.originalImageData.height * 2;
    }
    return 0;
  }

  get currentWidth() {
    return this.$refs.canvas ? this.$refs.canvas.width : -1;
  }

  set currentWidth(value: number) {
    this.$refs.canvas && (this.$refs.canvas.width = value);
  }

  get currentHeight() {
    return this.$refs.canvas ? this.$refs.canvas.height : -1;
  }

  set currentHeight(value: number) {
    this.$refs.canvas && (this.$refs.canvas.height = value);
  }

  get wantedWidth() {
    return this.wantedWidth_;
  }

  set wantedWidth(value: number) {
    this.wantedWidth_ = Math.round(value);
  }

  get wantedHeight() {
    return this.wantedHeight_;
  }

  set wantedHeight(value: number) {
    this.wantedHeight_ = Math.round(value);
  }

  /************
   * Watchers *
   ************/
  @Watch("wantedWidth")
  private async adjustWantedWidth(value: number) {
    if (!this.originalImageData || value === this.originalImageData.width) {
      return;
    }
    const numberOfAdditions = value - this.originalImageData.width;
    if (numberOfAdditions > 0) {
      this.pendingActions.push({
        type: "ADD_SEAMS",
        numberOfSeams: numberOfAdditions
      });
    } else if (numberOfAdditions < 0) {
      this.pendingActions.push({
        type: "REMOVE_SEAMS",
        numberOfSeams: numberOfAdditions
      });
    }
    while (this.pendingActions.length > 0) {
      const action = this.pendingActions.pop() as Action;
      this.applyAction(action);
    }
  }

  /************
   * Mounted *
   ************/
  async mounted() {
    await new Promise(resolve => {
      this.$refs.image.addEventListener("load", resolve);
    });
    await this.onImageChanged();
    this.wantedWidth += 135;
  }

  /************
   * Methods *
   ************/
  private async upload(event: Event) {
    return new Promise(resolve => {
      const image = this.$refs.image;
      const file = (event.target as any).files[0] as File;
      const url = URL.createObjectURL(file);
      image.addEventListener("load", () => {
        image.setAttribute("width", `${image.naturalWidth}`);
        image.setAttribute("height", `${image.naturalHeight}`);
        this.onImageChanged();
        resolve();
      });
      image.setAttribute("src", url);
    });
  }

  private onImageChanged() {
    const canvas = this.$refs.canvas;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const image = this.$refs.image;
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    this.currentWidth = width;
    this.currentHeight = height;
    this.wantedWidth = width;
    this.wantedHeight = height;
    ctx.drawImage(image, 0, 0);
    this.originalImageData = ctx.getImageData(0, 0, width, height);
  }

  private async applyAction(action: Action) {
    const { type, numberOfSeams } = action;
    return new Promise(resolve => {
      const width = this.currentWidth;
      const height = this.currentHeight;
      const ctx = this.$refs.canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      const imageData = ctx.getImageData(0, 0, width, height);

      this.worker1.onmessage = (event: any) => {
        const action = event.data.action;
        const data = event.data.data;
        const buffer = data.buffer;

        const newImageData = new ImageData(
          new Uint8ClampedArray(buffer),
          data.width,
          data.height
        );
        this.currentWidth = data.width;
        ctx.putImageData(newImageData, 0, 0);
        resolve();
      };

      this.worker1.postMessage(
        {
          action: type,
          data: {
            width,
            height,
            buffer: imageData.data.buffer,
            numberOfSeams: Math.abs(numberOfSeams)
          }
        },
        [imageData.data.buffer]
      );
    });
  }

  private async reset() {
    const canvas = this.$refs.canvas;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (this.originalImageData !== null) {
      const originalWidth = this.originalImageData.width;
      const originalHeight = this.originalImageData.height;
      this.currentWidth = originalWidth;
      this.currentHeight = originalHeight;
      this.wantedWidth = originalWidth;
      this.wantedHeight = originalHeight;
      ctx.putImageData(this.originalImageData, 0, 0);
    }
  }

  /********
   * Refs *
   ********/
  $refs!: {
    canvas: HTMLCanvasElement;
    image: HTMLImageElement;
  };
}
</script>

<style scoped lang="stylus">
header
  grid-column span 2
  justify-self center !important
  margin-top 6rem
  position relative

h1
  font-size 2rem

section
  display grid
  grid-template-columns 1fr 1fr

  > *:nth-child(even)
    justify-self start

  > *:nth-child(odd)
    justify-self end

canvas, img
  display block
  height auto
  max-height 50vh
  max-width 100%

button
  background var(--theme-color)
  border none
  border-radius 0.2rem
  box-shadow 0 2px 5px rgba(0, 0, 0, 0.2)
  color white
  padding 0.3rem 0.4rem

.button-wrapper
  &:hover button
    box-shadow 0 3px 7px rgba(0, 0, 0, 0.2)

  &:active button
    box-shadow 0 2px 5px rgba(0, 0, 0, 0.2)

paper-range-slider
  --paper-range-slider-active-color var(--theme-color)
  --paper-range-slider-knob-color var(--theme-color)

label
  align-self start
  display block
  margin 0
  transform translate(1rem, 0.85rem)

section .left
  align-items center
  display flex
  flex-direction column

.item
  font-size 90%
  height 2.5rem
  max-width 200px
  width 100%

  &:nth-last-of-type(2)
    margin-bottom 1rem

.buttons
  display flex

.button-wrapper, button
  cursor pointer

.button-wrapper
  display inline-block
  overflow hidden
  padding 0 2px 7px 2px
  position relative

  input[type=file]
    cursor pointer
    height 100%
    left 0
    opacity 0
    position absolute
    top 0

#upload
  margin-right 0.3rem

#reset
  margin-left 0.3rem

.organic
  animation-duration 20s
  animation-iteration-count infinite
  animation-name organic
  border 3px solid var(--theme-color)
  border-radius 41% 59% 41% 59% / 43% 45% 55% 57%
  display block
  height 110%
  left -15%
  position absolute
  top 0
  width 130%
  z-index -1

@keyframes organic
  0%
    border-radius 41% 59% 41% 59% / 43% 45% 55% 57%

  33%
    border-radius 30% 70% 30% 70% / 32% 30% 70% 68%

  66%
    border-radius 70% 30% 70% 30% / 68% 70% 30% 32%

  100%
    border-radius 41% 59% 41% 59% / 43% 45% 55% 57%
</style>
