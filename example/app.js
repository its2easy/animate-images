$(function () {
    // First example
    let element = document.getElementById('canvas1');
    let imagesArray = Array.from(new Array(5), (v, k) => {
        //return `images/motor animation.83.${k + 93}.jpg`;
        return `images/${k + 501}.jpg`;
    });
    element.addEventListener('animate-images:loading-progress', function (e){
       //console.log(e.detail.progress);
    });
    element.addEventListener('animate-images:preload-finished', function (e){

    });

    let anim1 = animateImages.init(element, {
        images: imagesArray,
        preload: "partial",
        fps: 60,
        preloadNumber: 15,
        autoplay: false,
        reverse: false,
        loop: true,
        poster: 'images/motor animation.83.93.jpg',
        //poster: 'images/501.jpg',
        onPreloadFinished: (lib) => {
            console.log('onPreloadFinished CB');
           //lib.setFrame(2);
            //lib.next();
            //lib.play();
            //lib.playTo(5);
            setTimeout(()=> {
                anim1.setReverse(true);
            }, 3500);
        },
        onPosterLoaded(){
            console.log('poster loaded cb');
        }
    });


    //anim1.preloadImages(20);
    //anim1.preloadImages();



    // console.log('after init');
    //
    // // Controls
    // $('.js-play').on('click', function () {
    //     sprite1.play();
    // });
    // $('.js-stop').on('click', function () {
    //     sprite1.stop();
    // });
    // $('.js-toggle').on('click', function () {
    //     sprite1.toggle();
    // });
    // $('.js-next').on('click', function () {
    //     sprite1.next();
    // });
    // $('.js-prev').on('click', function () {
    //     sprite1.prev();
    // });
    // $('.js-reset').on('click', function () {
    //     sprite1.reset();
    // });
    // var reverse = true;
    // $('.js-reverse').on('click', function () {
    //     sprite1.setReverse(reverse);
    //     reverse = !reverse
    // });
    // $('.js-frames-input').on('input', function () {
    //     sprite1.setFrame($(this).val());
    // });
    // // Inputs
    // $('.js-set-frame').on('click', function () {
    //     sprite1.setFrame($(this).closest('.js-option-block').find('input').val() );
    // });
    // $('.js-set-duration').on('click', function () {
    //     sprite1.setOption('duration', $(this).closest('.js-option-block').find('input').val());
    // });
    // $('.js-set-frame-time').on('click', function () {
    //     sprite1.setOption('frameTime', $(this).closest('.js-option-block').find('input').val());
    // });
    // $('.js-set-fps').on('click', function () {
    //     sprite1.setOption('fps', $(this).closest('.js-option-block').find('input').val());
    // });
    // element.addEventListener('sprite:last-frame', function () {
    //     console.log('last frame');
    // });
    // element.addEventListener('sprite:first-frame', function () {
    //     console.log('first frame');
    // });

});

