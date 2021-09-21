/*!
 @its2easy/animate-images 1.0.0
 https://github.com/its2easy/animate-images
         
 Copyright (c) 2020 Dmitry Kovalev,
 Released under the MIT license
*/
function init() {
    // test comment
    /*
    * test comment
    *  */
    console.log('init');
    console.log('test');

    const p1 = new Promise(resolve => '123');
    const p2 = new Promise(resolve => '1235');
    Promise.allSettled([p1, p2]).then(e => console.log('eeee'));
}

export { init };
//# sourceMappingURL=animate-images.esm.js.map
