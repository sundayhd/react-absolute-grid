"use strict";

import React, { Component, PureComponent } from "react";

import LayoutManager from "./LayoutManager.js";
import PropTypes from "prop-types";

export default function createDisplayObject(
  DisplayObject,
  displayProps,
  forceImpure
) {
  const Comp = forceImpure ? Component : PureComponent;

  return class extends Comp {
    static propTypes = {
      item: PropTypes.object,
      style: PropTypes.object,
      index: PropTypes.number,
      dragEnabled: PropTypes.bool,
      dragManager: PropTypes.object,
      itemsLength: PropTypes.number,
      container: PropTypes.object,
      rtl: PropTypes.bool,
      containerZoom: PropTypes.number
    };

    constructor(props) {
      super(props);
    }

    state = { dragX: null, dragY: null };

    updateDrag(x, y) {
      //Pause Animation lets our item return to a snapped position without being animated
      let pauseAnimation = false;
      let endAnimation = false;
      if (
        !this.props.dragManager.dragItem &&
        this.props.dragManager.dragItemStarted
      ) {
        endAnimation = true;
        setTimeout(() => {
          this.setState({ endAnimation: false });
        }, 150);

        pauseAnimation = true;
        setTimeout(() => {
          this.setState({ pauseAnimation: false });
        }, 170);
      }
      this.setState({
        dragX: x,
        dragY: y,
        pauseAnimation: pauseAnimation,
        endAnimation: endAnimation
      });
    }

    onDrag = e => {
      if (this.props.item == null || this.props.item.disabled) return;
      if (this.props.dragManager) {
        this.props.dragManager.startDrag(
          e,
          this.domNode,
          this.props.item,
          this.updateDrag.bind(this),
          this.props.containerZoom
        );
      }
    };

    getStyle() {
      if (this.props.item == null || this.props.item.disabled)
        return { display: "none" };
      const options = {
        itemWidth: this.props.itemWidth,
        itemHeight: this.props.itemHeight,
        verticalMargin: this.props.verticalMargin,
        zoom: this.props.zoom
      };
      const layout = new LayoutManager(
        options,
        this.props.layoutWidth,
        this.props.rtl
      );
      const style = layout.getStyle(
        this.props.index,
        this.props.animation,
        this.props.item[this.props.filterProp]
      );
      //If this is the object being dragged, return a different style
      if (
        this.props.dragManager.dragItem &&
        this.props.dragManager.dragItem[this.props.keyProp] ===
          this.props.item[this.props.keyProp]
      ) {
        const dragStyle = this.props.dragManager.getStyle(
          this.state.dragX,
          this.state.dragY
        );
        return { ...style, ...dragStyle };
      } else if (this.state && this.state.endAnimation) {
        const container = this.props.container;
        let x = 0;
        let y = 0;
        if (container != null) {
          let gridRect = container.getBoundingClientRect();
          x = gridRect.x;
          y = gridRect.y;
        }
        const endAnimationStyle = layout.getStyleForEndAnimation(
          this.props.index,
          this.props.animation,
          this.props.item[this.props.filterProp],
          x,
          y
        );
        return endAnimationStyle;
      } else if (this.state && this.state.pauseAnimation) {
        const pauseAnimationStyle = { ...style };
        pauseAnimationStyle.WebkitTransition = "none";
        pauseAnimationStyle.MozTransition = "none";
        pauseAnimationStyle.msTransition = "none";
        pauseAnimationStyle.transition = "none";
        return pauseAnimationStyle;
      }
      return style;
    }

    componentDidMount() {
      if (this.props.dragEnabled) {
        this.domNode.addEventListener("mousedown", this.onDrag);
        this.domNode.addEventListener("touchstart", this.onDrag);
        this.domNode.setAttribute(
          "data-key",
          this.props.item[this.props.keyProp]
        );
      }
    }

    componentWillUnmount() {
      if (this.props.dragEnabled) {
        this.props.dragManager.endDrag();
        this.domNode.removeEventListener("mousedown", this.onDrag);
        this.domNode.removeEventListener("touchstart", this.onDrag);
      }
    }

    render() {
      return (
        <div ref={node => (this.domNode = node)} style={this.getStyle()}>
          <DisplayObject
            {...displayProps}
            item={this.props.item}
            index={this.props.index}
            itemsLength={this.props.itemsLength}
          />
        </div>
      );
    }
  };
}
