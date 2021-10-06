export function normalizeFrameNumber(frameNumber, totalImages){
    frameNumber = Math.floor(frameNumber);
    if (frameNumber <= 0) {
        return 1;
    } else if (frameNumber > totalImages) {
        return totalImages;
    }
    return frameNumber;
}

export function isOutOfRange(frameNumber, totalImages){
    return ( frameNumber <= 0 || frameNumber > totalImages );
}

export function calculateFullAnimationDuration(imagesNumber, fps){
    return imagesNumber / fps  * 1000;
}

export function pixelRatio(context) {
    const devicePixelRatio = window.devicePixelRatio || 1
    const backingStoreRatio =
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1
    return devicePixelRatio / backingStoreRatio
}
