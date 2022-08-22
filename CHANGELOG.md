# Changelog
## 2.3.1
- animation started in ```playTo``` or ```playFrames``` in ```fastPreview``` mode now stops 
  after full preload instead of playing endlessly
- animation-end callback and event are now called after resetting values
- reduced the number of operations in the animation function
- move ```core-js``` to ```devDependencies```
## 2.3.0
- new ```setForward``` method
- new ```responsiveAspect``` option that allows to control height instead of width
- add ```direction``` to event.detail of ```animate-images:drag-change``` event
- reset pixels correction when changing drag direction
- fix dragging when mousemove is called without real movement
## 2.2.0
- new ```fastPreview``` option, ```onFastPreloadFinished``` callback, 
  ```animate-images:fast-preload-finished``` event, ```isFastPreloadFinished``` method
- new ```isDragging``` method
- reduce bundle size by 20%
## 2.1.2
- fix wrong ```onPosterLoaded``` call
## 2.1.1
- new ```shortestPath``` option for ```playTo()```
## 2.1.0
- ```inversion``` is now only used while dragging and doesn't affect animation
## 2.0.0
- plugin import changed
- new initialization with constructor instead of ```init``` method
- ```togglePlay()``` renamed to ```toggle()```
- added types
- new ```onAnimationEnd``` callback
- new ```dragModifier``` option  
- ```playTo``` and ```playFrames``` now return plugin instance instead of Promise
- ```onBeforeFrame``` and ```onAfterFrame``` parameters changed
- ```getOption()``` accepts all the options
- fix wrong animation duration
## 1.6 
- new ```inversion``` option
## 1.5.3
- fix console.log()
## 1.5.2
- ```preventTouchScroll``` replaced with ```touchScrollMode``` and ```pageScrollTimerDelay```
## 1.5.1
- add ```preventTouchScroll``` option
## 1.5.0
- fix blurry images when devicePixelRatio > 1
- add ```onBeforeFrame``` and ```onAfterFrame``` callbacks with access to the
  canvas context
## 1.4.0
- add ```animate-images:drag-start```, ```animate-images:drag-change``` and
  ```animate-images:drag-end ``` events
## 1.3.2
- fix wrong height after resize when canvas width/height ratio is
  a fractional number
## 1.3.1
- fix readme
## 1.3.0
- change build
## 1.2.0
- plugin has been rewritten with classes
