'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};

/**
 * Constructs a new TreeView object for the given element.
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element for the TreeView widget.
 * @constructor
 */
Prime.Widgets.TreeView = function(element) {
  this.element = Prime.Document.Element.wrap(element);
  Prime.Utils.bindAll(this);
  this._setInitialOptions();

  this.element.query('a.folder-toggle').each(function(e) {
    e.addEventListener('click', this._handleClick);
  }.bind(this));
};

Prime.Widgets.TreeView.constructor = Prime.Widgets.TreeView;

Prime.Widgets.TreeView.prototype = {
  /**
   * Set more than one option at a time by providing a map of key value pairs. This is considered an advanced
   * method to set options on the widget. The caller needs to know what properties are valid in the options object.
   *
   * @param {Object} options Key value pair of configuration options.
   * @returns {Prime.Widgets.TreeView} This TreeView.
   */
  withOptions: function(options) {
    if (!Prime.Utils.isDefined(options)) {
      return this;
    }

    for (var option in options) {
      if (options.hasOwnProperty(option)) {
        this.options[option] = options[option];
      }
    }
    return this;
  },

  /* ===================================================================================================================
   * Private methods
   * ===================================================================================================================*/

  /**
   * Handles the click event.
   * @private
   */
  _handleClick: function(event) {
    var a = Prime.Document.Element.wrap(event.target);
    var li = a.getParent();
    if (a.hasClass('active')) {
      a.removeClass('active');
      li.removeClass('active');
    } else {
      a.addClass('active');
      li.addClass('active');
    }
  },

  /**
   * Set the initial options for this widget.
   * @private
   */
  _setInitialOptions: function() {
    // Defaults
    this.options = {
      'dateOnly': false
    };

    var userOptions = Prime.Utils.dataSetToOptions(this.element);
    for (var option in userOptions) {
      if (userOptions.hasOwnProperty(option)) {
        this.options[option] = userOptions[option];
      }
    }
  }
};

