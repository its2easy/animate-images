export default class Render{
    #settings;
    #data;

    /** @type CanvasRenderingContext2D */
    #context;
    #image;

    constructor( {settings, data} ) {
        this.#settings = settings;
        this.#data = data;
        this.#context = this.#data.canvas.element.getContext("2d");
    }

    /**
     * @param {Number|HTMLImageElement} frameNumberOrImage - frame number or image object
     */
    drawFrame(frameNumberOrImage){
        //this.#context.imageSmoothingEnabled = false; // may reduce blurriness, but could make the image worse (resets to true  after resize)
        if (Number.isInteger(frameNumberOrImage)) {
            this.#image = this.#data.loadedImagesArray[frameNumberOrImage-1]
        } else {
            this.#image = frameNumberOrImage;
        }

        let sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight;
        if (this.#settings.fillMode === "cover") {
            ( {sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = this.#getDrawImageCoverProps() )
        } else if ( this.#settings.fillMode === "contain" ) {
            ( {sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = this.#getDrawImageContainProps() )
        }

        //console.log(`sx= ${sx}, sy=${sy}, sWidth=${sWidth}, sHeight=${sHeight}, dx=${dx}, dy=${dy}, dWidth=${dWidth}, dHeight=${dHeight}`);
        if ( this.#settings.onBeforeFrame ) this.#settings.onBeforeFrame(this.#context,
            { width: this.#data.canvas.element.width, height: this.#data.canvas.element.height });

        this.#context.drawImage(this.#image, sx, sy, sWidth, sHeight,  dx, dy, dWidth, dHeight);

        if ( this.#settings.onAfterFrame ) this.#settings.onAfterFrame(this.#context,
            { width: this.#data.canvas.element.width, height: this.#data.canvas.element.height });
    }

    clearCanvas(){
        this.#context.clearRect(0, 0, this.#data.canvas.element.width, this.#data.canvas.element.height);
    }

    #getDrawImageCoverProps(){
        //https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas
        let dx = 0,
            dy = 0,
            canvasWidth = this.#data.canvas.element.width,
            canvasHeight = this.#data.canvas.element.height,
            imageWidth = this.#image.naturalWidth,
            imageHeight = this.#image.naturalHeight,
            offsetX = 0.5,
            offsetY = 0.5,
            minRatio = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight),
            newWidth = imageWidth * minRatio,   // new prop. width
            newHeight = imageHeight * minRatio,   // new prop. height
            sx, sy, sWidth, sHeight, ar = 1;

        // decide which gap to fill
        if (newWidth < canvasWidth) ar = canvasWidth / newWidth;
        if (Math.abs(ar - 1) < 1e-14 && newHeight < canvasHeight) ar = canvasHeight / newHeight;  // updated
        newWidth *= ar;
        newHeight *= ar;

        // calc source rectangle
        sWidth = imageWidth / (newWidth / canvasWidth);
        sHeight = imageHeight / (newHeight / canvasHeight);

        sx = (imageWidth - sWidth) * offsetX;
        sy = (imageHeight - sHeight) * offsetY;

        // make sure source rectangle is valid
        if (sx < 0) sx = 0;
        if (sy < 0) sy = 0;
        if (sWidth > imageWidth) sWidth = imageWidth;
        if (sHeight > imageHeight) sHeight = imageHeight;

        return { sx, sy, sWidth, sHeight, dx, dy, dWidth: canvasWidth, dHeight: canvasHeight };
    }
    #getDrawImageContainProps(){
        let canvasWidth = this.#data.canvas.element.width,
            canvasHeight = this.#data.canvas.element.height,
            imageWidth = this.#image.naturalWidth,
            imageHeight = this.#image.naturalHeight,
            sx = 0,
            sy = 0,
            sWidth = imageWidth,
            sHeight = imageHeight,
            dx,
            dy,
            offsetX = 0.5,
            offsetY = 0.5,
            ratioX = canvasWidth / imageWidth,
            ratioY = canvasHeight / imageHeight,
            minRation = Math.min(ratioX, ratioY),
            newWidth = imageWidth * minRation,
            newHeight = imageHeight * minRation;

        dx = (canvasWidth - newWidth) * offsetX;
        dy = (canvasHeight - newHeight) * offsetY;

        return { sx, sy, sWidth, sHeight, dx, dy, dWidth: newWidth, dHeight: newHeight};
    }
}
