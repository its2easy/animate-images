export default class Render{

    constructor( {settings, data} ) {
        this._settings = settings;
        this._data = data;
        /** @type CanvasRenderingContext2D */
        this._context = this._data.canvas.element.getContext("2d");
    }

    /**
     * @param {HTMLImageElement} imageObject - image object
     */
    _drawFrame(imageObject){
        //this._context.imageSmoothingEnabled = false; // may reduce blurriness, but could make the image worse (resets to true  after resize)

        let sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight;
        if (this._settings.fillMode === "cover") {
            ( {sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = this.#getDrawImageCoverProps(imageObject) )
        } else if ( this._settings.fillMode === "contain" ) {
            ( {sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = this.#getDrawImageContainProps(imageObject) )
        }

        //console.log(`sx= ${sx}, sy=${sy}, sWidth=${sWidth}, sHeight=${sHeight}, dx=${dx}, dy=${dy}, dWidth=${dWidth}, dHeight=${dHeight}`);
        const canvasEl = this._data.canvas.element;
        this._settings.onBeforeFrame(this._data.pluginApi,
            {context: this._context, width: canvasEl.width, height: canvasEl.height});

        this._context.drawImage(imageObject, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

        this._settings.onAfterFrame(this._data.pluginApi,
            {context: this._context, width: canvasEl.width, height: canvasEl.height});
    }

    _clearCanvas(){
        const canvasEl = this._data.canvas.element;
        this._context.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }

    #getDrawImageCoverProps(image){
        //https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas
        let dx = 0,
            dy = 0,
            canvasWidth = this._data.canvas.element.width,
            canvasHeight = this._data.canvas.element.height,
            imageWidth = image.naturalWidth,
            imageHeight = image.naturalHeight,
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
    #getDrawImageContainProps(image){
        let canvasWidth = this._data.canvas.element.width,
            canvasHeight = this._data.canvas.element.height,
            imageWidth = image.naturalWidth,
            imageHeight = image.naturalHeight,
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
