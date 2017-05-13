'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};

/**
 * Constructs a new Dismissable object for the given element.
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element for the Dismissable widget.
 * @constructor
 */
Prime.Widgets.Dismissable = function(element) {
  this.element = Prime.Document.Element.wrap(element);
  Prime.Utils.bindAll(this);
  this.element.queryFirst('a.dismiss-button').addEventListener('click', this._handleClick);
};

Prime.Widgets.Dismissable.constructor = Prime.Widgets.Dismissable;

Prime.Widgets.Dismissable.prototype = {
  /* ===================================================================================================================
   * Private methods
   * ===================================================================================================================*/

  /**
   * Handles the click event.
   * @private
   */
  _handleClick: function() {
    this.element.setOpacity(0);
    setTimeout(function() {
      this.element.removeFromDOM();
    }.bind(this), 400);
  }
};
