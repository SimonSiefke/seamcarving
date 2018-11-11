<template>
  <section>
    <canvas ref="canvas" />
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import * as dat from "dat.gui";

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
  worker = new Worker("./worker.ts", { type: "module" });
  private currentWidth_ = 100;
  private currentHeight_ = 100;
  private wantedWidth = 100;
  private wantedHeight = 100;
  private originalImageData: ImageData | null = null;
  private currentAction: Action | null = null;
  private executionInterrupted = false;
  private gui: any;
  private image = new Image();

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
    return this.currentWidth_;
  }

  set currentWidth(value: number) {
    this.currentWidth_ = value;
    this.$refs.canvas && (this.$refs.canvas.width = value);
  }

  get currentHeight() {
    return this.currentHeight_;
  }

  set currentHeight(value: number) {
    this.currentHeight_ = value;
    this.$refs.canvas && (this.$refs.canvas.height = value);
  }

  /************
   * Watchers *
   ************/
  @Watch("wantedWidth")
  private async adjustWantedWidth(value: number) {
    if (!this.originalImageData || value === this.originalImageData.width) {
      return;
    }
    const numberOfAdditions = value - this.currentWidth;
    if (numberOfAdditions > 0) {
      this.currentAction = {
        type: "ADD_SEAMS",
        numberOfSeams: numberOfAdditions
      };
    } else if (numberOfAdditions < 0) {
      // this.currentAction = {
      //   type: "REMOVE_SEAMS",
      //   numberOfSeams: numberOfAdditions
      // };
      // this.currentAction = {
      //   type: "SHOW_SEAMS",
      //   numberOfSeams: numberOfAdditions
      // };
      const action: Action = {
        type: "REMOVE_SEAMS",
        numberOfSeams: numberOfAdditions
      };
      (await this.applyAction(action))();
    } else {
      this.reset();
    }
  }
  @Watch("currentAction")
  private async executePendingActions(newValue: Action, oldValue: Action) {
    if (oldValue && newValue) {
      this.executionInterrupted = true;
      return;
    }
    if (newValue) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        this.executionInterrupted = false;
        const applyResult = await this.applyAction(this
          .currentAction as Action);
        applyResult();
        if (!this.executionInterrupted) {
          this.currentAction = null;
          break;
        }
      }
    }
  }

  /************
   * Mounted *
   ************/
  async mounted() {
    this.gui = new dat.GUI();
    this.gui.add(this, "wantedWidth", 10, this.maxWidth, 1).name("width");
    this.gui.add(this, "wantedHeight", 10, this.maxHeight, 1).name("height");
    this.gui.add(this, "reset");

    const imageLoaded = new Promise(resolve => {
      this.image.addEventListener("load", () => {
        this.image.setAttribute("width", `${this.image.naturalWidth}`);
        this.image.setAttribute("height", `${this.image.naturalHeight}`);
        resolve();
      });
    });
    this.image.setAttribute("src", "/assets/animal.png");
    await imageLoaded;
    await this.onImageChanged();
    const randomPoint = () => Math.floor(Math.random() * 500) + 100;
    let point = randomPoint();
    let current = this.currentWidth;
    // while (true) {
    //   await new Promise(resolve => setTimeout(resolve, 100));
    //   if (current > point) {
    //     current--;
    //   } else if (current < point) {
    //     current++;
    //   } else {
    //     console.log("else");
    //     point = randomPoint();
    //   }
    //   console.log(point, current);
    //   this.wantedWidth = current;
    // }
  }

  /******************
   * Before Destroy *
   ******************/
  beforeDestroy() {
    this.gui.destroy();
  }

  /************
   * Methods *
   ************/
  private updateGUI() {
    for (var i in this.gui.__controllers) {
      const controller = this.gui.__controllers[i];
      switch (controller.property) {
        case "wantedWidth":
          controller.__max = this.maxWidth;
          break;
        case "wantedHeight":
          controller.__max = this.maxHeight;
          break;
        default:
          break;
      }
      this.gui.__controllers[i].updateDisplay();
    }
  }

  private async upload(event: Event) {
    return new Promise(resolve => {
      const image = this.image;
      const file = (event.target as any).files[0] as File;
      const url = URL.createObjectURL(file);
      image.addEventListener("load", () => {
        // console.log(image.naturalWidth);
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
    const image = this.image;
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    this.currentWidth = width;
    this.currentHeight = height;
    this.wantedWidth = width;
    this.wantedHeight = height;
    ctx.drawImage(image, 0, 0);
    this.originalImageData = ctx.getImageData(0, 0, width, height);
    this.updateGUI();
  }

  private async applyAction(action: Action) {
    const { type, numberOfSeams } = action;
    return new Promise<() => void>(resolve => {
      const width = this.currentWidth;
      const height = this.currentHeight;
      const ctx = this.$refs.canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      const imageData = ctx.getImageData(0, 0, width, height);

      this.worker.onmessage = (event: any) => {
        resolve(() => {
          const action = event.data.action;
          const data = event.data.data;
          const buffer = data.buffer;

          const newImageData = new ImageData(
            new Uint8ClampedArray(buffer),
            data.width,
            data.height
          );
          this.currentWidth = data.width;
          this.currentHeight = data.height;
          ctx.putImageData(newImageData, 0, 0);
        });
      };

      this.worker.postMessage(
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
      this.updateGUI();
    }
  }

  /********
   * Refs *
   ********/
  $refs!: {
    canvas: HTMLCanvasElement;
  };
}
</script>

<style scoped lang="stylus">
section
  align-items center
  display flex
  height 100vh
  justify-content center

canvas
  align-self center
  display block
  height auto
  max-height 70vh
  max-width 100%
</style>
