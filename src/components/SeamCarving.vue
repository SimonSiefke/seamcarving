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
          :step="1"
          :min="1"
          :max="maxWidth"
          :value-max="wantedWidth"
          single-slider
          @updateValues="wantedWidth=$event.target.valueMax" />
      </div>

      <div class="item">
        <label>Height</label>
        <paper-range-slider
          :step="1"
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

@Component
export default class SeamCarving extends Vue {
  /********
   * Data *
   ********/
  // @ts-ignore
  worker = new Worker("./worker.ts", { type: "module" });
  // private cache: { [key: string]: Uint8ClampedArray } = {};
  private currentWidth = 100;
  private currentHeight = 100;
  private wantedWidth = 100;
  private wantedHeight = 100;
  private originalImageData: ImageData | null = null;
  private shouldStop = false;
  private hasStopped = true;
  private operationInProgress = false;

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

  /************
   * Watchers *
   ************/
  @Watch("wantedWidth")
  private async adjustWidth(value: number) {
    if (value === this.currentWidth) {
      return;
    }
    this.hasStopped = false;
    const numberOfRemovals = this.currentWidth - value;
    const numberOfAdditions = -numberOfRemovals;
    for (let i = 0; i < numberOfRemovals; i++) {
      if (this.shouldStop) {
        this.hasStopped = true;
        return;
      }
      await this.removeSeam();
    }
    for (let i = 0; i < numberOfAdditions; i++) {
      if (this.shouldStop) {
        this.hasStopped = true;
        return;
      }
      await this.addSeam();
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
    // for (let i = 0; i < 400; i++) {
    //   await this.removeSeam();
    // }
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
    canvas.width = width;
    canvas.height = height;
    this.wantedWidth = width;
    this.wantedHeight = height;
    this.currentWidth = width;
    this.currentHeight = height;
    ctx.drawImage(image, 0, 0);
    this.originalImageData = ctx.getImageData(0, 0, width, height);
  }

  private async addSeam() {
    if (this.operationInProgress) {
      return;
    }
    this.operationInProgress = true;
    return new Promise(resolve => {
      const width = this.$refs.canvas.width;
      const height = this.$refs.canvas.height;

      const newWidth = width + 1;

      // if (this.cache[`w${width - 1}h${height}`]) {
      //   // console.log("from cache 😏");
      //   return this.cache[`w${width - 1}h${height}`];
      // }
      // console.log("not in cache 😠");
      const ctx = this.$refs.canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      const imageData = ctx.getImageData(0, 0, width, height);

      this.worker.onmessage = (event: any) => {
        if (this.shouldStop) {
          this.hasStopped = true;
          return;
        }
        const action = event.data.action;
        const data = event.data.data;
        const buffer = data.buffer;

        const newImageData = new ImageData(
          new Uint8ClampedArray(buffer),
          newWidth,
          height
        );
        this.$refs.canvas.width = newWidth;
        this.currentWidth = newWidth;
        ctx.putImageData(newImageData, 0, 0);
        this.operationInProgress = false;
        resolve();
      };

      this.worker.postMessage(
        {
          action: "ADD_SEAM",
          data: {
            width,
            height,
            buffer: imageData.data.buffer
          }
        },
        [imageData.data.buffer]
      );
    });
  }

  private async reset() {
    if (this.shouldStop) {
      return;
    }
    this.operationInProgress = true;
    this.shouldStop = true;
    const canvas = this.$refs.canvas;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (this.originalImageData !== null) {
      const originalWidth = this.originalImageData.width;
      const originalHeight = this.originalImageData.height;
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      this.wantedWidth = originalWidth;
      this.wantedHeight = originalHeight;
      this.currentWidth = originalWidth;
      this.currentHeight = originalHeight;
      ctx.putImageData(this.originalImageData, 0, 0);
    }
    while (!this.hasStopped) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    this.shouldStop = false;
    this.operationInProgress = false;
  }

  private async removeSeam() {
    if (this.operationInProgress) {
      return;
    }
    this.operationInProgress = true;
    return new Promise(resolve => {
      const width = this.$refs.canvas.width;
      const height = this.$refs.canvas.height;
      const newWidth = width - 1;

      // if (this.cache[`w${width - 1}h${height}`]) {
      //   // console.log("from cache 😏");
      //   return this.cache[`w${width - 1}h${height}`];
      // }
      // console.log("not in cache 😠");
      const ctx = this.$refs.canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      const imageData = ctx.getImageData(0, 0, width, height);

      this.worker.onmessage = (event: any) => {
        if (this.shouldStop) {
          this.hasStopped = true;
          return;
        }
        const action = event.data.action;
        const data = event.data.data;
        const buffer = data.buffer;

        const newImageData = new ImageData(
          new Uint8ClampedArray(buffer),
          newWidth,
          height
        );
        this.$refs.canvas.width = newWidth;
        this.currentWidth = newWidth;
        // this.cache[`w${width - 1}h${height}`] = newImageData.data;
        ctx.putImageData(newImageData, 0, 0);
        this.operationInProgress = false;
        resolve();
      };

      this.worker.postMessage(
        {
          action: "REMOVE_SEAM",
          data: {
            width,
            height,
            buffer: imageData.data.buffer
          }
        },
        [imageData.data.buffer]
      );
    });
  }

  private async seamCarve() {
    return new Promise(resolve => {
      const width = this.$refs.canvas.width;
      const height = this.$refs.canvas.height;
      const ctx = this.$refs.canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      const imageData = ctx.getImageData(0, 0, width, height);

      this.worker.onmessage = (event: any) => {
        const action = event.data.action;
        const data = event.data.data;
        const buffer = data.buffer;
        const cumulatedEnergyMatrix = new Float32Array(buffer);
        let max = -Infinity;
        for (let i = 0; i < cumulatedEnergyMatrix.length; i++) {
          max = Math.max(max, cumulatedEnergyMatrix[i]);
        }
        const visibleEnergyMatrix = new Uint8ClampedArray(
          Array.from(cumulatedEnergyMatrix)
            .map(x => Math.round((x / max) * 255))
            .flatMap(x => [x, x, x, 255])
        );

        ctx.putImageData(
          new ImageData(visibleEnergyMatrix, width, height),
          0,
          0
        );
        resolve();
      };
      this.worker.postMessage(
        {
          action: "COMPUTE_CUMULATED_ENERGY_MATRIX",
          data: {
            width,
            height,
            buffer: imageData.data.buffer
          }
        },
        [imageData.data.buffer]
      );
    });
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
