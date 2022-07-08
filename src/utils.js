export function normalizeFrameNumber(frameNumber, totalImages){
    frameNumber = Math.floor(frameNumber);
    if (frameNumber <= 0) {
        return 1;
    } else if (frameNumber > totalImages) {
        return totalImages;
    }
    return frameNumber;
}

export function calculateFullAnimationDuration(imagesNumber, fps){
    return imagesNumber / fps  * 1000;
}

export function uppercaseFirstChar(word){
    return word.charAt(0).toUpperCase() + word.slice(1);
}