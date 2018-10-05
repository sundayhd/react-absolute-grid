"use strict";

export default class LayoutManager {
  columns;
  horizontalMargin;
  verticalMargin;
  layoutWidth;
  itemHeight;
  itemWidth;
  rowHeight;
  rtl;

  constructor(options, width, rtl) {
    this.update(options, width, rtl);
  }

  update(options, width, rtl) {
    //Calculates layout
    this.rtl = rtl;
    this.layoutWidth = width;
    this.zoom = options.zoom;
    this.itemWidth = Math.round(options.itemWidth * this.zoom);
    this.itemHeight = Math.round(options.itemHeight * this.zoom);
    this.columns = Math.floor(this.layoutWidth / this.itemWidth);
    this.horizontalMargin =
      this.columns === 1
        ? 0
        : Math.round(this.layoutWidth - this.columns * this.itemWidth) /
          (this.columns - 1);
    this.verticalMargin =
      options.verticalMargin === -1
        ? this.horizontalMargin
        : options.verticalMargin;
    this.rowHeight = this.itemHeight + this.verticalMargin;
  }

  getTotalHeight(filteredTotal) {
    return (
      Math.ceil(filteredTotal / this.columns) * this.rowHeight -
      this.verticalMargin
    );
  }

  getRow(index) {
    return Math.floor(index / this.columns);
  }

  getColumn(index) {
    return index - this.getRow(index) * this.columns;
  }

  getPosition(index, gridX, gridY) {
    let col = this.getColumn(index);
    const row = this.getRow(index);
    const margin = this.horizontalMargin;
    const width = this.itemWidth;

    if (this.rtl) {
      col = Math.abs(col - this.columns) - 1;
    }

    return {
      x: Math.round(col * width + col * margin) + gridX,
      y: Math.round((this.itemHeight + this.verticalMargin) * row) + gridY
    };
  }

  getTransform(index, gridX = 0, gridY = 0) {
    const position = this.getPosition(index, gridX, gridY);
    return "translate3d(" + position.x + "px, " + position.y + "px, 0)";
  }

  getStyle(index, animation, isFiltered) {
    const transform = this.getTransform(index);
    const style = {
      width: this.itemWidth + "px",
      height: this.itemHeight + "px",
      WebkitTransform: transform,
      MozTransform: transform,
      msTransform: transform,
      transform: transform,
      position: "absolute",
      boxSizing: "border-box",
      display: isFiltered ? "none" : "block"
    };

    if (animation) {
      style.WebkitTransition = "-webkit-" + animation;
      style.MozTransition = "-moz-" + animation;
      style.msTransition = "ms-" + animation;
      style.transition = animation;
    }

    return style;
  }

  getStyleForEndAnimation(index, animation, isFiltered, gridX, gridY) {
    const transform = this.getTransform(index, gridX, gridY);
    const style = {
      width: this.itemWidth + "px",
      height: this.itemHeight + "px",
      WebkitTransform: transform,
      MozTransform: transform,
      msTransform: transform,
      transform: transform,
      position: "fixed",
      boxSizing: "border-box",
      display: isFiltered ? "none" : "block",
      zIndex: 1000,
      left: 0,
      top: 0
    };

    if (animation) {
      style.WebkitTransition = "-webkit-" + "transform 150ms ease 0s";
      style.MozTransition = "-moz-" + "transform 150ms ease 0s";
      style.msTransition = "ms-" + "transform 150ms ease 0s";
      style.transition = "transform 150ms ease 0s";
    }

    return style;
  }
}
