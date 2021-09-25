export function maybeShowPoster({settings, data, drawFrame, updateImageSizes}){
    if (settings.poster && !data.isAnyFrameChanged) {
        let img = new Image();
        img.onload = onPosterLoad;
        img.onerror = onPosterLoad;
        img.src = settings.poster;
        function onPosterLoad(e){
            if (e.type === "error") return;
            data.poster.isPosterLoaded = true;
            data.poster.imageObject = img;
            data.canvas.element.dispatchEvent( new Event('animate-images:poster-loaded') );
            if ("onPosterLoaded" in settings) settings.onPosterLoaded();
            // show only if there wasn't any frame change from initial
            // if poster loaded after all the images and any action, it won't be shown
            if ( !data.isAnyFrameChanged ) {
                updateImageSizes(img, false);
                drawFrame(img, {settings, data});
            }
        }
    }
}
