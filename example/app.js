document.addEventListener("DOMContentLoaded", function() {
    let element = document.getElementById('canvas1');
    let imagesArray = Array.from(new Array(90), (v, k) => {
        let number = String(k).padStart(4, "0");
        return `https://distracted-villani-e19534.netlify.app/train/rotation${number}.jpg`;
    });
    let loadingBlock = document.querySelector('.loading1');

    // Initialization
    let instance1 = new AnimateImages(element, {
        images: imagesArray,
        preload: "all",
        preloadNumber: 5,
        poster: imagesArray[0],
        fps: 45,
        loop: true,
        //reverse: true,
        autoplay: false,
        //ratio: 2.56,
        fillMode: 'cover',
        draggable: true,
        //inversion: true,
        //dragModifier: 1.5,
        touchScrollMode: "allowPageScroll",
        //pageScrollTimerDelay: 2500,
        // fastPreview: {
        //     images: imagesArray.filter( (val, i) => i % 5 === 0 ),
        //     matchFrame: function (currentFrame){
        //         return ((currentFrame-1) * 5) + 1;
        //     },
        //     fpsAfter: 60,
        // },
        onPreloadFinished: (plugin) => {
            console.log('Callback: onPreloadFinished');
            //plugin.play();
        },
        onFastPreloadFinished: (plugin) => {
            console.log('Callback: onFastPreloadFinished');
        },
        onPosterLoaded(plugin){
            console.log('Callback: onPosterLoaded');
        },
        onAnimationEnd(plugin){
            console.log('Callback: onAnimationEnd');
        },
        // onBeforeFrame(plugin, {context, width, height }){
        //
        // },
        // onAfterFrame(plugin, {context, width, height }){
        //
        // },
    });
    //instance1.preloadImages();
    setupControls();

    setTimeout(()=>{
        instance1.preloadImages();
    }, 3000);

    // Events
    element.addEventListener('animate-images:loading-progress', function (e){
        //console.log(`Event: loading progress: ${e.detail.progress}`);
        loadingBlock.querySelector('span').textContent = Math.floor( +e.detail.progress * 100);
    });
    element.addEventListener('animate-images:preload-finished', function (e){
        console.log(`Event: animate-images:preload-finished`);
    });
    element.addEventListener('animate-images:fast-preload-finished', function (e){
        console.log(`Event: animate-images:fast-preload-finished`);
    });
    element.addEventListener('animate-images:animation-end', function () {
        console.log(`Event: animate-images:animation-end`);
    });
    element.addEventListener('animate-images:poster-loaded', function () {
        console.log(`Event: animate-images:poster-loaded`);
    });
    element.addEventListener('animate-images:loading-error', function () {
        console.log(`Event: animate-images:loading-error`);
    });
    element.addEventListener('animate-images:drag-start', function () {
        console.log(`Event: animate-images:drag-start`);
    });
    element.addEventListener('animate-images:drag-change', function (e) {
        console.log(`Event: animate-images:drag-change`);
    });
    element.addEventListener('animate-images:drag-end', function () {
        console.log(`Event: animate-images:drag-end`);
    });

    // Controls
    function setupControls(lib){
        console.log('setup controls');
        document.querySelector('.js-play').addEventListener('click', () => {
            instance1.play();
        });
        document.querySelector('.js-stop').addEventListener('click', () => {
            instance1.stop();
        });
        document.querySelector('.js-toggle').addEventListener('click', () => {
            instance1.toggle();
        });
        document.querySelector('.js-next').addEventListener('click', () => {
            instance1.next();
        });
        document.querySelector('.js-prev').addEventListener('click', () => {
            instance1.prev();
        });
        document.querySelector('.js-reset').addEventListener('click', () => {
            instance1.reset();
        });

        let reverse = instance1.getOption('reverse');
        document.querySelector('.js-reverse').addEventListener('change', () => {
            reverse = !reverse;
            instance1.setReverse(reverse);
        });
        document.querySelector(".js-reverse").checked = reverse;

        let loop = instance1.getOption('loop');
        document.querySelector('.js-loop').addEventListener('change', () => {
            loop = !loop;
            instance1.setOption('loop', loop);
        });
        document.querySelector('.js-loop').checked = loop;

        let draggable = instance1.getOption('draggable');
        document.querySelector('.js-draggable').addEventListener('change', () => {
            draggable = !draggable;
            instance1.setOption('draggable', draggable);
        });
        document.querySelector('.js-draggable').checked = draggable;

        let fillMode = instance1.getOption('fillMode');
        document.querySelector(".js-fill-mode[value='"+ fillMode +"']").checked = true;
        document.querySelectorAll(".js-fill-mode").forEach(function (el){
            el.addEventListener('change', function(){
                instance1.setOption('fillMode', this.value);
            });
        });

        let framesInput = document.querySelector('.js-frames-input');
        framesInput.setAttribute('max', instance1.getTotalImages());
        framesInput.addEventListener('input', function() {
            instance1.setFrame(this.value);
        });

        // Inputs
        document.querySelector('.js-set-frame').addEventListener('click', function() {
            instance1.setFrame(+this.closest('.js-option-block').querySelector('input').value);
        });
        document.querySelector('.js-play-to').addEventListener('click', function() {
            instance1.playTo(+this.closest('.js-option-block').querySelector('input').value);
        });
        document.querySelector('.js-play-to-shortest').addEventListener('click', function() {
            instance1.playTo(+this.closest('.js-option-block').querySelector('input').value, {
                shortestPath: true,
            });
        });
        document.querySelector('.js-play-frames').addEventListener('click', function() {
            instance1.playFrames(+this.closest('.js-option-block').querySelector('input').value);
        });
        document.querySelector('.js-set-fps').addEventListener('click', function() {
            instance1.setOption("fps", this.closest('.js-option-block').querySelector('input').value);
        });
        document.querySelector('.js-set-ratio').addEventListener('click', function() {
            instance1.setOption("ratio", this.closest('.js-option-block').querySelector('input').value);
        });
    }

});

