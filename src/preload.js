//============ PRELOAD
export function startLoadingImages(preloadNumber = 0, { node, settings, data }){
    console.log(`Preload ${preloadNumber} images`);
    if (data.load.isPreloadFinished) {
        console.log('preload was finished, return');
        return;
    }

    // if too many, load just the rest
    let unloadedCount = data.totalImages - data.load.preloadOffset;
    if (preloadNumber > unloadedCount){
        preloadNumber = unloadedCount;
    }

    // true when all the images are in queue but not loaded yet, (unloadedCount = preloadNumber = 0)
    if (preloadNumber <= 0) {
        console.log('preloaded <=0. return');
        return;
    }

    console.log(`start loop, preloadNumber=${preloadNumber}, offset=${data.load.preloadOffset}`);
    for (let i = data.load.preloadOffset; i < (preloadNumber + data.load.preloadOffset); i++){
        console.log(`preload #${i}`);
        let img = new Image();
        img.onload = onImageLoad;
        img.onerror = onImageLoad;
        img.src = settings.images[i];
        data.loadedImagesArray[i] = img;
    }
    data.load.preloadOffset = data.load.preloadOffset + preloadNumber;
    function onImageLoad(e){
        data.load.preloadedImagesNumber++;
        let progress = Math.floor((data.load.preloadedImagesNumber/data.totalImages) * 1000) / 1000 ;
        node.dispatchEvent( new CustomEvent('animate-images:loading-progress', {detail: {progress}}) );
        if (e.type === "error") {
            data.load.isLoadWithErrors = true;
            node.dispatchEvent( new Event('animate-images:loading-error') );
        }
        if (data.load.preloadedImagesNumber === data.totalImages) {
            data.load.isPreloadFinished = true;
            data.load.onLoadFinishedCB();
        }
    }
}
