export function drawFrame(frameNumberOrImage, {settings, data}){
    let image;
    if (Number.isInteger(frameNumberOrImage)) {
        image = data.loadedImagesArray[frameNumberOrImage-1]
    } else {
        image = frameNumberOrImage;
    }

    let sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight;
    if (settings.fillMode === "cover") {
        ({sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = getDrawImageCoverProps(settings, data))
    } else if ( settings.fillMode === "contain" ) {
        ({sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = getDrawImageContainProps(settings, data))
    }

    //console.log(`sx= ${sx}, sy=${sy}, sWidth=${sWidth}, sHeight=${sHeight}, dx=${dx}, dy=${dy}, dWidth=${dWidth}, dHeight=${dHeight}`);
    data.canvas.context.drawImage(image, sx, sy, sWidth, sHeight,  dx, dy, dWidth, dHeight);
}

export function clearCanvas(data){
    data.canvas.context.clearRect(0, 0, data.canvas.imageWidth, data.canvas.imageHeight);
}

function getDrawImageCoverProps(settings, data){
    //https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas
    let dx = 0,
        dy = 0,
        // w = 600,
        // h = 300,
        // iw = 300,
        // ih = 100,
        canvasWidth = data.canvas.element.width,
        canvasHeight = data.canvas.element.height,
        imageWidth = data.canvas.imageWidth,
        imageHeight = data.canvas.imageHeight,
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

function getDrawImageContainProps(settings, data){
    let canvasWidth = data.canvas.element.width,
        canvasHeight = data.canvas.element.height,
        imageWidth = data.canvas.imageWidth,
        imageHeight = data.canvas.imageHeight,
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
