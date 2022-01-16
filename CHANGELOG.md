# Changelog
## 2.0.0
- plugin import changed
- new initialization with constructor instead of ```init``` method
- ```togglePlay()``` renamed to ```toggle()```
- added types
- new ```onAnimationEnd``` callback
- ```playTo``` and ```playFrames``` now return plugin instance instead of Promise
- ```onBeforeFrame``` and ```onAfterFrame``` parameters changed
- ```getOption()``` accepts all the options
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
