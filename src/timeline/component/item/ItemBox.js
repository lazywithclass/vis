/**
 * @constructor ItemBox
 * @extends Item
 * @param {Object} data             Object containing parameters start
 *                                  content, className.
 * @param {{toScreen: function, toTime: function}} conversion
 *                                  Conversion functions from time to screen and vice versa
 * @param {Object} [options]        Configuration options
 *                                  // TODO: describe available options
 */
function ItemBox (data, conversion, options) {
  this.props = {
    dot: {
      width: 0,
      height: 0
    },
    line: {
      width: 0,
      height: 0
    }
  };

  // validate data
  if (data) {
    if (data.start == undefined) {
      throw new Error('Property "start" missing in item ' + data);
    }
  }

  Item.call(this, data, conversion, options);
}

ItemBox.prototype = new Item (null, null, null);

/**
 * Check whether this item is visible inside given range
 * @returns {{start: Number, end: Number}} range with a timestamp for start and end
 * @returns {boolean} True if visible
 */
ItemBox.prototype.isVisible = function(range) {
  // determine visibility
  // TODO: account for the real width of the item. Right now we just add 1/4 to the window
  var interval = (range.end - range.start) / 4;
  return (this.data.start > range.start - interval) && (this.data.start < range.end + interval);
};

/**
 * Repaint the item
 */
ItemBox.prototype.redraw = function() {
  var dom = this.dom;
  if (!dom) {
    // create DOM
    this.dom = {};
    dom = this.dom;

    // create main box
    dom.box = document.createElement('DIV');

    // contents box (inside the background box). used for making margins
    dom.content = document.createElement('DIV');
    dom.content.className = 'content';
    dom.box.appendChild(dom.content);

    // line to axis
    dom.line = document.createElement('DIV');
    dom.line.className = 'line';

    // dot on axis
    dom.dot = document.createElement('DIV');
    dom.dot.className = 'dot';

    // attach this item as attribute
    dom.box['timeline-item'] = this;
  }

  // append DOM to parent DOM
  if (!this.parent) {
    throw new Error('Cannot redraw item: no parent attached');
  }
  if (!dom.box.parentNode) {
    var foreground = this.parent.dom.foreground;
    if (!foreground) throw new Error('Cannot redraw time axis: parent has no foreground container element');
    foreground.appendChild(dom.box);
  }
  if (!dom.line.parentNode) {
    var background = this.parent.dom.background;
    if (!background) throw new Error('Cannot redraw time axis: parent has no background container element');
    background.appendChild(dom.line);
  }
  if (!dom.dot.parentNode) {
    var axis = this.parent.dom.axis;
    if (!background) throw new Error('Cannot redraw time axis: parent has no axis container element');
    axis.appendChild(dom.dot);
  }
  this.displayed = true;

  // update contents
  if (this.data.content != this.content) {
    this.content = this.data.content;
    if (this.content instanceof Element) {
      dom.content.innerHTML = '';
      dom.content.appendChild(this.content);
    }
    else if (this.data.content != undefined) {
      dom.content.innerHTML = this.content;
    }
    else {
      throw new Error('Property "content" missing in item ' + this.data.id);
    }

    this.dirty = true;
  }

  // update class
  var className = (this.data.className? ' ' + this.data.className : '') +
      (this.selected ? ' selected' : '');
  if (this.className != className) {
    this.className = className;
    dom.box.className = 'item box' + className;
    dom.line.className = 'item line' + className;
    dom.dot.className  = 'item dot' + className;

    this.dirty = true;
  }

  // recalculate size
  if (this.dirty) {
    this.props.dot.height = dom.dot.offsetHeight;
    this.props.dot.width = dom.dot.offsetWidth;
    this.props.line.width = dom.line.offsetWidth;
    this.width = dom.box.offsetWidth;
    this.height = dom.box.offsetHeight;

    this.dirty = false;
  }

  this._repaintDeleteButton(dom.box);
};

/**
 * Show the item in the DOM (when not already displayed). The items DOM will
 * be created when needed.
 */
ItemBox.prototype.show = function() {
  if (!this.displayed) {
    this.redraw();
  }
};

/**
 * Hide the item from the DOM (when visible)
 */
ItemBox.prototype.hide = function() {
  if (this.displayed) {
    var dom = this.dom;

    if (dom.box.parentNode)   dom.box.parentNode.removeChild(dom.box);
    if (dom.line.parentNode)  dom.line.parentNode.removeChild(dom.line);
    if (dom.dot.parentNode)   dom.dot.parentNode.removeChild(dom.dot);

    this.top = null;
    this.left = null;

    this.displayed = false;
  }
};

/**
 * Reposition the item horizontally
 * @Override
 */
ItemBox.prototype.repositionX = function() {
  var start = this.conversion.toScreen(this.data.start),
      align = this.options.align,
      left,
      box = this.dom.box,
      line = this.dom.line,
      dot = this.dom.dot;

  // calculate left position of the box
  if (align == 'right') {
    this.left = start - this.width;
  }
  else if (align == 'left') {
    this.left = start;
  }
  else {
    // default or 'center'
    this.left = start - this.width / 2;
  }

  // reposition box
  box.style.left = this.left + 'px';

  // reposition line
  line.style.left = (start - this.props.line.width / 2) + 'px';

  // reposition dot
  dot.style.left = (start - this.props.dot.width / 2) + 'px';
};

/**
 * Reposition the item vertically
 * @Override
 */
ItemBox.prototype.repositionY = function() {
  var orientation = this.options.orientation,
      box = this.dom.box,
      line = this.dom.line,
      dot = this.dom.dot;

  if (orientation == 'top') {
    box.style.top     = (this.top || 0) + 'px';
    line.style.top    = '0';
    line.style.height = (this.parent.top + this.top + 1) + 'px';
  }
  else { // orientation 'bottom'
    var itemSetHeight = this.parent.itemSet.props.height; // TODO: this is nasty
    var lineHeight = itemSetHeight - this.parent.top - this.parent.height + this.top;

    box.style.top     = (this.parent.height - this.top - this.height || 0) + 'px';
    line.style.top    = (itemSetHeight - lineHeight) + 'px';
    line.style.height = (lineHeight) + 'px';
  }

  dot.style.top = (-this.props.dot.height / 2) + 'px';
};
