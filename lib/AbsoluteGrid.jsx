"use strict";

import React, { Component, PureComponent } from "react";
import { debounce, sortBy } from "lodash";

import createDisplayObject from "./BaseDisplayObject.jsx";
import DragManager from "./DragManager.js";
import LayoutManager from "./LayoutManager.js";
import PropTypes from "prop-types";

export default function createAbsoluteGrid(
  DisplayObject,
  displayProps = {},
  forceImpure = false
) {
  const Comp = forceImpure ? Component : PureComponent;
  const WrappedDisplayObject = createDisplayObject(
    DisplayObject,
    displayProps,
    forceImpure
  );

  return class extends Comp {
    static defaultProps = {
      items: [],
      keyProp: "key",
      filterProp: "filtered",
      sortProp: "sort",
      itemWidth: 128,
      itemHeight: 128,
      verticalMargin: -1,
      responsive: false,
      dragEnabled: false,
      animation: "transform 300ms ease",
      zoom: 1,
      rtl: false,
      minSort: 0,
      maxSort: 9999,
      onMove: () => {},
      onDragStart: () => {},
      onDragMove: () => {},
      onDragEnd: () => {}
    };

    static propTypes = {
      items: PropTypes.arrayOf(PropTypes.object).isRequired,
      itemWidth: PropTypes.number,
      itemHeight: PropTypes.number,
      verticalMargin: PropTypes.number,
      zoom: PropTypes.number,
      containerZoom: PropTypes.number,
      responsive: PropTypes.bool,
      dragEnabled: PropTypes.bool,
      keyProp: PropTypes.string,
      sortProp: PropTypes.string,
      filterProp: PropTypes.string,
      animation: PropTypes.string,
      onMove: PropTypes.func,
      onDragStart: PropTypes.func,
      onDragMove: PropTypes.func,
      onDragEnd: PropTypes.func,
      rtl: PropTypes.bool,
      minSort: PropTypes.number,
      maxSort: PropTypes.number,
      forceResize: PropTypes.bool,
      forceResizeDone: PropTypes.func
    };

    constructor(props, context) {
      super(props, context);
      this.onResize = debounce(this.onResize, 150);
      this.dragManager = new DragManager(
        this.props.onMove,
        this.props.onDragStart,
        this.props.onDragEnd,
        this.props.onDragMove,
        this.props.keyProp
      );
      this.state = {
        layoutWidth: 0,
        parentNode: null
      };
    }

    render() {
      if (!this.state.layoutWidth || !this.props.items.length) {
        return <div ref={node => (this.container = node)} />;
      }

      let filteredIndex = 0;
      let sortedIndex = {};

      /*
       If we actually sorted the array, React would re-render the DOM nodes
       Creating a sort index just tells us where each item should be
       This also clears out filtered items from the sort order and
       eliminates gaps and duplicate sorts
       */
      const filteredItems = this.props.items.filter(
        item =>
          this.props.minSort == null ||
          this.props.maxSort == null ||
          (item.sort >= this.props.minSort && item.sort < this.props.maxSort)
      );
      sortBy(filteredItems, this.props.sortProp).forEach(item => {
        if (!item[this.props.filterProp]) {
          const key = item[this.props.keyProp];
          sortedIndex[key] = filteredIndex;
          filteredIndex++;
        }
      });
      const itemsLength = filteredItems.length;
      const gridItems = filteredItems.map(item => {
        const key = item[this.props.keyProp];
        const index = sortedIndex[key];
        return (
          <WrappedDisplayObject
            item={item}
            index={index}
            key={key}
            itemsLength={itemsLength}
            animation={this.props.animation}
            itemWidth={this.props.itemWidth}
            itemHeight={this.props.itemHeight}
            layoutWidth={this.state.layoutWidth}
            verticalMargin={this.props.verticalMargin}
            zoom={this.props.zoom}
            containerZoom={this.props.containerZoom}
            keyProp={this.props.keyProp}
            filterProp={this.props.filterProp}
            dragEnabled={this.props.dragEnabled}
            dragManager={this.dragManager}
            container={this.state.container}
            rtl={this.props.rtl}
          />
        );
      });

      const options = {
        itemWidth: this.props.itemWidth,
        itemHeight: this.props.itemHeight,
        verticalMargin: this.props.verticalMargin,
        zoom: this.props.zoom
      };
      const layout = new LayoutManager(options, this.state.layoutWidth);
      const gridStyle = {
        position: "relative",
        display: "block",
        height: layout.getTotalHeight(filteredIndex)
      };

      return (
        <div
          style={gridStyle}
          className="absoluteGrid"
          ref={node => (this.container = node)}
        >
          {gridItems}
        </div>
      );
    }

    componentDidMount() {
      //If responsive, listen for resize
      if (this.props.responsive) {
        window.addEventListener("resize", this.onResize);
      }
      this.onResize();
      this.setContainer();
    }

    componentDidUpdate(prevProps, prevState) {
      if (
        prevProps.forceResize != this.props.forceResize &&
        this.props.forceResize == true
      ) {
        this.onResize();
        if (this.props.forceResizeDone) this.props.forceResizeDone();
      }
    }

    // shouldComponentUpdate = (nextProps, nextState) => {
    //   if (this.compareObjects(nextProps, this.props)) return true;
    //   if (this.compareObjects(nextState, this.state)) return true;
    //   return false;
    // };

    componentWillUnmount() {
      window.removeEventListener("resize", this.onResize);
    }

    getContainerParentNode() {
      if (this.container != null && this.container.parentNode != null)
        return this.container.parentNode;
      else return null;
    }

    setContainer() {
      if (this.container) {
        this.setState({ container: this.container });
      } else {
        setTimeout(() => {
          if (this.container) {
            this.setState({ container: this.container });
          }
        }, 100);
      }
    }

    onResize = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(this.getDOMWidth);
      } else {
        setTimeout(this.getDOMWidth, 66);
      }
    };

    getDOMWidth = () => {
      const width = this.container && this.container.clientWidth;
      if (this.state.layoutWidth !== width) {
        this.setState({ layoutWidth: width });
      }
    };

    compareObjects(obj1, obj2, checkLength = false) {
      if ((obj1 != null && obj2 == null) || (obj1 == null && obj2 != null))
        return true;
      let keys = Object.keys(obj1);
      if (checkLength) {
        if (keys.length != Object.keys(obj2).length) return true;
      }
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        if (
          obj1[key] !== null &&
          typeof obj1[key] === "object" &&
          obj2[key] !== null &&
          typeof obj2[key] === "object"
        ) {
          if (this.compareObjects(obj1[key], obj2[key], true)) return true;
        } else if (obj1[key] != obj2[key]) return true;
      }
      return false;
    }
  };
}
