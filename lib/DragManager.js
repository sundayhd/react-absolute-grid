"use strict";

export default class DragManager {
  dragItem;
  dragItemStarted;
  initialMouseX;
  initialMouseY;
  initialEventX;
  initialEventY;
  dragX;
  dragY;
  keyProp;

  constructor(moveFn, dragStartFn, dragEndFn, dragMoveFn, keyProp) {
    this.dragMove = this.dragMove.bind(this);
    this.endDrag = this.endDrag.bind(this);
    this.moveFn = moveFn;
    this.dragStartFn = dragStartFn;
    this.dragEndFn = dragEndFn;
    this.dragMoveFn = dragMoveFn;
    this.keyProp = keyProp;
    this.dragItemStarted = false;
    this.containerZoom = 1;
  }

  dragMove(e) {
    const tolerance = 3;
    const isTouch = e.touches && e.touches.length;
    const pageX = isTouch ? e.touches[0].pageX : e.pageX;
    const pageY = isTouch ? e.touches[0].pageY : e.pageY;

    const xMovement = Math.abs(this.initialEventX - pageX);
    const yMovement = Math.abs(this.initialEventY - pageY);

    if (true == true || xMovement > tolerance || yMovement > tolerance) {
      this.dragItemStarted = true;

      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      let calcClientX = clientX * (1 / this.containerZoom);
      let calcClientY = clientY * (1 / this.containerZoom);

      this.dragX = calcClientX - this.initialMouseX;
      this.dragY = calcClientY - this.initialMouseY;

      this.update(this.dragX, this.dragY);

      let targetKey;
      let targetElement = document.elementFromPoint(clientX, clientY);
      if (targetElement == null) return;

      while (targetElement != null && targetElement.parentNode) {
        if (targetElement.getAttribute("data-key")) {
          targetKey = targetElement.getAttribute("data-key");
          break;
        }
        targetElement = targetElement.parentNode;
      }

      if (targetKey && targetKey !== this.dragItem[this.keyProp]) {
        this.moveFn(this.dragItem[this.keyProp], targetKey);
      }

      e.stopPropagation();
      e.preventDefault();
    }

    this.dragMoveFn(e);
  }

  endDrag(e) {
    document.removeEventListener("mousemove", this.dragMove);
    document.removeEventListener("mouseup", this.endDrag);
    this.dragEndFn(e, this.dragItem);
    this.dragItem = null;
    if (this.update && typeof this.update === "function") {
      this.update(null, null);
    }
    this.update = null;
  }

  startDrag(e, domNode, item, fnUpdate, containerZoom) {
    this.dragItemStarted = false;

    this.containerZoom = containerZoom;
    if (this.containerZoom == null || this.containerZoom == 0)
      this.containerZoom = 1;

    const isTouch = e.targetTouches && e.targetTouches.length === 1;
    if (e.button === 0 || isTouch) {
      const rect = domNode.getBoundingClientRect();
      this.update = fnUpdate;
      this.dragItem = item;
      let pageX = isTouch ? e.targetTouches[0].pageX : e.pageX;
      let pageY = isTouch ? e.targetTouches[0].pageY : e.pageY;
      pageX = pageX * (1 / this.containerZoom);
      pageY = pageY * (1 / this.containerZoom);
      this.initialMouseX = Math.round(pageX - (rect.left + window.pageXOffset));
      this.initialMouseY = Math.round(pageY - (rect.top + window.pageYOffset));

      document.addEventListener("mousemove", this.dragMove);
      document.addEventListener("touchmove", this.dragMove);
      document.addEventListener("mouseup", this.endDrag);
      document.addEventListener("touchend", this.endDrag);
      document.addEventListener("touchcancel", this.endDrag);

      //This is needed to stop text selection in most browsers
      e.preventDefault();
    }

    this.dragStartFn(this.dragItem);
  }

  getStyle(x, y) {
    const dragStyle = {};
    const transform = `translate3d(${x}px, ${y}px, 0)`;
    //Makes positioning simpler if we're fixed
    dragStyle.position = "fixed";
    dragStyle.zIndex = 1000;
    //Required for Fixed positioning
    dragStyle.left = 0;
    dragStyle.top = 0;
    dragStyle.WebkitTransform = transform;
    dragStyle.MozTransform = transform;
    dragStyle.msTransform = transform;
    dragStyle.transform = transform;

    //Turn off animations for this item
    dragStyle.WebkitTransition = "none";
    dragStyle.MozTransition = "none";
    dragStyle.msTransition = "none";
    dragStyle.transition = "none";

    //Allows mouseover to work
    dragStyle.pointerEvents = "none";

    return dragStyle;
  }
}
