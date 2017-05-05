/*
 * Copyright (c) 2014-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Ajax namespace. This namespace contains a single class (for now) called Request.
 *
 * @namespace Prime.Ajax
 */
Prime.Ajax = Prime.Ajax || {};

/**
 * Makes a new AJAX request.
 *
 * @constructor
 * @param {string} [url] The URL to call. This can be left out for sub-classing but should otherwise be provided.
 * @param {string} [method=GET] The HTTP method to use. You can specify GET, POST, PUT, DELETE, HEAD, SEARCH, etc.
 */
Prime.Ajax.Request = function(url, method) {
  Prime.Utils.bindAll(this);
  this.xhr = new XMLHttpRequest();
  this.async = true;
  this.body = null;
  this.queryParams = null;
  this.contentType = null;
  this.errorHandler = this.onError;
  this.headers = {};
  this.loadingHandler = this.onLoading;
  this.method = method || 'GET';
  this.openHandler = this.onOpen;
  this.password = null;
  this.sendHandler = this.onSend;
  this.successHandler = this.onSuccess;
  this.unsetHandler = this.onUnset;
  this.url = url;
  this.username = null;
};

Prime.Ajax.Request.prototype = {
  /**
   * Changes the URL to call.
   *
   * @param {string} url The new URL to call.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  forURL: function(url) {
    this.url = url;
    return this;
  },

  /**
   * Invokes the AJAX request. If the URL is not set, this throws an exception.
   *
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  go: function() {
    if (!this.url) {
      throw new TypeError('No URL set for AJAX request');
    }

    var requestUrl = this.url;
    if ((this.method === 'GET' || this.method === 'DELETE') && this.queryParams !== null) {
      if (requestUrl.indexOf('?') === -1) {
        requestUrl += '?' + this.queryParams;
      } else {
        requestUrl += '&' + this.queryParams;
      }
    }

    if (this.async) {
      this.xhr.onreadystatechange = this._handler.bind(this);
    }

    this.xhr.open(this.method, requestUrl, this.async, this.username, this.password);

    if (Object.keys(this.headers).length > 0) {
      for (var key in this.headers) {
        if (this.headers.hasOwnProperty(key)) {
          this.xhr.setRequestHeader(key, this.headers[key]);
        }
      }
    }

    if (this.contentType) {
      this.xhr.setRequestHeader('Content-Type', this.contentType);
    }

    this.xhr.send(this.body);

    return this;
  },

  /**
   * Default handler for the "completed" state and an HTTP response status of anything but 2xx. Sub-classes can override
   * this handler or you can pass in a handler function to the {@link #withUnsetHandler}.
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object.
   */
  onError: function(xhr) {
  },

  /**
   * Default handler for the "loading" state. Sub-classes can override this handler or you can pass in a handler function
   * to the {@link #withLoadingHandler}.
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object.
   */
  onLoading: function(xhr) {
  },

  /**
   * Default handler for the "open" state. Sub-classes can override this handler or you can pass in a handler function
   * to the {@link #withOpenHandler}.
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object.
   */
  onOpen: function(xhr) {
  },

  /**
   * Default handler for the "send" state. Sub-classes can override this handler or you can pass in a handler function
   * to the {@link #withSendHandler}.
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object.
   */
  onSend: function(xhr) {
  },

  /**
   * Default handler for the "complete" state and an HTTP response status of 2xx. Sub-classes can override this handler
   * or you can pass in a handler function to the {@link #withUnsetHandler}.
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object.
   */
  onSuccess: function(xhr) {
  },

  /**
   * Default handler for the "unset" state. Sub-classes can override this handler or you can pass in a handler function
   * to the {@link #withUnsetHandler}.
   *
   * @param {XMLHttpRequest} xhr The XMLHttpRequest object.
   */
  onUnset: function(xhr) {
  },

  /**
   * Sets the async flag to false.
   *
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  synchronously: function() {
    this.async = false;
    return this;
  },

  /**
   * Sets the method used to make the AJAX request.
   *
   * @param {string} method The HTTP method.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  usingMethod: function(method) {
    this.method = method;
    return this;
  },

  /**
   * Sets the request body for the request.
   *
   * @param {string} body The request body.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withBody: function(body) {
    this.body = body;
    return this;
  },

  /**
   * Sets the content type for the request.
   *
   * @param {string} contentType The contentType.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withContentType: function(contentType) {
    this.contentType = contentType;
    return this;
  },

  /**
   * Sets the data object for the request. Will store the values for query parameters or post data depending on the
   * method that is set.  If the method is a post or put, will also set content-type to x-www-form-urlencoded.
   *
   * @param {Object} data The data object.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withData: function(data) {
    for (var prop in data) {
      if (data.hasOwnProperty(prop)) {
        if (this.method === 'PUT' || this.method === 'POST') {
          this.body = this._addDataValue(this.body, prop, data[prop]);
        } else {
          this.queryParams = this._addDataValue(this.queryParams, prop, data[prop]);
        }
      }
    }

    if (this.method === "PUT" || this.method === "POST") {
      this.contentType = 'application/x-www-form-urlencoded';
    }
    return this;
  },

  /**
   * Sets the data for the request using the form fields in the given form element. Will store the values for query
   * parameters or post data depending on the method that is set.  If the method is a post or put, will also set
   * content-type to x-www-form-urlencoded.
   *
   * @param {FormElement|Prime.Document.Element} form The form object.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withDataFromForm: function(form) {
    var domElement = form;
    if (form instanceof Prime.Document.Element) {
      domElement = form.domElement;
    }

    for (var i = 0; i < domElement.elements.length; i++) {
      var primeElement = new Prime.Document.Element(domElement.elements[i]);
      if (primeElement.isDisabled() || !primeElement.isInput()) {
        continue;
      }

      var type = primeElement.getAttribute('type');
      if (type !== null) {
        type = type.toLowerCase();
      }

      var values;
      if (primeElement.getTagName() === 'SELECT') {
        values = primeElement.getSelectedValues();
      } else if ((type === 'radio' || type === 'checkbox') && !primeElement.isChecked()) {
        continue;
      } else {
        values = primeElement.getValue();
      }

      var name = primeElement.domElement.name;
      if (this.method === 'PUT' || this.method === 'POST') {
        this.body = this._addDataValue(this.body, name, values)
      } else {
        this.queryParams = this._addDataValue(this.queryParams, name, values);
      }
    }

    if (this.method === "PUT" || this.method === "POST") {
      this.contentType = 'application/x-www-form-urlencoded';
    }

    return this;
  },

  /**
   * Sets the handler to invoke when the state of the AJAX request is "complete" and the HTTP status in the response is
   * not 2xx.
   *
   * @param {Function} func The handler function.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withErrorHandler: function(func) {
    this.errorHandler = func;
    return this;
  },

  /**
   * Sets the body of the AJAX request to the string value of the provided JSON object. The content-type of the request
   * will also be set to 'application/json'. The provided JSON object may be passed as a string or an object.
   *
   * @param {Object} json The JSON object.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withJSON: function(json) {
    this.body = typeof(json) === String ? json : JSON.stringify(json);
    this.contentType = 'application/json';
    return this;
  },

  /**
   * Sets the handler to invoke when the state of the AJAX request is "loading".
   *
   * @param {Function} func The handler function.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withLoadingHandler: function(func) {
    this.loadingHandler = func;
    return this;
  },

  /**
   * Set the request headers using the key and value.
   *
   * @param {String} key The key name.
   * @param {String} value The value.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withHeader: function(key, value) {
    this.headers[key] = value;
    return this;
  },

  /**
   * Set the key value pairs provided as request headers.
   *
   * @param {Object} headers A map of key value pairs.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withHeaders: function(headers) {
    for (var key in headers) {
      if (headers.hasOwnProperty(key)) {
        this.headers[key] = headers[key];
      }
    }
    return this;
  },

  /**
   * Sets the XMLHTTPRequest's response type field, which will control how the response is parsed.
   *
   * @param {string} responseType The response type.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withResponseType: function(responseType) {
    this.xhr.responseType = responseType;
    return this;
  },

  /**
   * Sets the handler to invoke when the state of the AJAX request is "open".
   *
   * @param {Function} func The handler function.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withOpenHandler: function(func) {
    this.openHandler = func;
    return this;
  },

  /**
   * Sets the handler to invoke when the state of the AJAX request is "send".
   *
   * @param {Function} func The handler function.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withSendHandler: function(func) {
    this.sendHandler = func;
    return this;
  },

  /**
   * Sets the handler to invoke when the state of the AJAX request is "complete" and the HTTP status in the response is
   * 2xx.
   *
   * @param {Function} func The handler function.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withSuccessHandler: function(func) {
    this.successHandler = func;
    return this;
  },

  /**
   * Sets the handler to invoke when the state of the AJAX request is "unset".
   *
   * @param {Function} func The handler function.
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  withUnsetHandler: function(func) {
    this.unsetHandler = func;
    return this;
  },

  /**
   * Resets the Request back to a base state (basically just the URL + method).  This can be
   * useful if a component is going to make many requests to the same endpoint with different parameters.
   *
   * @returns {Prime.Ajax.Request} This Prime.Ajax.Request.
   */
  reset: function() {
    this.queryParams = null;
    this.data = null;
    this.body = null;
    this.contentType = null;
    return this;
  },

  /* ===================================================================================================================
   * Private Methods
   * ===================================================================================================================*/

   /**
   * @private
   */
  _handler: function() {
    if (this.xhr.readyState === 0) {
      this.unsetHandler(this.xhr);
    } else if (this.xhr.readyState === 1) {
      this.openHandler(this.xhr);
    } else if (this.xhr.readyState === 2) {
      this.sendHandler(this.xhr);
    } else if (this.xhr.readyState === 3) {
      this.loadingHandler(this.xhr);
    } else if (this.xhr.readyState === 4) {
      if (this.xhr.status >= 200 && this.xhr.status <= 299) {
        this.successHandler(this.xhr);
      } else {
        this.errorHandler(this.xhr);
      }
    }
  },

  /**
   * Adds the given name-value pair to the given data String. If the value is an array, it adds multiple values for each
   * piece. Otherwise, it assumes value is a String or can be converted to a String.
   *
   * @param {string} dataString The data String used to determine if an ampersand is necessary.
   * @param {string} name The name of the name-value pair.
   * @param {string|Array} value The value of the name-value pair.
   * @returns {string} The new data string.
   * @private
   */
  _addDataValue: function(dataString, name, value) {
    var result = '';
    if (value instanceof Array) {
      for (var i = 0; i < value.length; i++) {
        result += encodeURIComponent(name) + '=' + encodeURIComponent(value[i]);
        if (i + 1 < value.length) {
          result += '&';
        }
      }
    } else {
      result = encodeURIComponent(name) + '=' + encodeURIComponent(value);
    }

    if (dataString !== null && result !== '') {
      result = dataString + '&' + result;
    } else if (dataString !== null && result === '') {
      result = dataString;
    }

    return result;
  }
};/*
 * Copyright (c) 2012-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @namespace Prime
 */
var Prime = Prime || {};

/**
 * The Prime.Browser namespace. This namespace does not contain any classes, just functions.
 *
 * @namespace Prime.Browser
 */
Prime.Browser = {
  /**
   * Detects the browser name and version.
   */
  detect: function() {
    this.name = this._searchString(this.dataBrowser) || "An unknown browser";
    this.version = this._searchVersion(navigator.userAgent) || this._searchVersion(navigator.appVersion) || "an unknown version";
    this.os = this._searchString(this.dataOS) || "an unknown OS";
  },


  /* ===================================================================================================================
   * Private Methods
   * ===================================================================================================================*/

  /**
   *
   * @param {Object} data The data array.
   * @returns {string} The browser identity String.
   * @private
   */
  _searchString: function(data) {
    for (var i = 0; i < data.length; i++) {
      var dataString = data[i].string;
      var dataProp = data[i].prop;
      this.versionSearchString = data[i].versionSearch || data[i].identity;
      if (dataString && dataString.indexOf(data[i].subString) !== -1) {
        return data[i].identity;
      } else if (dataProp) {
        return data[i].identity;
      }
    }

    return null;
  },

  /**
   *
   * @param {string} dataString The browser data string.
   * @returns {number} The version or null.
   * @private
   */
  _searchVersion: function(dataString) {
    var index = dataString.indexOf(this.versionSearchString);
    if (index === -1) {
      return null;
    }

    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
  },

  dataBrowser: [
    {
      string: navigator.userAgent,
      subString: "Chrome",
      identity: "Chrome"
    },
    {
      string: navigator.userAgent,
      subString: "OmniWeb",
      versionSearch: "OmniWeb/",
      identity: "OmniWeb"
    },
    {
      string: navigator.vendor,
      subString: "Apple",
      identity: "Safari",
      versionSearch: "Version"
    },
    {
      prop: window.opera,
      identity: "Opera",
      versionSearch: "Version"
    },
    {
      string: navigator.vendor,
      subString: "iCab",
      identity: "iCab"
    },
    {
      string: navigator.vendor,
      subString: "KDE",
      identity: "Konqueror"
    },
    {
      string: navigator.userAgent,
      subString: "Firefox",
      identity: "Firefox"
    },
    {
      string: navigator.vendor,
      subString: "Camino",
      identity: "Camino"
    },
    {    // for newer Netscapes (6+)
      string: navigator.userAgent,
      subString: "Netscape",
      identity: "Netscape"
    },
    {
      string: navigator.userAgent,
      subString: "MSIE",
      identity: "Explorer",
      versionSearch: "MSIE"
    },
    {
      string: navigator.userAgent,
      subString: "Gecko",
      identity: "Mozilla",
      versionSearch: "rv"
    },
    {     // for older Netscapes (4-)
      string: navigator.userAgent,
      subString: "Mozilla",
      identity: "Netscape",
      versionSearch: "Mozilla"
    }
  ],
  dataOS: [
    {
      string: navigator.platform,
      subString: "Win",
      identity: "Windows"
    },
    {
      string: navigator.platform,
      subString: "Mac",
      identity: "Mac"
    },
    {
      string: navigator.userAgent,
      subString: "iPhone",
      identity: "iPhone/iPod"
    },
    {
      string: navigator.userAgent,
      subString: "iPad",
      identity: "iPad"
    },
    {
      string: navigator.platform,
      subString: "Linux",
      identity: "Linux"
    }
  ]
};
Prime.Browser.detect();

/*
 * Copyright (c) 2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Data namespace.
 *
 * @namespace Prime.Data
 */
Prime.Data = Prime.Data || {};

/**
 * First-In-First-Out Queue implementation modeled after java.util.Deque interface.
 *
 * @constructor
 */
Prime.Data.Queue = function() {
  Prime.Utils.bindAll(this);
  this._elements = {};
  this._head = 0;
  this._tail = 0;
};

Prime.Data.Queue.constructor = Prime.Data.Queue;
Prime.Data.Queue.prototype = {

  /**
   * Add the element to the head of the queue.
   *
   * @param {Object} element An object to store in the queue.
   * @returns {Prime.Data.Queue} This Element.
   */
  add: function(element) {
    this._elements[this._head] = element;
    this._head++;

    return this;
  },

  /**
   * Return true if the queue is empty.
   *
   * @returns {boolean} True if the queue is empty, false if not.
   */
  isEmpty: function() {
    return this._head === this._tail;
  },

  /**
   * Return but do not remove the tail of the queue. This is the oldest element in the queue.
   *
   * @returns {Object} The object at the tail of the queue, or null if empty.
   */
  peek: function() {
    if (this.isEmpty()) {
      return null;
    }

    return this._elements[this._tail];
  },

  /**
   * Return and remove the tail of the queue. This is the oldest element in the queue.
   *
   * @returns {Object} the object at the tail of the queue, or null if the queue is empty.
   */
  poll: function() {
    if (this.isEmpty()) {
      return null;
    }

    var object = this._elements[this._tail];
    delete this._elements[this._tail];
    this._tail++;

    // The cursor should not go off the end of the queue
    if (this._cursor < this._tail) {
      this._cursor = this._tail;
    }

    return object;
  },

  /**
   * Return the size of the queue.
   *
   * @returns {Number} The size of the queue.
   */
  size: function() {
    return this._head - this._tail;
  }
};/*
 * Copyright (c) 2015-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

Prime.Date = {
  DAYS_IN_MONTH: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],

  /**
   * Return the hour in a 12-hour format. AM and PM are not communicated by the returned hour.
   *
   * @param date {Date} The date object to retrieve the hour from.
   * @returns {Number} The hour of the day between 1 and 12.
   */
  getHourOfDay: function(date) {
    return (date.getHours() + 24) % 12 || 12;
  },

  /**
   * @param year The year.
   * @returns {boolean} True if this is a leap year, otherwise false.
   */
  isLeapYear: function(year) {
    return !((year % 4) || (!(year % 100) && (year % 400)));
  },

  /**
   * Return the number of days in the month.
   * @param year The year, the days in the month may change during a leap year.
   * @param month The month.
   * @returns {Number} The number of days in the month.
   */
  numberOfDaysInMonth: function(year, month) {
    if (month === 1 && this.isLeapYear(year)) {
      return 29;
    } else {
      return Prime.Date.DAYS_IN_MONTH[month];
    }
  },

  /**
   * Adds the given number of days to the given Date.
   *
   * @param date {Date} The date to add the days to.
   * @param number {Number} The number of days to add.
   */
  plusDays: function(date, number) {
    if (number === 0) {
      return;
    }

    var newDate = date.getDate() + number;
    var numberOfDaysInMonth = Prime.Date.numberOfDaysInMonth(date.getFullYear(), date.getMonth());

    if (newDate > 0) {
      while (newDate > numberOfDaysInMonth) {
        Prime.Date.plusMonths(date, 1);
        newDate = newDate - numberOfDaysInMonth;
        numberOfDaysInMonth = Prime.Date.numberOfDaysInMonth(date.getFullYear(), date.getMonth());
      }

      date.setDate(newDate);
    } else {
      while (newDate <= 0) {
        Prime.Date.plusMonths(date, -1);
        numberOfDaysInMonth = Prime.Date.numberOfDaysInMonth(date.getFullYear(), date.getMonth());
        newDate = newDate + numberOfDaysInMonth;
      }

      date.setDate(newDate);
    }
  },

  /**
   * Adds the given number of hours to the given Date. The number can be negative.
   *
   * @param date {Date} The date.
   * @param number {Number} The number of hours to add.
   */
  plusHours: function(date, number) {
    if (number === 0) {
      return;
    }

    var deltaDays = parseInt(number / 24);
    Prime.Date.plusDays(date, deltaDays);

    var deltaHours = number % 24;
    var newHour = date.getHours() + deltaHours;
    if (newHour > 23) {
      Prime.Date.plusDays(date, 1);
      date.setHours(newHour - 24);
    } else if (newHour < 0) {
      Prime.Date.plusDays(date, -1);
      date.setHours(24 + newHour);
    } else {
      date.setHours(newHour);
    }
  },

  /**
   * Adds the given number of minutes to the given Date. The number can be negative.
   *
   * @param date {Date} The date.
   * @param number {Number} The number of minutes to add.
   */
  plusMinutes: function(date, number) {
    if (number === 0) {
      return;
    }

    var deltaHours = parseInt(number / 60);
    Prime.Date.plusHours(date, deltaHours);

    var deltaMinutes = number % 60;
    var newMinute = date.getMinutes() + deltaMinutes;
    if (newMinute > 60) {
      Prime.Date.plusHours(date, 1);
      date.setMinutes(newMinute - 60);
    } else if (newMinute < 0) {
      Prime.Date.plusHours(date, -1);
      date.setMinutes(60 + newMinute);
    } else {
      date.setMinutes(newMinute);
    }
  },

  /**
   * Adds the given number of months to the given Date. The number can be negative.
   *
   * @param date {Date} The date.
   * @param number {Number} The number of months to add.
   */
  plusMonths: function(date, number) {
    if (number === 0) {
      return;
    }

    var deltaYears = parseInt(number / 12);
    var deltaMonths = number % 12;
    var currentMonth = date.getMonth();
    var newMonth = currentMonth + deltaMonths;
    if (newMonth < 0) {
      deltaYears--;
      deltaMonths = newMonth;
      currentMonth = 12;
    } else if (newMonth >= 12) {
      deltaYears++;
      deltaMonths = newMonth - 12;
      currentMonth = 0;
    }

    date.setYear(date.getFullYear() + deltaYears);
    // If the day is 31 and you set month to 1 (February) it will adjust to March 3 (Feb 28 + 3)
    var adjustedMonth = currentMonth + deltaMonths;
    if (date.getDate() > this.DAYS_IN_MONTH[adjustedMonth]) {
      date.setDate(this.DAYS_IN_MONTH[adjustedMonth]);
    }
    date.setMonth(adjustedMonth);
  },

  /**
   * Adds the given number of seconds to the given Date. The number can be negative.
   *
   * @param date {Date} The date.
   * @param number {Number} The number of seconds to add.
   */
  plusSeconds: function(date, number) {
    if (number === 0) {
      return;
    }

    var deltaMinutes = parseInt(number / 60);
    Prime.Date.plusMinutes(date, deltaMinutes);

    var deltaSeconds = number % 60;
    var newSecond = date.getSeconds() + deltaSeconds;
    if (newSecond > 60) {
      Prime.Date.plusMinutes(date, 1);
      date.setSeconds(newSecond - 60);
    } else if (newSecond < 0) {
      Prime.Date.plusMinutes(date, -1);
      date.setSeconds(60 + newSecond);
    } else {
      date.setSeconds(newSecond);
    }
  },

  /**
   * Adds the given number of years to the given Date. The number can be negative.
   *
   * @param date {Date} The date.
   * @param number {Number} The number of years to add.
   */
  plusYears: function(date, number) {
    if (number === 0) {
      return;
    }

    date.setFullYear(date.getFullYear() + number);
  },

  /**
   * Return a string in simplified extended ISO format (ISO 8601) truncated to only return YYYY-MM-DD.
   *
   * For example: new Date(2015, 6, 4) --> 2015-07-04
   *
   * @param date {Date} The date.
   * @returns {String} A date string in the format YYYY-MM-DD.
   */
  toDateOnlyISOString: function(date) {
    if (date instanceof Date) {
      return date.toISOString().substring(0, 10);
    }
    throw TypeError('date parameter must be a Date object.');
  }
};/*
 * Copyright (c) 2013-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};
Prime.Document = Prime.Document || {};


/**
 * Creates an Element class for the given DOM element.
 *
 * @constructor
 * @param {Element|EventTarget} element The element
 */
Prime.Document.Element = function(element) {
  if (!Prime.Utils.isDefined(element.nodeType) || element.nodeType !== 1) {
    throw new TypeError('You can only pass in DOM element Node objects to the Prime.Document.Element constructor');
  }

  Prime.Utils.bindAll(this);
  this.domElement = element;
  this.domElement.customEventListeners = [];
  this.domElement.eventListeners = {};
};

/**
 * Regular expression that captures the tagnames of all the block elements in HTML5.
 *
 * @type {RegExp}
 */
Prime.Document.Element.blockElementRegexp = /^(?:ARTICLE|ASIDE|BLOCKQUOTE|BODY|BR|BUTTON|CANVAS|CAPTION|COL|COLGROUP|DD|DIV|DL|DT|EMBED|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H1|H2|H3|H4|H5|H6|HEADER|HGROUP|HR|LI|MAP|OBJECT|OL|OUTPUT|P|PRE|PROGRESS|SECTION|TABLE|TBODY|TEXTAREA|TFOOT|TH|THEAD|TR|UL|VIDEO)$/;
Prime.Document.Element.mouseEventsRegexp = /^(?:click|dblclick|mousedown|mouseup|mouseover|mousemove|mouseout)$/;
Prime.Document.Element.htmlEventsRegexp = /^(?:abort|blur|change|error|focus|load|reset|resize|scroll|select|submit|unload)$/;
Prime.Document.Element.anonymousId = 1;
Prime.Document.Element.ieAlpaRegexp = /alpha\(opacity=(.+)\)/;

/**
 * Static method that wraps an element in a Prime.Document.Element unless it is already wrapped. In that case, it simply
 * returns the element.
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The element to wrap.
 * @static
 */
Prime.Document.Element.wrap = function(element) {
  return (element instanceof Prime.Document.Element) ? element : new Prime.Document.Element(element);
};

Prime.Document.Element.prototype = {
  /**
   * Adds the given class (or list of space separated classes) to this Element.
   *
   * @param {string} classNames The class name(s) separated by a space.
   * @returns {Prime.Document.Element} This Element.
   */
  addClass: function(classNames) {
    var currentClassName = this.domElement.className;
    if (currentClassName === '') {
      currentClassName = classNames;
    } else {
      var currentClassNameList = this.domElement.className.split(Prime.Utils.spaceRegex);
      var newClassNameList = classNames.split(Prime.Utils.spaceRegex);
      for (var i = 0; i < newClassNameList.length; i++) {
        if (currentClassNameList.indexOf(newClassNameList[i]) === -1) {
          currentClassNameList.push(newClassNameList[i]);
        }
      }

      currentClassName = currentClassNameList.join(' ');
    }

    this.domElement.className = currentClassName;
    return this;
  },

  /**
   * Attaches an event listener to this Element.
   *
   * @param {string} event The name of the event.
   * @param {Function} listener The event listener function.
   * @returns {Prime.Document.Element} This Element.
   */
  addEventListener: function(event, listener) {
    if (event.indexOf(':') === -1) {
      // Traditional event
      this.domElement.eventListeners = this.domElement.eventListeners || {};
      this.domElement.eventListeners[event] = this.domElement.eventListeners[event] || [];
      if (this.domElement.eventListeners[event].indexOf(listener) === -1) {
        this.domElement.eventListeners[event].push(listener);
      }
      this.domElement.addEventListener(event, listener, false);
    } else {
      // Custom event
      this.domElement.customEventListeners = this.domElement.customEventListeners || {};
      this.domElement.customEventListeners[event] = this.domElement.customEventListeners[event] || [];
      if (this.domElement.customEventListeners[event].indexOf(listener) === -1) {
        this.domElement.customEventListeners[event].push(listener);
      }
    }

    return this;
  },

  /**
   * Appends the given element to this element. If the given element already exists in the DOM, it is removed from its
   * current location and placed at the end of this element.
   *
   * @param {Prime.Document.Element|Node} element The element to append.
   * @returns {Prime.Document.Element} This Element.
   */
  appendElement: function(element) {
    var domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
    if (domElement.parentNode) {
      domElement.parentNode.removeChild(domElement);
    }

    this.domElement.appendChild(domElement);
    return this;
  },

  /**
   * Appends the given HTML string to this element.
   *
   * @param {string} html The HTML to append.
   * @returns {Prime.Document.Element} This Element.
   */
  appendHTML: function(html) {
    this.domElement.insertAdjacentHTML('beforeend', html);
    return this;
  },

  /**
   * Inserts this Element (which must be a newly created Element) into the DOM inside at the very end of the given
   * element.
   *
   * @param {Prime.Document.Element|Node} element The element to insert this Element into.
   * @returns {Prime.Document.Element} This Element.
   */
  appendTo: function(element) {
    // Error out for now if this element is in the document so we can punt on cloning for now
    if (this.domElement.parentNode) {
      throw new TypeError('You can only insert new Prime.Document.Elements for now');
    }

    var domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
    if (domElement.parentNode) {
      domElement.appendChild(this.domElement);
    } else {
      throw new TypeError('The element you passed into appendTo is not in the DOM. You can\'t insert a Prime.Document.Element inside an element that isn\'t in the DOM yet.');
    }

    return this;
  },

  /**
   * Fires an event on the Element.
   *
   * @param {string} event The name of the event.
   * @param {Object} [memo] Assigned to the memo field of the event.
   * @param {Object} [target] The target.
   * @param {boolean} [bubbling] If the event is bubbling, defaults to true.
   * @param {boolean} [cancelable] If the event is cancellable, defaults to true.
   * @returns {Prime.Document.Element} This Element.
   */
  fireEvent: function(event, memo, target, bubbling, cancelable) {
    memo = Prime.Utils.isDefined(memo) ? memo : {};
    target = Prime.Utils.isDefined(target) ? target : this;
    bubbling = Prime.Utils.isDefined(bubbling) ? bubbling : true;
    cancelable = Prime.Utils.isDefined(cancelable) ? cancelable : true;

    var evt;
    if (event.indexOf(':') === -1) {
      // Traditional event
      if (document.createEventObject) {
        // Dispatch for IE
        evt = document.createEventObject();
        evt.memo = memo || {};
        evt.cancelBubble = !bubbling;
        this.domElement.fireEvent('on' + event, evt);
      } else if (document.createEvent) {
        // Dispatch for others
        if (Prime.Document.Element.mouseEventsRegexp.exec(event)) {
          evt = document.createEvent("MouseEvents");
          evt.initMouseEvent(event, bubbling, cancelable, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        } else if (Prime.Document.Element.htmlEventsRegexp.exec(event)) {
          evt = document.createEvent("HTMLEvents");
          evt.initEvent(event, bubbling, cancelable);
        } else {
          throw new TypeError('Invalid event [' + event + ']');
        }

        evt.memo = memo || {};
        this.domElement.dispatchEvent(evt);
      } else {
        throw new TypeError('Unable to fire event. Neither createEventObject nor createEvent methods are available');
      }
    } else {
      // Custom event
      this.domElement.customEventListeners[event] = this.domElement.customEventListeners[event] || [];
      evt = {'event': event, 'memo': memo, 'target': target};
      for (var index in this.domElement.customEventListeners[event]) {
        if (this.domElement.customEventListeners[event].hasOwnProperty(index)) {
          this.domElement.customEventListeners[event][index](evt);
        }
      }
    }

    return this;
  },

  /**
   * Fires a custom event on the Element using the given event object rather than creating a new event object. This is
   * useful for pass-through event handling.
   *
   * @param {string} event The name of the event.
   * @param {Object} eventObj The event object to pass to the handlers.
   * @returns {Prime.Document.Element} This Element.
   */
  fireCustomEvent: function(event, eventObj) {
    eventObj = Prime.Utils.isDefined(eventObj) ? eventObj : {};
    if (event.indexOf(':') === -1) {
      throw new TypeError('This method can only be used for custom events');
    }

    // Custom event
    this.domElement.customEventListeners[event] = this.domElement.customEventListeners[event] || [];
    for (var index in this.domElement.customEventListeners[event]) {
      if (this.domElement.customEventListeners[event].hasOwnProperty(index)) {
        this.domElement.customEventListeners[event][index](eventObj);
      }
    }

    return this;
  },

  /**
   * Puts the focus on this element.
   *
   * @returns {Prime.Document.Element} This Element.
   */
  focus: function() {
    this.domElement.focus();
    return this;
  },

  /**
   * Returns the absolute top of this element relative to the document.
   *
   * @returns {number} The number of pixels that this element is from the top of the document.
   */
  getAbsoluteTop: function() {
    var top = 0;
    var e = this.domElement;
    while (e) {
      top += e.offsetTop;
      e = e.offsetParent;
    }

    return top;
  },

  /**
   * Returns the value of the given attribute.
   *
   * @param {string} name The attribute name.
   * @returns {string} This attribute value or null.
   */
  getAttribute: function(name) {
    var attr = this.domElement.attributes.getNamedItem(name);
    if (attr) {
      return attr.value;
    }

    return null;
  },

  /**
   * Returns all of the attributes on the element as an object.
   *
   * @returns {object} This attributes or an empty object if there are no attributes on this element.
   */
  getAttributes: function() {
    var attrs = {};
    if (this.domElement.hasAttributes()) {
      for (var i = 0; i < this.domElement.attributes.length; i++) {
        attrs[this.domElement.attributes[i].name] = this.domElement.attributes[i].value;
      }
    }

    return attrs;
  },

  /**
   * @returns {number} The bottom position (in pixels) of the current element.
   */
  getBottom: function() {
    return this.domElement.getBoundingClientRect().bottom;
  },

  /**
   * Gets the children elements of this Element, optionally reduced to those matching the optional selector.
   *
   * @param {string} [selector] The selector. Optional, if not provided all children will be returned.
   * @returns {Prime.Document.ElementList} The children.
   */
  getChildren: function(selector) {
    if (!Prime.Utils.isDefined(selector)) {
      return new Prime.Document.ElementList(this.domElement.children);
    }

    var matched = [];
    for (var i = 0; i < this.domElement.children.length; i++) {
      var child = this.domElement.children[i];
      if (child.matches(selector)) {
        matched.push(child);
      }
    }

    return new Prime.Document.ElementList(matched);
  },

  /**
   * Gets the class value of the current element. This might be a single class or multiple class names.
   *
   * @returns {string} The class.
   */
  getClass: function() {
    return this.domElement.className;
  },

  /**
   * Gets the computed style information for this Element.
   *
   * @returns {IEElementStyle|CSSStyleDeclaration} The style information.
   */
  getComputedStyle: function() {
    return (this.domElement.currentStyle) ? this.domElement.currentStyle : document.defaultView.getComputedStyle(this.domElement, null);
  },

  /**
   * Returns the dataset if it exists, otherwise, this creates a new dataset object and returns it.
   *
   * @returns {object} This dataset object.
   */
  getDataSet: function() {
    if (this.domElement.dataset) {
      return this.domElement.dataset;
    }

    this.domElement.dataset = {};
    var attrs = this.getAttributes();
    for (var prop in attrs) {
      if (attrs.hasOwnProperty(prop) && prop.indexOf('data-') === 0) {
        var dataName = prop.substring(5).replace(/-([a-z])/g, function(g) {
          return g[1].toUpperCase();
        });
        this.domElement.dataset[dataName] = attrs[prop];
      }
    }
    return this.domElement.dataset;
  },

  /**
   * Returns the data value if it exists, otherwise returns null.
   *
   * @param {string} name The attribute name.
   * @returns {string} This attribute value or null.
   */
  getDataAttribute: function(name) {
    return this.getDataSet()[name];
  },

  /**
   * Get the first child element of this Element, optionally filtered using the optional selector.
   *
   * @param {string} [selector] The selector. Optional.
   * @returns {Prime.Document.Element} The first child element or null if the element has no children or a selector was provided and nothing matched the selector..
   */
  getFirstChild: function(selector) {
    var lastChild = this.getChildren(selector)[0];
    if (!Prime.Utils.isDefined(lastChild)) {
      return null;
    }
    return lastChild;
  },

  /**
   * Gets the viewable height of the Element as an integer value in pixels. This height includes padding and scroll bar but excludes the margin and borders.
   * This is often called the innerHeight of the element.
   *
   * @returns {number} The height as pixels (number) or a string.
   */
  getHeight: function() {
    var computedStyle = this.getComputedStyle();
    var offsetHeight = this.domElement.offsetHeight;
    var borderTop = computedStyle['borderTopWidth'];
    var borderBottom = computedStyle['borderBottomWidth'];
    return offsetHeight - Prime.Utils.parseCSSMeasure(borderTop) - Prime.Utils.parseCSSMeasure(borderBottom);
  },

  /**
   * Gets the inner HTML content of the Element.
   *
   * @returns {string} The HTML content.
   */
  getHTML: function() {
    return this.domElement.innerHTML;
  },

  /**
   * Gets the ID of this element from the domElement.
   *
   * @returns {string} ID The id of the domElement if it exists.
   */
  getId: function() {
    return this.domElement.id;
  },

  /**
   * Get the last child element of this Element, optionally filtered using the optional selector.
   *
   * @param {string} [selector] The selector. Optional.
   * @returns {Prime.Document.Element} The last child element or null if the element has no children or a selector was provided and nothing matched the selector..
   */
  getLastChild: function(selector) {
    var elementList = this.getChildren(selector);
    if (elementList.length > 0) {
      return elementList[elementList.length - 1];
    }
    return null;
  },

  /**
   * @returns {number} The left position (in pixels) of the current element.
   */
  getLeft: function() {
    return this.domElement.getBoundingClientRect().left;
  },

  /**
   * @returns {Prime.Document.Element} This elements next sibling or null.
   */
  getNextSibling: function() {
    var sibling = this.domElement.nextSibling;
    while (sibling !== null && sibling.nodeType !== 1) {
      sibling = sibling.nextSibling;
    }

    if (sibling === null) {
      return null;
    }

    return new Prime.Document.Element(sibling);
  },

  /**
   * The elements offset top in pixels.
   *
   * @returns {number} The offset top.
   */
  getOffsetTop: function() {
    return this.domElement.offsetTop;
  },

  /**
   * Retrieves the opacity value for the Element. This handles the IE alpha filter.
   *
   * @returns {number} The opacity value.
   */
  getOpacity: function() {
    var computedStyle = this.getComputedStyle();
    var opacity = 1.0;
    if (Prime.Browser.name === 'Explorer' && Prime.Browser.version < 9) {
      var filter = computedStyle['filter'];
      if (filter !== undefined && filter !== '') {
        var matches = Prime.Document.Element.ieAlpaRegexp.match(filter);
        if (matches.length > 0) {
          opacity = parseFloat(matches[0]);
        }
      }
    } else {
      opacity = parseFloat(computedStyle['opacity']);
    }

    return opacity;
  },

  /**
   * @returns {Prime.Document.ElementList} If this element is a select box, this returns the options of the select box in
   *          an ElementList.
   */
  getOptions: function() {
    if (this.getTagName() !== 'SELECT') {
      throw new TypeError('You can only get the options for select elements');
    }

    return new Prime.Document.ElementList(this.domElement.options);
  },

  /**
   * Gets the outer height of the element, including the margins. This does not include the padding or borders.
   *
   * @returns {number} The outer height of the element.
   */
  getOuterHeight: function() {
    var computedStyle = this.getComputedStyle();
    var offsetHeight = this.domElement.offsetHeight;
    var marginTop = computedStyle['marginTop'];
    var marginBottom = computedStyle['marginBottom'];
    return offsetHeight + Prime.Utils.parseCSSMeasure(marginTop) + Prime.Utils.parseCSSMeasure(marginBottom);
  },

  /**
   * Gets the outer HTML content of the Element.
   *
   * @returns {string} The outer HTML content.
   */
  getOuterHTML: function() {
    return this.domElement.outerHTML;
  },

  /**
   * Gets the outer width of the element, including the margins. This does not include the padding or borders.
   *
   * @returns {number} The outer width of the element.
   */
  getOuterWidth: function() {
    var computedStyle = this.getComputedStyle();
    var offsetWidth = this.domElement.offsetWidth;
    var marginLeft = computedStyle['marginLeft'];
    var marginRight = computedStyle['marginRight'];
    return offsetWidth + Prime.Utils.parseCSSMeasure(marginLeft) + Prime.Utils.parseCSSMeasure(marginRight);
  },

  /**
   * Returns this element's parent as a Prime.Document.Element.
   *
   * @returns {Prime.Document.Element} This element's parent or null if there is no parent
   */
  getParent: function() {
    if (Prime.Utils.isDefined(this.domElement.parentNode)) {
      return new Prime.Document.Element(this.domElement.parentNode);
    } else {
      return null;
    }
  },

  /**
   * @returns {Prime.Document.Element} This elements previous sibling or null.
   */
  getPreviousSibling: function() {
    var sibling = this.domElement.previousSibling;
    while (sibling !== null && sibling.nodeType !== 1) {
      sibling = sibling.previousSibling;
    }

    if (sibling === null) {
      return null;
    }

    return new Prime.Document.Element(sibling);
  },

  /**
   * @returns {number} The right position (in pixels) of the current element.
   */
  getRight: function() {
    return this.domElement.getBoundingClientRect().right;
  },

  /**
   * @returns {number} The scroll height of this element.
   */
  getScrollHeight: function() {
    return this.domElement.scrollHeight;
  },
  /**
   * @returns {number} The scroll left position of this element.
   */
  getScrollLeft: function() {
    return this.domElement.scrollLeft;
  },

  /**
   * @returns {number} The scroll top position of this element.
   */
  getScrollTop: function() {
    return this.domElement.scrollTop;
  },

  /**
   * @returns {number} The scroll width of this element.
   */
  getScrollWidth: function() {
    return this.domElement.scrollWidth;
  },

  /**
   * Retrieves the selected texts of this Element, if the element is a select. If it is anything else this returns
   * null.
   *
   * @returns {Array} The texts of this Element.
   */
  getSelectedTexts: function() {
    var texts;
    if (this.domElement.tagName === 'SELECT') {
      texts = [];
      for (var i = 0; i < this.domElement.options.length; i++) {
        if (this.domElement.options[i].selected) {
          texts.push(this.domElement.options[i].text);
        }
      }
    } else {
      texts = null;
    }

    return texts;
  },

  /**
   * Retrieves the values of this Element, if the element is a checkbox or select. If it is anything else this returns
   * null.
   *
   * @returns {Array} The values of this Element.
   */
  getSelectedValues: function() {
    var values;
    if (this.domElement.tagName === 'INPUT' && (this.domElement.type === 'checkbox' || this.domElement.type === 'radio')) {
      values = [];
      var name = this.domElement.name;
      var form = Prime.Document.queryUp('form', this.domElement);
      Prime.Document.query('input[name="' + name + '"]', form).each(function(element) {
        if (element.isChecked()) {
          values.push(element.getValue());
        }
      });
    } else if (this.domElement.tagName === 'SELECT') {
      values = [];
      for (var i = 0; i < this.domElement.length; i++) {
        if (this.domElement.options[i].selected) {
          values.push(this.domElement.options[i].value);
        }
      }
    } else {
      values = null;
    }

    return values;
  },

  /**
   * Gets value of a style attribute.
   *
   * @returns {string} The style value.
   */
  getStyle: function(name) {
    name = Prime.Utils.convertStyleName(name);
    return this.domElement.style[name];
  },

  /**
   * @returns {string} The tag name of this element as a string. This is always uppercase.
   */
  getTagName: function() {
    return this.domElement.tagName;
  },

  /**
   * Retrieves the text content of this Element.
   *
   * @returns {string} The text contents of this Element.
   */
  getTextContent: function() {
    return this.domElement.innerText ? this.domElement.innerText : this.domElement.textContent;
  },

  /**
   * @returns {number} The top position (in pixels) of the current element.
   */
  getTop: function() {
    return this.domElement.getBoundingClientRect().top;
  },

  /**
   * Gets the width of the Element as an integer value. This width includes padding and scroll bar but excludes the margin and borders.
   * This is often called the innerWidth of the element.
   *
   * @returns {number} The height in pixels.
   */
  getWidth: function() {
    var computedStyle = this.getComputedStyle();
    var offsetWidth = this.domElement.offsetWidth;
    var borderLeft = computedStyle['borderLeftWidth'];
    var borderRight = computedStyle['borderRightWidth'];
    return offsetWidth - Prime.Utils.parseCSSMeasure(borderLeft) - Prime.Utils.parseCSSMeasure(borderRight);
  },

  /**
   * Retrieves the value attribute of this Element. This works on all checkboxes, radio buttons, text, text areas, and
   * options. However, this does not retrieve the selected options in a select box, checked checkboxes or checked radio
   * buttons. Use the getSelectedValues function for that.
   *
   * @returns {string} The value of this Element.
   */
  getValue: function() {
    return this.domElement.value;
  },

  /**
   * Returns true if the element has one or all class names
   *
   * @param {string} classNames The class name(s) in a string.
   * @returns {boolean} True if all class names are present.
   */
  hasClass: function(classNames) {
    var currentClassNames = this.domElement.className;
    if (currentClassNames === '') {
      return classNames === '';
    }

    var currentClassNameList = currentClassNames.split(Prime.Utils.spaceRegex);
    var findClassNameList = classNames.split(Prime.Utils.spaceRegex);
    for (var i = 0; i < findClassNameList.length; i++) {
      if (currentClassNameList.indexOf(findClassNameList[i]) === -1) {
        return false;
      }
    }

    return true;
  },

  /**
   * Hides the Element by setting the display style to none.
   *
   * @returns {Prime.Document.Element} This Element.
   */
  hide: function() {
    this.domElement.style.display = 'none';
    return this;
  },

  /**
   * Inserts this Element into the DOM after the given element, removing it from it's parent if it's an existing element.
   *
   * @param {Element} element The element to insert this Element after.
   * @returns {Prime.Document.Element} This Element.
   */
  insertAfter: function(element) {
    if (this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }

    var domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
    var parentElement = domElement.parentNode;
    if (parentElement) {
      parentElement.insertBefore(this.domElement, domElement.nextSibling);
    } else {
      throw new TypeError('The element you passed into insertAfter is not in the DOM. You can\'t insert a Prime.Document.Element after an element that isn\'t in the DOM yet.');
    }

    return this;
  },

  /**
   * Inserts this Element into the DOM before the given element, removing it from it's parent if it's an existing element.
   *
   * @param {Element} element The element to insert this Element before.
   * @returns {Prime.Document.Element} This Element.
   */
  insertBefore: function(element) {
    if (this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }

    var domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
    var parentElement = domElement.parentNode;
    if (parentElement) {
      parentElement.insertBefore(this.domElement, domElement);
    } else {
      throw new TypeError('The element you passed into insertBefore is not in the DOM. You can\'t insert a Prime.Document.Element before an element that isn\'t in the DOM yet.');
    }

    return this;
  },

  /**
   * Inserts the given HTML snippet directly after this element.
   *
   * @param {string} html The HTML string.
   * @returns {Prime.Document.Element} This Element.
   */
  insertHTMLAfter: function(html) {
    this.domElement.insertAdjacentHTML('afterend', html);
    return this;
  },

  /**
   * Inserts the given HTML snippet inside this element, before its first child.
   *
   * @param {string} html The HTML string.
   * @returns {Prime.Document.Element} This Element.
   */
  insertHTMLAfterBegin: function(html) {
    this.domElement.insertAdjacentHTML('afterbegin', html);
    return this;
  },

  /**
   * Inserts the given text after this Element.
   *
   * @param {string} text The text to insert.
   * @returns {Prime.Document.Element} This Element.
   */
  insertTextAfter: function(text) {
    if (!this.domElement.parentNode) {
      throw new TypeError('This Element is not currently in the DOM');
    }

    var textNode = document.createTextNode(text);
    this.domElement.parentNode.insertBefore(textNode, this.domElement.nextSibling);

    return this;
  },

  /**
   * Inserts the given text before this Element.
   *
   * @param {string} text The text to insert.
   * @returns {Prime.Document.Element} This Element.
   */
  insertTextBefore: function(text) {
    if (!this.domElement.parentNode) {
      throw new TypeError('This Element is not currently in the DOM');
    }

    var textNode = document.createTextNode(text);
    this.domElement.parentNode.insertBefore(textNode, this.domElement);

    return this;
  },

  /**
   * Returns true if the element matches the provided selector.
   *
   * @param {string} selector to match against the Element
   * @returns {boolean} True if the element matches the selector, false if it does not match the selector.
   */
  is: function(selector) {
    return this.domElement.matches(selector);
  },

  /**
   * Returns whether or not the element is checked. If the element is not a checkbox or a radio this returns false.
   *
   * @returns {boolean} True if the element is selected, false if it isn't or is not a checkbox or a radio.
   */
  isChecked: function() {
    return this.domElement.tagName === 'INPUT' && (this.domElement.type === 'checkbox' || this.domElement.type === 'radio') && this.domElement.checked;
  },

  /**
   * Determines if this element is a child of the given element.
   *
   * @param {Prime.Document.Element|Node} element The element to check to see if this element is a child of.
   * @returns {boolean} True if this element is a child of the given element, false otherwise.
   */
  isChildOf: function(element) {
    var domElement = element instanceof Prime.Document.Element ? element.domElement : element;
    var parent = this.domElement.parentNode;
    while (domElement !== parent && parent !== null) {
      parent = parent.parentNode;
    }

    return domElement === parent;
  },

  /**
   * @returns {boolean} Whether or not this element is disabled according to the disabled property.
   */
  isDisabled: function() {
    return this.domElement.disabled;
  },

  /**
   * @returns {boolean} True if this element has focus.
   */
  isFocused: function() {
    return document.activeElement === this.domElement;
  },

  /**
   * @return {boolean} True if this element is an INPUT, SELECT or TEXTAREA.
   */
  isInput: function() {
    var tagName = this.getTagName();
    return tagName === 'SELECT' || tagName === 'INPUT' || tagName === 'TEXTAREA';
  },

  /**
   * Determines if the this element is inside the given element
   *
   * @param target {Prime.Document.Element} The target element.
   * @returns {boolean} True if this element is inside the given element.
   */
  isInside: function(target) {
    if (this.domElement === document.body || this.domElement === document.documentElement || this.domElement === document) {
      return false;
    }

    var parent = this.getParent();
    while (parent.domElement !== document.body) {
      if (parent.domElement === target.domElement) {
        return true;
      }
      parent = parent.getParent();
    }

    return false;
  },

  /**
   * Returns whether or not the element is selected. If the element is not an option this returns false.
   *
   * @returns {boolean} True if the element is selected, false if it isn't or is not an option.
   */
  isSelected: function() {
    return this.domElement.tagName === 'OPTION' && this.domElement.selected;
  },

  /**
   * Determines if the element is visible using its display and visibility styles.
   *
   * @returns {boolean} True if the element is visible, false otherwise. This might return an invalid value if the element
   * is absolutely positioned and off the screen, but is still technically visible.
   */
  isVisible: function() {
    var computedStyle = this.getComputedStyle();
    return computedStyle['display'] !== 'none' && computedStyle['visibility'] !== 'hidden';
  },

  /**
   * Inserts this Element (which must be a newly created Element) into the DOM inside at the very beginning of the given
   * element.
   *
   * @param {Prime.Document.Element|Element} element The element to insert this Element into.
   * @returns {Prime.Document.Element} This Element.
   */
  prependTo: function(element) {
    // Error out for now if this element is in the document so we can punt on cloning for now
    if (this.domElement.parentNode) {
      throw new TypeError('You can only insert new Prime.Document.Elements for now');
    }

    var domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
    if (domElement.parentNode) {
      domElement.insertBefore(this.domElement, domElement.firstChild);
    } else {
      throw new TypeError('The element you passed into prependTo is not in the DOM. You can\'t insert a Prime.Document.Element inside an element that isn\'t in the DOM yet.');
    }

    return this;
  },

  /**
   * Queries the DOM using the given selector starting at this element and returns all the matched elements.
   *
   * @param {string} selector The selector.
   * @returns {Prime.Document.ElementList} An element list.
   */
  query: function(selector) {
    return Prime.Document.query(selector, this);
  },

  /**
   * Queries the DOM using the given selector starting at this element and returns the first matched element
   * or null if there aren't any matches.
   *
   * @param {string} selector The selector.
   * @returns {Prime.Document.Element} An element or null.
   */
  queryFirst: function(selector) {
    return Prime.Document.queryFirst(selector, this);
  },

  /**
   * Queries the DOM using the given selector starting at this element and returns the last matched element
   * or null if there aren't any matches.
   *
   * @param {string} selector The selector.
   * @returns {Prime.Document.Element} An element or null.
   */
  queryLast: function(selector) {
    return Prime.Document.queryLast(selector, this);
  },

  /**
   * Traverses up the DOM from this element and looks for a match to the selector.
   *
   * @param {string} selector The selector.
   * @returns {Prime.Document.Element} An element or null.
   */
  queryUp: function(selector) {
    return Prime.Document.queryUp(selector, this);
  },

  /**
   * Removes all of the event listeners for the given element.
   *
   * @returns {Prime.Document.Element} This Element.
   */
  removeAllEventListeners: function() {
    for (var event in this.domElement.eventListeners) {
      if (this.domElement.eventListeners.hasOwnProperty(event)) {
        for (var i = 0; i < this.domElement.eventListeners[event].length; i++) {
          this._internalRemoveEventListener(event, this.domElement.eventListeners[event][i]);
        }
      }
    }

    this.domElement.eventListeners = {};
    this.domElement.customEventListeners = {};

    return this;
  },

  /**
   * Removes an attribute from the Element
   *
   * @param {string} name The name of the attribute.
   * @returns {Prime.Document.Element} This Element.
   */
  removeAttribute: function(name) {
    this.domElement.removeAttribute(name);
    return this;
  },

  /**
   * Removes the given class (or list of space separated classes) from this Element.
   *
   * @param {string} classNames The class name(s).
   * @returns {Prime.Document.Element} This Element.
   */
  removeClass: function(classNames) {
    var currentClassName = this.domElement.className;
    if (currentClassName === '') {
      return this;
    }

    var currentClassNameList = currentClassName.split(Prime.Utils.spaceRegex);
    var removeClassNameList = classNames.split(Prime.Utils.spaceRegex);
    for (var i = 0; i < removeClassNameList.length; i++) {
      Prime.Utils.removeFromArray(currentClassNameList, removeClassNameList[i]);
    }

    this.domElement.className = currentClassNameList.join(' ');
    return this;
  },

  /**
   * Removes an event listener for a specific event from this Element, you must have attached using addEventListener
   *
   * @param {string} event The name of the event.
   * @param {*} listener The event listener that was bound.
   * @returns {Prime.Document.Element} This Element.
   */
  removeEventListener: function(event, listener) {
    var listeners;
    if (event.indexOf(':') === -1) {
      this._internalRemoveEventListener(event, listener);
      listeners = this.domElement.eventListeners[event];
    } else {
      listeners = this.domElement.customEventListeners[event];
    }

    if (listeners) {
      Prime.Utils.removeFromArray(listeners, listener);
    }

    return this;
  },

  /**
   * Removes all of the event listeners for the given event from this element.
   *
   * @param {string} event The name of the event to remove the listeners for.
   * @returns {Prime.Document.Element} This Element.
   */
  removeEventListeners: function(event) {
    if (event.indexOf(':') === -1) {
      if (this.domElement.eventListeners[event]) {
        for (var i = 0; i < this.domElement.eventListeners[event].length; i++) {
          this._internalRemoveEventListener(event, this.domElement.eventListeners[event][i]);
        }

        delete this.domElement.eventListeners[event];
      }
    } else {
      if (this.domElement.customEventListeners[event]) {
        delete this.domElement.customEventListeners[event];
      }
    }

    return this;
  },

  /**
   * Removes all of the event listeners for the given pattern from this element.
   *
   * @param {RegExp} pattern The regular expression that matches the names of the events to remove the listeners for.
   * @returns {Prime.Document.Element} This Element.
   */
  removeEventListenersByPattern: function(pattern) {
    for (var event in this.domElement.eventListeners) {
      if (this.domElement.eventListeners.hasOwnProperty(event) && pattern.test(event)) {
        for (var i = 0; i < this.domElement.eventListeners[event].length; i++) {
          this._internalRemoveEventListener(event, this.domElement.eventListeners[event][i]);
        }

        delete this.domElement.eventListeners[event];
      }
    }

    for (event in this.domElement.customEventListeners) {
      if (this.domElement.customEventListeners.hasOwnProperty(event) && pattern.test(event)) {
        delete this.domElement.customEventListeners[event];
      }
    }

    return this;
  },

  /**
   * Removes this Element from the DOM. If the Element isn't in the DOM this does nothing.
   *
   * @returns {Prime.Document.Element} This Element.
   */
  removeFromDOM: function() {
    if (this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }

    return this;
  },

  /**
   * Create a selected range for this element.
   *
   * @returns {Prime.Document.Element} This Element.
   */
  selectElementContents: function() {
    var range;
    var selection;

    if (document.body.createTextRange) {
      /* IE */
      range = document.body.createTextRange();
      range.moveToElementText(this.domElement);
      range.select();
    } else if (window.getSelection) {
      /* Rest of the world */
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(this.domElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    return this;
  },

  /**
   * Scrolls this Element into the visible area of the browser window.
   *
   * @returns {Prime.Document.Element} This Element.
   */
  scrollIntoView: function() {
    this.domElement.scrollIntoView();
    return this;
  },

  /**
   * Scrolls this element to the given horizontal position.
   *
   * @param {number} position The position to scroll the element to.
   * @returns {Prime.Document.Element} This Element.
   */
  scrollLeftTo: function(position) {
    this.domElement.scrollLeft = position;
    return this;
  },

  /**
   * Scrolls this element to the given vertical position.
   *
   * @param {number} position The position to scroll the element to.
   * @returns {Prime.Document.Element} This Element.
   */
  scrollTo: function(position) {
    this.domElement.scrollTop = position;
    return this;
  },

  /**
   * Scrolls this element to the bottom.
   *
   * @returns {Prime.Document.Element} This Element.
   */
  scrollToBottom: function() {
    this.domElement.scrollTop = this.domElement.scrollHeight;
    return this;
  },

  /**
   * Scrolls this element to the top.
   *
   * @returns {Prime.Document.Element} This Element.
   */
  scrollToTop: function() {
    this.domElement.scrollTop = 0;
    return this;
  },

  /**
   * Sets an attribute of the Element.
   *
   * @param {string} name The attribute name
   * @param {number|string} value The attribute value
   * @returns {Prime.Document.Element} This Element.
   */
  setAttribute: function(name, value) {
    if (typeof value === 'number') {
      value = value.toString();
    }
    if (this.domElement.setAttribute) {
      this.domElement.setAttribute(name, value);
    } else {
      var attribute = document.createAttribute(name);
      attribute.nodeValue = value;
      this.domElement.setAttributeNode(attribute);
    }

    return this;
  },

  /**
   * Sets a data- attribute of the Element.
   *
   * Example: setDataAttribute('fooBar', 'baz');
   *  is equivalent to calling setAttribute('data-foo-bar', 'baz');
   *
   * @param {string} name The attribute name
   * @param {number|string} value The attribute value
   * @returns {Prime.Document.Element} This Element.
   */
  setDataAttribute: function(name, value) {
    var dataName = 'data-' + name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    return this.setAttribute(dataName, value);
  },

  /**
   * Sets multiple attributes of the Element from the hash
   *
   * @param {Object} attributes An object of key value style pairs.
   * @returns {Prime.Document.Element} This Element.
   */
  setAttributes: function(attributes) {
    for (var key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        this.setAttribute(key, attributes[key]);
      }
    }
    return this;
  },

  /**
   * If this element is a checkbox or radio button, this sets the checked field on the DOM object equal to the given
   * value.
   *
   * @param {boolean} value The value to set the checked state of this element to.
   * @returns {Prime.Document.Element} This Element.
   */
  setChecked: function(value) {
    this.domElement.checked = value;
    return this;
  },

  /**
   * Sets if this element is disabled or not. This works with any element that responds to the disabled property.
   *
   * @param {boolean} value The value to set the disabled state of this element to.
   * @returns {Prime.Document.Element} This Element.
   */
  setDisabled: function(value) {
    this.domElement.disabled = value;
    return this;
  },

  /**
   * Sets the height of this element using the height style.
   *
   * @param {number|string} height The new height as a number (for pixels) or string.
   * @returns {Prime.Document.Element} This Element.
   */
  setHeight: function(height) {
    if (typeof(height) === 'number') {
      height = height + 'px';
    }

    this.setStyle('height', height);
    return this;
  },

  /**
   * Sets the inner HTML content of the Element.
   *
   * @param {string|Prime.Document.Element} newHTML The new HTML content for the Element.
   * @returns {Prime.Document.Element} This Element.
   */
  setHTML: function(newHTML) {
    if (newHTML !== null) {
      if (newHTML instanceof Prime.Document.Element) {
        this.domElement.innerHTML = newHTML.getHTML();
      } else {
        this.domElement.innerHTML = newHTML;
      }
    }
    return this;
  },

  /**
   * Sets the ID of the Element.
   *
   * @param {string} id The ID.
   * @returns {Prime.Document.Element} This Element.
   */
  setId: function(id) {
    this.domElement.id = id;
    return this;
  },

  /**
   * Sets left position of the element.
   *
   * @param {number|string} left The left position of the element in pixels or as a string.
   * @returns {Prime.Document.Element} This Element.
   */
  setLeft: function(left) {
    var leftString = left;
    if (typeof(left) === 'number') {
      leftString = left + 'px';
    }

    this.setStyle('left', leftString);
    return this;
  },

  /**
   * Sets the opacity of the element. This also sets the IE alpha filter for IE version 9 or younger.
   *
   * @param {number} opacity The opacity.
   * @returns {Prime.Document.Element} This Element.
   */
  setOpacity: function(opacity) {
    if (Prime.Browser.name === 'Explorer' && Prime.Browser.version < 9) {
      this.domElement.style.filter = 'alpha(opacity=' + opacity + ')';
    } else {
      this.domElement.style.opacity = opacity;
    }

    return this;
  },

  /**
   * Sets the selected value on the element. If the element is not an option or radio, this does nothing.
   *
   * @param {boolean} selected Selected value.
   */
  setSelected: function(selected) {
    this.domElement.selected = selected;
  },

  /**
   * Sets the selected value(s) of this element. This works on selects, checkboxes, and radio buttons.
   *
   * @param {string} [arguments] The value(s) to select (var args).
   * @returns {Prime.Document.Element} This Element.
   */
  setSelectedValues: function() {
    // Handle the case where they passed in an array
    var values = null;
    if (arguments.length === 1 && Prime.Utils.isArray(arguments[0])) {
      values = arguments[0];
    } else {
      values = Array.prototype.slice.call(arguments, 0);
    }

    if (this.domElement.tagName === 'INPUT' && (this.domElement.type === 'checkbox' || this.domElement.type === 'radio')) {
      var name = this.domElement.name;
      var form = Prime.Document.queryUp('form', this.domElement);
      Prime.Document.query('input[name="' + name + '"]', form).each(function(element) {
        element.setChecked(values.indexOf(element.getValue()) !== -1);
      });
    } else if (this.domElement.tagName === 'SELECT') {
      for (var i = 0; i < this.domElement.length; i++) {
        this.domElement.options[i].selected = values.indexOf(this.domElement.options[i].value) !== -1;
      }
    }

    return this;
  },

  /**
   * Sets the style for the name of this Element.
   *
   * @param {string} name The style name.
   * @param {number|string} value The style value.
   * @returns {Prime.Document.Element} This Element.
   */
  setStyle: function(name, value) {
    if (typeof value === 'number') {
      value = value.toString();
    }
    this.domElement.style[name] = value;
    return this;
  },

  /**
   * Sets multiple styles of this Element.
   *
   * @param {Object} styles An object with key value pairs for the new style names and values.
   * @returns {Prime.Document.Element} This Element.
   */
  setStyles: function(styles) {
    for (var key in styles) {
      if (styles.hasOwnProperty(key)) {
        this.setStyle(key, styles[key]);
      }
    }
    return this;
  },

  /**
   * Sets the textContent of the Element.
   *
   * @param {number|string|Prime.Document.Element} newText The new text content for the Element.
   * @returns {Prime.Document.Element} This Element.
   */
  setTextContent: function(newText) {
    if (newText !== null) {
      if (newText instanceof Prime.Document.Element) {
        this.domElement.textContent = newText.getTextContent();
      } else {
        if (typeof newText === 'number') {
          newText = newText.toString();
        }
        this.domElement.textContent = newText;
      }
    }
    return this;
  },

  /**
   * Sets top position of the element.
   *
   * @param {number|string} top The top position of the element in pixels or as a string.
   * @returns {Prime.Document.Element} This Element.
   */
  setTop: function(top) {
    var topString = top;
    if (typeof(top) === 'number') {
      topString = top + 'px';
    }

    this.setStyle('top', topString);
    return this;
  },

  /**
   * Sets the value of this Element. This handles checkboxes, radio buttons, options, text inputs and text areas. This
   * works on checkboxes and radio buttons, but it change the value attribute on them rather than checking and unchecking
   * the buttons themselves. To check and uncheck the buttons, use the select method.
   *
   * @param {number|string} value The new value.
   * @returns {Prime.Document.Element} This Element.
   */
  setValue: function(value) {
    if (typeof value === 'number') {
      value = value.toString();
    }
    this.domElement.value = value;
    return this;
  },

  /**
   * Sets the width of this element using the height style.
   *
   * @param {number|string} width The new width as a number (for pixels) or string.
   * @returns {Prime.Document.Element} This Element.
   */
  setWidth: function(width) {
    if (typeof(width) === 'number') {
      width = width + 'px';
    }

    this.setStyle('width', width);
    return this;
  },

  /**
   * Shows the Element by setting the display style first to empty string. After this, the elements computed style is
   * checked to see if the element is still not visible. If that is true, the element must have a CSS style defined in
   * a stylesheet that is setting it to display: none. In this case, we determine if the element is a block level element
   * and either set the display to 'block' or 'inline'.
   *
   * @param {string} [displayValue] The display value to use for the show. This defaults to the W3C standard display
   * setting depending on the type of element you are showing. For example, INPUT is inline and DIV is block.
   * @returns {Prime.Document.Element} This Element.
   */
  show: function(displayValue) {
    if (Prime.Utils.isDefined(displayValue)) {
      this.domElement.style.display = displayValue;
      return this;
    }

    this.domElement.style.display = '';

    var computedDisplay = this.getComputedStyle()['display'];
    if (computedDisplay === 'none') {
      if (!Prime.Utils.isDefined(displayValue)) {
        displayValue = (Prime.Document.Element.blockElementRegexp.test(this.domElement.tagName)) ? 'block' : 'inline';
      }

      this.domElement.style.display = displayValue;
    }

    return this;
  },

  /**
   * Toggle the class on this element.
   *
   * @param {string} className The class name.
   * @returns {Prime.Document.Element} This Element.
   */
  toggleClass: function(className) {
    if (this.hasClass(className)) {
      this.removeClass(className);
    } else {
      this.addClass(className);
    }

    return this;
  },

  /**
   * Removes this element from the DOM while preserving the inner HTML.
   *
   * Example, call unwrap on the italic element:
   *   <strong>Hello</strong><italic> World </italic> --> <strong>Hello</strong> World
   *
   * @returns {Prime.Document.Element} This Element.
   */
  unwrap: function() {
    var parent = this.getParent().domElement;
    while (this.domElement.firstChild) {
      parent.insertBefore(this.domElement.firstChild, this.domElement);
    }

    this.removeFromDOM();
  },

  /**
   * Builds a new element using the given HTML snippet (currently this only supports the tag).
   *
   * @param {string} elementString The element string.
   * @param {Object} [properties={}] The properties for the new element.
   * @returns {Prime.Document.Element} A new Prime.Document.Element.
   */
  wrapInnerHTML: function(elementString, properties) {
    var element = Prime.Document.newElement(elementString, properties);
    element.setHTML(this.getOuterHTML());
    this.domElement.outerHTML = element.domElement.outerHTML;
    return this;
  },

  /* ===================================================================================================================
   * Private Methods
   * ===================================================================================================================*/

  /**
   * Removes the event listener proxy from this element.
   *
   * @param {string} event The event name.
   * @param {Function} listener The listener function.
   * @private
   */
  _internalRemoveEventListener: function(event, listener) {
    if (event.indexOf(':') === -1) {
      // Traditional event
      if (this.domElement.removeEventListener) {
        this.domElement.removeEventListener(event, listener, false);
      } else if (this.domElement.detachEvent) {
        this.domElement.detachEvent('on' + event, listener);
      } else {
        throw new TypeError('Unable to remove event from the element. Neither removeEventListener nor detachEvent methods are available');
      }
    } else if (this.domElement.customEventListeners[event]) {
      // Custom event
      var customListeners = this.domElement.customEventListeners[event];
      Prime.Utils.removeFromArray(customListeners, listener);
    }
  }
};


/* ===================================================================================================================
 * Polyfill
 * ===================================================================================================================*/

(function() {
  if (!Element.prototype.matches) {
    Element.prototype.matches = function(selector) {
      var domElement = this;
      var matches = (domElement.parentNode || domElement.document).querySelectorAll(selector);
      var i = 0;

      while (matches[i] && matches[i] !== domElement) {
        i++;
      }

      return matches[i] ? true : false;
    };
  }
})();
/*
 * Copyright (c) 2013-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};
Prime.Document = Prime.Document || {};


/**
 * Constructs an ElementList object using the given array containing DOMElements or Prime.Document.Element objects, or the NodeList containing Node objects.
 *
 * @constructor
 * @param {Array|NodeList} elements An array containing DOMElement or Prime.Document.Element objects, or a NodeList containing Node objects.
 */
Prime.Document.ElementList = function(elements) {
  Prime.Utils.bindAll(this);

  // NodeList does not inherit from Array so do not assume object type.
  this.length = elements.length;
  for (var i = 0; i < elements.length; i++) {
    if (elements[i] instanceof Prime.Document.Element) {
      this[i] = elements[i];
    } else {
      this[i] = new Prime.Document.Element(elements[i]);
    }
  }
};

Prime.Document.ElementList.prototype = {

  /**
   * Shorthand for calling {@link Prime.Document.Element.addClass} on each Element in the ElementList.
   *
   * Adds the given class (or list of space separated classes) to all Elements in this ElementList.
   *
   * @param {string} classNames The class name(s) separated by a space.
   * @returns {Prime.Document.ElementList} This ElementList.
   */
  addClass: function(classNames) {
    return this._proxyToElement('addClass', classNames);
  },

  /**
   * Shorthand for calling {@link Prime.Document.Element.addEventListener} on each Element in the ElementList.
   *
   * Attaches an event listener to all Elements in this ElementList.
   *
   * @param {string} event The name of the event.
   * @param {Function} listener The event listener function.
   * @returns {Prime.Document.Element} This Element.
   */
  addEventListener: function(event, listener) {
    return this._proxyToElement('addEventListener', event, listener);
  },

  /**
   * Iterates over each of the Prime.Document.Element objects in this ElementList and calls the given function for each one.
   * The <code>this</code> variable inside the function will be managed by the caller of this method. You should use the
   * <code>bind</code> method on the Function object if you want to manage the <code>this</code> reference.
   *
   * The function can optionally take two parameters. The first parameter is the current element. The second parameter
   * is the current index.
   *
   * @param {Function} iterationFunction The function to call.
   * @returns {Prime.Document.ElementList} This ElementList.
   */
  each: function(iterationFunction) {
    for (var i = 0; i < this.length; i++) {
      iterationFunction(this[i], i);
    }

    return this;
  },

  /**
   * Shorthand for calling {@link Prime.Document.Element.hide} on each Element in the ElementList.
   *
   * Hides the Element by setting the display style to none.
   *
   * @returns {Prime.Document.ElementList} This ElementList.
   */
  hide: function() {
    return this._proxyToElement('hide');
  },

  /**
   * Returns the indexOf the element that matches the parameter, either Prime Element or DOMElement.
   *
   * @param {Prime.Document.Element|Element} element The element to look for
   * @returns {number} The position of the element in the list, or -1 if not present.
   */
  indexOf: function(element) {
    var domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;

    for (var i = 0; i < this.length; i++) {
      if (this[i].domElement == domElement) {
        return i;
      }
    }

    return -1;
  },

  /**
   * Removes all the matched elements in the ElementList from the DOM.
   *
   * @returns {Prime.Document.ElementList} This ElementList.
   */
  removeAllFromDOM: function() {
    for (var i = 0; i < this.length; i++) {
      this[i].removeFromDOM();
    }

    return this;
  },

  /**
   * Shorthand for calling {@link Prime.Document.Element.removeClass} on each Element in the ElementList.
   *
   * Removes the given class (or list of space separated classes) from all Elements in this ElementList.
   *
   * @param {string} classNames The class name(s) separated by a space.
   * @returns {Prime.Document.ElementList} This ElementList.
   */
  removeClass: function(classNames) {
    return this._proxyToElement('removeClass', classNames);
  },

  /**
   * Shorthand for calling {@link Prime.Document.Element.setChecked} on each Element in the ElementList.
   *
   * If this element is a checkbox or radio button, this sets the checked field on the DOM object equal to the given
   * value.
   *
   * @param {boolean} value The value to set the checked state of this element to.
   * @returns {Prime.Document.ElementList} This ElementList.
   */
  setChecked: function(value) {
    return this._proxyToElement('setChecked', value);
  },

  /**
   * Shorthand for calling {@link Prime.Document.Element.setDisabled} on each Element in the ElementList.
   *
   * Sets if this element is disabled or not. This works with any element that responds to the disabled property.
   *
   * @param {boolean} value The value to set the disabled state of this element to.
   * @returns {Prime.Document.ElementList} This ElementList.
   */
  setDisabled: function(value) {
    return this._proxyToElement('setDisabled', value);
  },

  /**
   * Shorthand for calling {@link Prime.Document.Element.show} on each Element in the ElementList.
   *
   * Shows the element.
   *
   * @returns {Prime.Document.ElementList} This ElementList.
   */
  show: function() {
    return this._proxyToElement('show');
  },

  /* ===================================================================================================================
   * Private methods
   * ===================================================================================================================*/

  /**
   * Proxy function calls to each Element in the ElementList.
   * The first parameter is function name, followed by a variable length of arguments.
   *
   * Example usage: this._proxyToElement('addClass', classNames);
   *
   * @returns {Prime.Document.ElementList}
   * @private
   */
  _proxyToElement: function() {
    var args = Array.prototype.slice.apply(arguments);
    for (var i = 0; i < this.length; i++) {
      this[i][args[0]].apply(this[i], args.slice(1));
    }
    return this;
  }
};/*
 * Copyright (c) 2012-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Document namespace. This namespace contains a number of classes (Element, ElementList, etc.) and a number of
 * namespace level functions.
 *
 * @namespace Prime.Document
 */
Prime.Document = Prime.Document || {};

Prime.Document.readyFunctions = [];
Prime.Document.tagRegexp = /^<(\w+)\s*\/?>.*(?:<\/\1>)?$/;
Prime.Document.bodyElement = null;

/**
 * Attaches an event listener to the document, returning the handler proxy.
 *
 * @param {string} event The name of the event.
 * @param {Function} listener The event listener function.
 * @returns {Prime.Document} The Prime.Document object so you can chain method calls together.
 */
Prime.Document.addEventListener = function(event, listener) {
  if (event.indexOf(':') === -1) {
    // Traditional event
    document.eventListeners = document.eventListeners || {};
    document.eventListeners[event] = document.eventListeners[event] || [];
    document.eventListeners[event].push(listener);
    document.addEventListener(event, listener, false);
  } else {
    // Custom event
    document.customEventListeners = document.customEventListeners || {};
    document.customEventListeners[event] = document.customEventListeners[event] || [];
    document.customEventListeners[event].push(listener);
  }

  return Prime.Document;
};

/**
 * Returns the height of the document.
 *
 * @returns {number} The height of the document in pixels.
 */
Prime.Document.getHeight = function() {
  var body = document.body;
  var html = document.documentElement;

  return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
};

/**
 * Returns the width of the document.
 *
 * @returns {number} The width of the document in pixels.
 */
Prime.Document.getWidth = function() {
  var body = document.body;
  var html = document.documentElement;

  return Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
};

/**
 * Builds a new document using the given HTML document.
 *
 * @param {string} documentString The HTML string to build the document.
 * @returns {Document} A new document.
 */
Prime.Document.newDocument = function(documentString) {
  return new DOMParser().parseFromString(documentString, "text/html");
};

/**
 * Builds a new element using the given HTML snippet (currently this only supports the tag).
 *
 * @param {string} elementString The element string.
 * @param {Object} [properties={}] The properties for the new element.
 * @returns {Prime.Document.Element} A new Prime.Document.Element.
 */
Prime.Document.newElement = function(elementString, properties) {
  properties = Prime.Utils.isDefined(properties) ? properties : {};
  var result = Prime.Document.tagRegexp.exec(elementString);
  if (result === null) {
    throw new TypeError('Invalid string to create a new element [' + elementString + ']. It should look like <a/>');
  }

  var element = new Prime.Document.Element(document.createElement(result[1]));
  for (var key in properties) {
    if (properties.hasOwnProperty(key)) {
      if (key === 'id') {
        element.setId(properties[key]);
      } else {
        element.setAttribute(key, properties[key]);
      }
    }
  }

  return element;
};

/**
 * Adds the given callback function to the list of functions to invoke when the document is ready. If the document is
 * already fully loaded, this simply invokes the callback directly.
 *
 * @param {Function} callback The callback function.
 */
Prime.Document.onReady = function(callback) {
  if (document.readyState === 'complete') {
    callback();
  } else {
    // If this is the first call, register the event listener on the document
    if (this.readyFunctions.length === 0) {
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', Prime.Document._callReadyListeners, false);
      } else if (document.attachEvent) {
        document.attachEvent('onreadystatechange', Prime.Document._callReadyListeners);
      } else {
        throw new TypeError('No way to attach an event to the document. What browser are you running?');
      }
    }

    // Add the callback
    this.readyFunctions.push(callback);
  }
};

/**
 * Take the HTML string and append it to the body.
 *
 * @param {string} html The HTML to append
 */
Prime.Document.appendHTML = function(html) {
  document.body.insertAdjacentHTML('beforeend', html);
};

/**
 * Moves the given element by appending it to the element provided by the second argument.
 *
 * @param {Element|Prime.Document.Element} element The element to move.
 * @param {Element|Prime.Document.Element} appendToElement [appendToElement=body] The element to append to, defaults to the body if not provided.
 * @returns {Prime.Document.Element} The element that has been moved.
 */
Prime.Document.move = function(element, appendToElement) {
  element = (element instanceof Prime.Document.Element) ? element : new Prime.Document.Element(element);

  if (!Prime.Utils.isDefined(appendToElement)) {
    appendToElement = new Prime.Document.Element(document.body);
  } else {
    appendToElement = (appendToElement instanceof Prime.Document.Element) ? appendToElement : new Prime.Document.Element(appendToElement);
  }

  appendToElement.appendHTML(element.getOuterHTML());
  element.removeFromDOM();
  return appendToElement.getLastChild();
};

/**
 * Queries the DOM using the given selector starting at the given element and returns all the matched elements.
 *
 * @param {string} selector The selector.
 * @param {Element|Document|Prime.Document.Element} [element=document] The starting point for the search (defaults to document if not provided).
 * @returns {Prime.Document.ElementList} An element list.
 */
Prime.Document.query = function(selector, element) {
  var domElement = null;
  if (!Prime.Utils.isDefined(element)) {
    domElement = document;
  } else {
    domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
  }

  var elements = domElement.querySelectorAll(selector);
  return new Prime.Document.ElementList(elements);
};

/**
 * Queries the DOM for an element that has the given ID.
 *
 * @param {string} id The ID.
 * @returns {Prime.Document.Element} The element or null.
 */
Prime.Document.queryById = function(id) {
  var element = document.getElementById(id);
  if (!element) {
    return null;
  }

  return new Prime.Document.Element(element);
};

/**
 * Queries the DOM using the given selector starting at the given element and returns the first matched element
 * or null if there aren't any matches.
 *
 * @param {string} selector The selector.
 * @param {Element|Document|Prime.Document.Element} [element=document] The starting point for the search (defaults to document if not provided).
 * @returns {Prime.Document.Element} An element or null.
 */
Prime.Document.queryFirst = function(selector, element) {
  var domElement = null;
  if (!Prime.Utils.isDefined(element)) {
    domElement = document;
  } else {
    domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
  }

  domElement = domElement.querySelector(selector);
  if (domElement === null) {
    return null;
  }

  return new Prime.Document.Element(domElement);
};

/**
 * Queries the DOM using the given selector starting at the given element and returns the last matched element
 * or null if there aren't any matches.
 *
 * @param {string} selector The selector.
 * @param {Element|Document|Prime.Document.Element} [element=document] The starting point for the search (defaults to document if not provided).
 * @returns {Prime.Document.Element} An element or null.
 */
Prime.Document.queryLast = function(selector, element) {
  var domElement = null;
  if (!Prime.Utils.isDefined(element)) {
    domElement = document;
  } else {
    domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
  }

  var domElements = domElement.querySelectorAll(selector);
  if (domElements.length === 0) {
    return null;
  }

  return new Prime.Document.Element(domElements[domElements.length - 1]);
};

/**
 * Traverses up the DOM from the starting element and looks for a match to the selector.
 *
 * @param {string} selector The selector.
 * @param {Prime.Document.Element|Element} element The starting point for the upward traversal.
 * @returns {Prime.Document.Element} An element or null.
 */
Prime.Document.queryUp = function(selector, element) {
  var domElement = null;
  if (!Prime.Utils.isDefined(element)) {
    throw new SyntaxError('Missing required parameter. The element is required.');
  } else {
    domElement = (element instanceof Prime.Document.Element) ? element.domElement : element;
  }

  domElement = domElement.parentNode;
  while (domElement !== null && !domElement.matches(selector)) {
    domElement = domElement.parentNode;
    if (domElement === document) {
      domElement = null;
    }
  }

  if (domElement !== null) {
    return new Prime.Document.Element(domElement);
  }

  return null;
};

/**
 * Removes an event handler for a specific event from the document that you attached using addEventListener
 *
 * @param {string} event The name of the event.
 * @param {Function} listener The listener function.
 */
Prime.Document.removeEventListener = function(event, listener) {
  if (document.removeEventListener) {
    document.removeEventListener(event, listener, false);
  } else if (document.detachEvent) {
    document.detachEvent('on' + event, listener);
  } else {
    throw new TypeError('Unable to remove event from the element. Neither removeEventListener nor detachEvent methods are available');
  }
};

/* ===================================================================================================================
 * Private Methods
 * ===================================================================================================================*/

/**
 * Calls all the registered document ready listeners.
 *
 * @private
 */
Prime.Document._callReadyListeners = function() {
  if (document.addEventListener || document.readyState === 'complete') {
    var readyFunction;
    while (readyFunction = Prime.Document.readyFunctions.shift()) {
      readyFunction();
    }
  }

  if (document.removeEventListener) {
    document.removeEventListener('DOMContentLoaded', Prime.Document._callReadyListeners, false);
  } else {
    document.detachEvent('onreadystatechange', Prime.Document._callReadyListeners);
  }
};

/* ===================================================================================================================
 * Globals
 * ===================================================================================================================*/

/**
 * Setup the body static.
 */
Prime.Document.onReady(function() {
  Prime.Document.bodyElement = new Prime.Document.Element(document.body);
});

/* ===================================================================================================================
 * Polyfill
 * ===================================================================================================================*/

/* https://developer.mozilla.org/en-US/docs/Web/API/DOMParser */
(function(DOMParser) {
  'use strict';

  var proto = DOMParser.prototype;
  var nativeParse = proto.parseFromString;

  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if ((new DOMParser()).parseFromString('', 'text/html')) {
      // text/html parsing is natively supported
      return;
    }
  } catch (ex) {}

  proto.parseFromString = function(markup, type) {
    if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
      var doc = document.implementation.createHTMLDocument('');
      if (markup.toLowerCase().indexOf('<!doctype') > -1) {
        doc.documentElement.innerHTML = markup;
      } else {
        doc.body.innerHTML = markup;
      }
      return doc;
    } else {
      return nativeParse.apply(this, arguments);
    }
  };
}(DOMParser));/*
 * Copyright (c) 2012-2015, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Effects namespace. This contains all of the effect abstract and implementation classes.
 *
 * @namespace Prime.Effects
 */
Prime.Effects = Prime.Effects || {};


/**
 * Constructs a BaseTransition for the given element.
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element the effect will be applied to.
 * @param {number} endValue The end value for the transition.
 * @constructor
 */
Prime.Effects.BaseTransition = function(element, endValue) {
  Prime.Utils.bindAll(this);
  this.element = Prime.Document.Element.wrap(element);
  this.duration = 1000;
  this.endFunction = null;
  this.endValue = endValue;
  this.iterations = 20;
};

Prime.Effects.BaseTransition.prototype = {
  /**
   * Sets the function that is called when the effect has completed.
   *
   * @param {Function} endFunction The function that is called when the effect is completed.
   * @returns {Prime.Effects.BaseTransition} This Effect.
   */
  withEndFunction: function(endFunction) {
    this.endFunction = endFunction;
    return this;
  },

  /**
   * Sets the duration of the fade-out effect.
   *
   * @param {number} duration The duration in milliseconds.
   * @returns {Prime.Effects.BaseTransition} This Effect.
   */
  withDuration: function(duration) {
    if (duration < 100) {
      throw new TypeError('Duration should be greater than 100 milliseconds or it won\'t really be noticeable');
    }

    this.duration = duration;
    return this;
  },

  /*
   * Protected functions
   */

  /**
   * Changes an integer style property of the Element iteratively over a given period of time from one value to another
   * value.
   *
   * @protected
   * @param {Function} getFunction The function on the element to call to get the current value for the transition.
   * @param {Function} setFunction The function on the element to call to set the new value for the transition.
   */
  _changeNumberStyleIteratively: function(getFunction, setFunction) {
    var currentValue = getFunction.call(this.element);
    var step = Math.abs(this.endValue - currentValue) / this.iterations;

    // Close around ourselves
    var self = this;
    var stepFunction = function(last) {
      if (last) {
        currentValue = self.endValue;
      } else {
        if (currentValue < self.endValue) {
          currentValue += step;
        } else {
          currentValue -= step;
        }
      }

      setFunction.call(self.element, currentValue);
    };

    Prime.Utils.callIteratively(this.duration, this.iterations, stepFunction, this._internalEndFunction);
  },

  /* ===================================================================================================================
   * Private Methods
   * ===================================================================================================================*/

  /**
   * Handles the call back at the end.
   *
   * @private
   */
  _internalEndFunction: function() {
    if (this._subclassEndFunction) {
      this._subclassEndFunction(this);
    }

    if (this.endFunction) {
      this.endFunction(this);
    }
  }
};

/**
 * Constructs a new Fade for the given element. The fade effect uses the CSS opacity style and supports the IE alpha
 * style. The duration defaults to 1000 milliseconds (1 second). This changes the opacity over the duration from 1.0 to
 * 0.0. At the end, this hides the element so that it doesn't take up any space.
 *
 * @constructor
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element to fade out.
 */
Prime.Effects.Fade = function(element) {
  Prime.Effects.BaseTransition.call(this, element, 0.0);
};
Prime.Effects.Fade.prototype = Object.create(Prime.Effects.BaseTransition.prototype);
Prime.Effects.Fade.constructor = Prime.Effects.Fade;

/**
 * Internal call back at the end of the transition. This hides the element so it doesn't take up space.
 *
 * @private
 */
Prime.Effects.Fade.prototype._subclassEndFunction = function() {
  this.element.hide();
};

/**
 * Executes the fade effect on the element using the opacity style.
 */
Prime.Effects.Fade.prototype.go = function() {
  this._changeNumberStyleIteratively(this.element.getOpacity, this.element.setOpacity);
};


/**
 * Constructs a new Appear for the given element. The appear effect uses the CSS opacity style and supports the IE
 * alpha style. The duration defaults to 1000 milliseconds (1 second). This first sets the opacity to 0, then it shows
 * the element and finally it raises the opacity.
 *
 * @constructor
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element to appear.
 * @param {number} [opacity=1.0] The final opacity to reach when the effect is complete. Defaults to 1.0.
 */
Prime.Effects.Appear = function(element, opacity) {
  if (!Prime.Utils.isDefined(opacity)) {
    opacity = 1.0;
  }
  Prime.Effects.BaseTransition.call(this, element, opacity);
};
Prime.Effects.Appear.prototype = Object.create(Prime.Effects.BaseTransition.prototype);
Prime.Effects.Appear.constructor = Prime.Effects.Appear;

/**
 * Executes the appear effect on the element using the opacity style.
 */
Prime.Effects.Appear.prototype.go = function() {
  this.element.setOpacity(0.0);
  this.element.show();
  this._changeNumberStyleIteratively(this.element.getOpacity, this.element.setOpacity);
};

/**
 * Constructs a new ScrollTo for the given element. The duration defaults to 1000 milliseconds (1 second).
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element to scroll.
 * @param {number} position The position to scroll the element to.
 * @constructor
 */
Prime.Effects.ScrollTo = function(element, position) {
  this.axis = 'vertical';
  Prime.Effects.BaseTransition.call(this, element, position);
};

Prime.Effects.ScrollTo.prototype = Object.create(Prime.Effects.BaseTransition.prototype);
Prime.Effects.ScrollTo.constructor = Prime.Effects.ScrollTo;

/**
 * Set the scroll axis, either 'horizontal' or 'vertical'. Default is 'vertical'.
 *
 * @param {string} axis The axis to scroll.
 * @returns {Prime.Effects.ScrollTo}
 */
Prime.Effects.ScrollTo.prototype.withAxis = function(axis) {
  this.axis = axis || 'vertical';
  return this;
};

/**
 * Executes the scroll effect on the element.
 */
Prime.Effects.ScrollTo.prototype.go = function() {
  if (this.axis === 'vertical') {
    this._changeNumberStyleIteratively(this.element.getScrollTop, this.element.scrollTo);
  } else {
    this._changeNumberStyleIteratively(this.element.getScrollLeft, this.element.scrollLeftTo);
  }
};/*
 * Copyright (c) 2013-2015, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Events namespace. This currently only contains constants for different event types.
 *
 * @namespace Prime.Events
 */
Prime.Events = Prime.Events || {};

/**
 * The Prime.Events.Keys namespace. This currently only contains constants for different key codes.
 *
 * @namespace Prime.Events.Keys
 */
Prime.Events.Keys = Prime.Events.Keys || {};

Prime.Events.Keys.BACKSPACE = 8;
Prime.Events.Keys.ENTER = 13;
Prime.Events.Keys.ESCAPE = 27;
Prime.Events.Keys.SPACE = 32;
Prime.Events.Keys.TAB = 9;
Prime.Events.Keys.LEFT_ARROW = 37;
Prime.Events.Keys.UP_ARROW = 38;
Prime.Events.Keys.RIGHT_ARROW = 39;
Prime.Events.Keys.DOWN_ARROW = 40;
Prime.Events.Keys.DELETE = 46;
/*
 * Copyright (c) 2013, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};


/**
 * A Javascript Object that can serve to generate Prime.Document.Element from a source string and optional parameters.
 *
 * @constructor
 * @param {string} template The String that defines the source of the template.
 */
Prime.Template = function(template) {
  Prime.Utils.bindAll(this);
  this.init(template);
};

Prime.Template.prototype = {
  init: function(template) {
    this.template = template;
  },

  /**
   * Generates a String from the given parameterHash.  Provide a hash of String keys to values.
   * Keys can be regular text strings, in which case it will look for and replace #{key} as with the value.  You can
   * also make the key a String "/key/", which will be converted to a Regex and run.
   *
   * For the value you can provide a straight up String, int, etc, or you can provide a function which will be called
   * to provide the value
   *
   * @param {Object} parameters An object that contains the parameters for the template to replace.
   * @returns {string} The result of executing the template.
   */
  generate: function(parameters) {
    parameters = Prime.Utils.isDefined(parameters) ? parameters : {};
    var templateCopy = new String(this.template);
    for (var key in parameters) {
      if (parameters.hasOwnProperty(key)) {
        var value = parameters[key];
        var expressedValue;
        if (typeof(value) === 'function') {
          expressedValue = value();
        } else {
          expressedValue = value;
        }

        if (key.indexOf('/') === 0 && key.lastIndexOf('/') === key.length - 1) {
          templateCopy = templateCopy.replace(new RegExp(key.substring(1, key.length - 1), "g"), expressedValue);
        } else {
          var expressedKey = "#{" + key + "}";
          while (templateCopy.indexOf(expressedKey) !== -1) {
            templateCopy = templateCopy.replace(expressedKey, expressedValue);
          }
        }
      }
    }

    return templateCopy;
  },

  /**
   * Calls to generate and then appends the resulting value to the inner HTML of the provided primeElement.
   *
   * @param {Prime.Document.Element} primeElement The prime Element instance to append the result of executing the template to.
   * @param {Object} parameters An object that contains the parameters for the template to replace.
   */
  appendTo: function(primeElement, parameters) {
    if (Prime.Utils.isDefined(primeElement)) {
      primeElement.setHTML(primeElement.getHTML() + this.generate(parameters));
    } else {
      throw new TypeError('Please supply an element to append to');
    }
  },

  /**
   * Calls to generate and then inserts the resulting elements into the dom before the primeElement
   *
   * @param {Prime.Document.Element} primeElement The prime Element instance to insert the result of executing the template before.
   * @param {Object} parameters An object that contains the parameters for the template to replace.
   */
  insertBefore: function(primeElement, parameters) {
    if (Prime.Utils.isDefined(primeElement)) {
      var holder = document.createElement('div');
      holder.innerHTML = this.generate(parameters);
      new Prime.Document.Element(holder.children[0]).insertBefore(primeElement);
    } else {
      throw new TypeError('Please supply an element to append to');
    }
  },

  /**
   * Calls to generate and then inserts the resulting elements into the dom after the primeElement
   *
   * @param {Prime.Document.Element} primeElement The prime Element instance to insert the result of executing the template after.
   * @param {Object} parameters An object that contains the parameters for the template to replace.
   */
  insertAfter: function(primeElement, parameters) {
    if (Prime.Utils.isDefined(primeElement)) {
      var holder = document.createElement('div');
      holder.innerHTML = this.generate(parameters);
      new Prime.Document.Element(holder.children[0]).insertAfter(primeElement);
    } else {
      throw new TypeError('Please supply an element to append to');
    }
  }
};
/*
 * Copyright (c) 2012-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Utils namespace. This contains utility functions.
 *
 * @namespace Prime.Utils
 */
Prime.Utils = {
  spaceRegex: /\s+/,
  typeRegex: /^\[object\s(.*)\]$/,

  /**
   * Binds all of the functions inside the object so that <code>this</code> is the object. This is extremely useful for
   * objects that have functions that will be used as event listeners. Rather than having to manage binding and function
   * references manually you can instead bind all of the functions in the object and then use them directly for event
   * listeners.
   *
   * Here's an example:
   *
   * <pre>
   *   function Foo() {
   *     Prime.Utils.bindAll(this);
   *
   *     // This function is bound to this (i.e. this.handleClick = this.handleClick.bind(this)).
   *     Prime.Document.queryFirst('a').addEventListener('click', this.handleClick);
   *   }
   *
   *   Foo.prototype = {
   *     handleClick: function(event) {
   *       ...
   *     }
   *   };
   * </pre>
   *
   * @param {*} object The object to bind all the functions for.
   */
  bindAll: function(object) {
    for (var property in object) {
      if (object[property] instanceof Function) {
        object[property] = object[property].bind(object);
      }
    }
  },

  /**
   * Binds all of the functions inside the object so that <code>this</code> is the object. This is extremely useful for
   * objects that have functions that will be used as event listeners. Rather than having to manage binding and function
   * references manually you can instead bind all of the functions in the object and then use them directly for event
   * listeners.
   *
   * Here's an example:
   *
   * <pre>
   *   function Foo() {
   *     Prime.Utils.bindAll(this);
   *
   *     // This function is bound to this (i.e. this.handleClick = this.handleClick.bind(this)).
   *     Prime.Document.queryFirst('a').addEventListener('click', this.handleClick);
   *   }
   *
   *   Foo.prototype = {
   *     handleClick: function(event) {
   *       ...
   *     }
   *   };
   * </pre>
   *
   * @param {*} object The object to bind all the functions for.
   * @param {String} arguments A varargs list of function names to bind.
   */
  bindSome: function(object) {
    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        var func = object[arguments[i]];
        if (!Prime.Utils.isDefined(func) || !(func instanceof Function)) {
          throw new TypeError('The object does not contain a function named [' + arguments[i] + ']');
        }

        object[arguments[i]] = func.bind(object);
      }
    }
    for (var property in object) {
      if (object[property] instanceof Function) {
        object[property] = object[property].bind(object);
      }
    }
  },

  /**
   * Safely binds a function to a context.
   *
   * @param {Function} func The function to bind.
   * @param {Object} [context] An optional context to bind the function to.
   * @returns {Function} Either <code>func</code> or the newly bound function.
   */
  bindSafe: function(func, context) {
    if (!Prime.Utils.isDefined(func)) {
      throw new Error('Invalid arguments');
    }

    if (!Prime.Utils.isDefined(context)) {
      return func;
    }

    return func.bind(context);
  },

  /**
   * Calculates the length of the given text using the style of the given element.
   *
   * @param {Prime.Document.Element} element The element to use the style of.
   * @param {string} text The text to calculate the length of.
   * @returns {number} The length of the text.
   */
  calculateTextLength: function(element, text) {
    var computedStyle = element.getComputedStyle();
    var textCalculator = Prime.Document.queryById('prime-text-calculator');
    if (textCalculator === null) {
      textCalculator = Prime.Document.newElement('<span/>')
          .setStyles({
            position: 'absolute',
            width: 'auto',
            fontSize: computedStyle['fontSize'],
            fontFamily: computedStyle['fontFamily'],
            fontWeight: computedStyle['fontWeight'],
            letterSpacing: computedStyle['letterSpacing'],
            whiteSpace: 'nowrap'
          })
          .setId('prime-text-calculator')
          .setTop(-9999)
          .setLeft(-9999)
          .appendTo(document.body);
    }

    textCalculator.setHTML(text);
    return textCalculator.getWidth();
  },

  /**
   * Attempts to invoke a function iteratively in the background a specific number of times within a specific duration.
   * This might not complete in the specified duration. The functions passed in should be short functions that return as
   * quickly as possible. If you are using long functions, use the recursive setTimeout trick by-hand instance.
   *
   * @param {number} totalDuration The duration in milliseconds.
   * @param {number} timesToCall The number of times to call the function.
   * @param {Function} stepFunction The step function to call each iteration.
   * @param {Function} [endFunction] The function to invoke at the end.
   */
  callIteratively: function(totalDuration, timesToCall, stepFunction, endFunction) {
    var step = totalDuration / timesToCall;
    var count = 0;
    var id = setInterval(function() {
      count++;
      var last = (count >= timesToCall);
      stepFunction(last);
      if (last) {
        clearInterval(id);

        if (Prime.Utils.isDefined(endFunction)) {
          endFunction();
        }
      }
    }, step - 1);
  },

  /**
   * Capitalizes the given String.
   *
   * @param {string} str The String to capitalize.
   * @returns {string} The capitalized String.
   */
  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  },

  /**
   * Converts CSS style names to style JavaScript names.
   *
   * @param {string} name The CSS style name to convert
   * @returns {string} The converted style name.
   */
  convertStyleName: function(name) {
    if (name === 'float') {
      return 'cssFloat';
    }
    
    var dash = name.indexOf('-');
    if (dash === -1) {
      return name;
    }

    var start = 0;
    var result = '';
    while (dash !== -1) {
      var piece = name.substring(start, dash);
      if (start === 0) {
        result = result.concat(piece);
      } else {
        result = result.concat(Prime.Utils.capitalize(piece));
      }

      start = dash + 1;
      dash = name.indexOf('-', start);
    }

    return result + Prime.Utils.capitalize(name.substring(start));
  },

  /**
   * Return an options map {Object} of the data set values coerced to a typed value of boolean, string or number.
   *
   * @param {Prime.Document.Element} element The element.
   * @returns {Object} The options object.
   */
  dataSetToOptions: function(element) {
    var options = {};
    var data = element.getDataSet();
    for (var prop in data) {
      if (!data.hasOwnProperty(prop)) {
        continue;
      }
      var value = data[prop];
      if (isNaN(value)) {
        if (value === 'true') {
          options[prop] = true;
        } else if (value === 'false') {
          options[prop] = false;
        } else {
          options[prop] = value;
        }
      } else {
        options[prop] = parseInt(value);
      }
    }

    return options;
  },

  /**
   * Determines if an object is an array or not.
   *
   * @param {*} o The object to check.
   * @returns {boolean} True if the object is an array, false otherwise.
   */
  isArray: function(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  },

  /**
   * Tests whether or not the value is not null and not 'undefined'.
   *
   * @param {*} value The value to test.
   * @returns {boolean} True if the value is defined (not null or undefined).
   */
  isDefined: function(value) {
    return value !== null && typeof(value) !== 'undefined';
  },

  /**
   * Parses a CSS measure value (12px) as an integer.
   *
   * @param {string} measure The CSS measure
   * @returns {number} The value as an integer.
   */
  parseCSSMeasure: function(measure) {
    var index = measure.indexOf('px');
    if (index > 0) {
      return parseInt(measure.substring(0, measure.length - 2));
    }

    return parseInt(measure) || 0;
  },

  /**
   * Parses JSON.
   *
   * @param {string} json The JSON.
   * @returns {Object} The JSON data as an object.
   */
  parseJSON: function(json) {
    return JSON.parse(json);
  },

  /**
   * Removes the objects in the toRemove array from the fromArray.
   *
   * @param {Array} fromArray The array to remove from.
   * @param {Array} toRemove The values to remove.
   */
  removeAllFromArray: function(fromArray, toRemove) {
    for (var i = 0; i < toRemove.length; i++) {
      Prime.Utils.removeFromArray(fromArray, toRemove[i]);
    }
  },

  /**
   * Removes the given object from the given array.
   *
   * @param {Array} array The array to remove from.
   * @param {*} obj The object to remove.
   */
  removeFromArray: function(array, obj) {
    var index = array.indexOf(obj);
    if (index !== -1) {
      var shift = array.splice(index + 1, array.length);
      array.length = index;
      array.push.apply(array, shift);
    }
  },

  /**
   * Helper function to provide a one liner to behave as if you returned 'false' from a legacy version of Prime.js.
   *
   * Calling this method is equivalent to calling event.preventDefault and event.stopPropagation.
   * @param event
   */
  stopEvent: function(event) {
    // Compatibility with older versions of IE
    event.cancelBubble = true;
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
  },

  type: function(object) {
    return Object.prototype.toString(object).match(Prime.Utils.typeRegex)[1];
  }
};
/*
 * Copyright (c) 2015-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};

/**
 * Constructs a new DateTimePicker object for the given input element.
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element for the DateTimePicker widget.
 * @constructor
 */
Prime.Widgets.DateTimePicker = function(element) {
  this.element = Prime.Document.Element.wrap(element);
  if (!this.element.is('input')) {
    throw new TypeError('You can only use Prime.Widgets.DateTimePicker with an input element');
  }

  Prime.Utils.bindAll(this);

  var value = this.element.getValue();
  if (value === '' || value === null) {
    this.date = new Date();
  } else {
    this.date = new Date(value);
  }

  this._setInitialOptions();
  var year = this.date.getUTCFullYear();
  var timeSeparator = '<span>' + Prime.Widgets.DateTimePicker.TIME_SEPARATOR + '</span>';
  var dateSeparator = '<span>' + Prime.Widgets.DateTimePicker.DATE_SEPARATOR + '</span>';
  var html =
      '<div class="prime-date-picker">' +
      '  <div class="header">' +
      '    <span class="prev">&#9664;</span>' +
      '    <span class="month"></span>' +
      '    <span class="year"></span>' +
      '    <span class="next">&#9654;</span>' +
      '  </div>' +
      '  <table class="month">' +
      '    <thead>' +
      '      <tr>' +
      '        <th>' + Prime.Widgets.DateTimePicker.SHORT_DAY_NAMES[0] + '</th>' +
      '        <th>' + Prime.Widgets.DateTimePicker.SHORT_DAY_NAMES[1] + '</th>' +
      '        <th>' + Prime.Widgets.DateTimePicker.SHORT_DAY_NAMES[2] + '</th>' +
      '        <th>' + Prime.Widgets.DateTimePicker.SHORT_DAY_NAMES[3] + '</th>' +
      '        <th>' + Prime.Widgets.DateTimePicker.SHORT_DAY_NAMES[4] + '</th>' +
      '        <th>' + Prime.Widgets.DateTimePicker.SHORT_DAY_NAMES[5] + '</th>' +
      '        <th>' + Prime.Widgets.DateTimePicker.SHORT_DAY_NAMES[6] + '</th>' +
      '      </tr>' +
      '    </thead>' +
      '    <tbody>' +
      '    </tbody>' +
      '  </table>' +
      '  <div class="inputs">' +
      '    <div class="date">' +
      '      <input size="2" maxlength="2" type="text" name="month" autocomplete="off"/>' + dateSeparator +
      '      <input size="2" maxlength="2" type="text" name="day" autocomplete="off"/>' + dateSeparator +
      '      <input size="4" maxlength="4" type="text" name="year" autocomplete="off"/>' +
      '    </div>' +
      '    <div class="time">' +
      '      <input size="2" maxlength="2" type="text" name="hour" autocomplete="off"/>' + timeSeparator +
      '      <input size="2" maxlength="2" type="text" name="minute" autocomplete="off"/>' + timeSeparator +
      '      <input size="2" maxlength="2" type="text" name="second" autocomplete="off"/>' +
      '      <input size="2" maxlength="2" type="text" name="am_pm" autocomplete="off"/>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  Prime.Document.appendHTML(html);
  this.datepicker = Prime.Document.queryLast('.prime-date-picker').hide();
  this.element.addEventListener('click', this._handleInputClick);
  this.element.addEventListener('focus', this._handleInputClick);
  this.element.addEventListener('keydown', this._handleInputKey);

  this.calendarBody = this.datepicker.queryFirst('table tbody').addEventListener('click', this._handleDayClick);
  this.monthDisplay = this.datepicker.queryFirst('.header .month').addEventListener('click', this._handleMonthExpand);
  this.yearDisplay = this.datepicker.queryFirst('.header .year').addEventListener('click', this._handleYearExpand);

  this.time = this.datepicker.queryFirst('.time');
  this.inputs = this.datepicker.queryFirst('div.inputs');
  this.hourInput = this.inputs.queryFirst('input[name=hour]').addEventListener('change', this._handleDateTimeChange).addEventListener('keydown', this._handleHourKey);
  this.minuteInput = this.inputs.queryFirst('input[name=minute]').addEventListener('change', this._handleDateTimeChange).addEventListener('keydown', this._handleMinuteKey);
  this.secondInput = this.inputs.queryFirst('input[name=second]').addEventListener('change', this._handleDateTimeChange).addEventListener('keydown', this._handleSecondKey);
  this.ampmInput = this.inputs.queryFirst('input[name=am_pm]').addEventListener('keydown', this._handleAmPmKey);
  this.monthInput = this.inputs.queryFirst('input[name=month]').setValue(this.date.getMonth() + 1).addEventListener('change', this._handleDateTimeChange).addEventListener('keydown', this._handleMonthKey);
  this.dayInput = this.inputs.queryFirst('input[name=day]').setValue(this.date.getDate()).addEventListener('change', this._handleDateTimeChange).addEventListener('keydown', this._handleDayKey);
  this.yearInput = this.inputs.queryFirst('input[name=year]').setValue(this.date.getFullYear()).addEventListener('change', this._handleDateTimeChange).addEventListener('keydown', this._handleYearKey);

  this.datepicker.queryFirst('.header .next').addEventListener('click', this._handleNextMonth);
  this.datepicker.queryFirst('.header .prev').addEventListener('click', this._handlePreviousMonth);

  this.callback = null;

  Prime.Document.addEventListener('click', this._handleGlobalClick);
  Prime.Document.addEventListener('keydown', this._handleGlobalKey);

  this.element.addClass('prime-initialized');
};

Prime.Widgets.DateTimePicker.SHORT_DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
Prime.Widgets.DateTimePicker.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
Prime.Widgets.DateTimePicker.DATE_SEPARATOR = '/';
Prime.Widgets.DateTimePicker.TIME_SEPARATOR = ':';
Prime.Widgets.DateTimePicker.AM_PM = ['AM', 'PM'];

Prime.Widgets.DateTimePicker.prototype = {
  /**
   * Destroys the DateTimePicker Widget
   */
  destroy: function() {
    this.datepicker.removeFromDOM();
    this.element.removeEventListener('click', this._handleInputClick);
    this.element.removeEventListener('focus', this._handleInputClick);
    this.element.removeEventListener('keydown', this._handleInputKey);
    Prime.Document.removeEventListener('click', this._handleGlobalClick);
    Prime.Document.removeEventListener('keydown', this._handleGlobalKey);
    this.element.removeClass('prime-initialized');
  },

  /**
   * Draws the calendar using the month and year from the given Date object.
   *
   * @param date {Date} The date to draw the calendar for.
   * @return {Prime.Widgets.DateTimePicker} This DateTimePicker.
   */
  drawCalendar: function(date) {
    var month = date.getMonth();
    var year = date.getFullYear();
    var firstDay = new Date(year, month, 1);
    var firstDayOfMonth = firstDay.getDay();
    var daysInMonth = Prime.Date.numberOfDaysInMonth(year, month);
    var used = firstDayOfMonth + daysInMonth;
    var weeksInMonth = Math.ceil(used / 7);

    var rows = '';
    var startDay = 1;
    for (var i = 0; i < weeksInMonth; i++) {
      var startDayOfWeek = i === 0 ? firstDayOfMonth : 0;
      rows += this._buildCalendarWeek(date, startDayOfWeek, startDay, daysInMonth);
      startDay += 7 - startDayOfWeek; // increment by 7 adjusted by a week day of week offset
    }

    this.calendarBody.setHTML(rows);

    // update data- attributes
    this.monthDisplay.setDataAttribute('month', month);
    this.yearDisplay.setDataAttribute('year', year);

    // update text
    this.monthDisplay.setTextContent(Prime.Widgets.DateTimePicker.MONTHS[month]);
    this.yearDisplay.setTextContent(year);

    return this;
  },

  /**
   * Hide the Date Picker widget.
   *
   * @returns {Prime.Widgets.DateTimePicker} This DateTimePicker.
   */
  hide: function() {
    new Prime.Effects.Fade(this.datepicker).withDuration(100).go();
    return this;
  },

  /**
   * Moves the DateTimePicker to the next month and redraws the calendar.
   *
   * @returns {Prime.Widgets.DateTimePicker} This DateTimePicker.
   */
  nextMonth: function() {
    var newDate = new Date(this.date);
    newDate.setDate(1); // Set the day to 1 to keep us from wrapping months on the 30 and 31st.
    newDate.setMonth(parseInt(this.monthDisplay.getDataAttribute('month')));
    newDate.setFullYear(parseInt(this.yearDisplay.getDataAttribute('year')));
    Prime.Date.plusMonths(newDate, 1);
    this.drawCalendar(newDate);
    return this;
  },

  /**
   * Opens the month select box.
   */
  openMonthSelect: function() {
    this.months = this.datepicker.queryFirst('.months');
    if (Prime.Utils.isDefined(this.years)) {
      this.years.hide();
    }
    if (this.months === null) {
      var html = '<div class="months">';
      for (var i = 0; i < Prime.Widgets.DateTimePicker.MONTHS.length; i++) {
        html += '<div data-month="' + i + '">' + Prime.Widgets.DateTimePicker.MONTHS[i] + '</div>';
      }
      html += '</div>';
      this.datepicker.appendHTML(html);
      this.months = this.datepicker.queryFirst('.months');
      this.months.getChildren().each(function(month) {
        month.addEventListener('click', function() {
          new Prime.Effects.Fade(this.months).withDuration(100).go();
          this.setMonth(parseInt(month.getDataAttribute('month')));
        }.bind(this));
      }.bind(this));
    }

    new Prime.Effects.Appear(this.months).withDuration(100).go();
    this.months.setLeft(this.monthDisplay.getLeft() - 10);
    this.months.setTop(this.monthDisplay.getAbsoluteTop());
    var currentMonth = this.months.queryFirst('[data-month="' + this.date.getMonth() + '"]');
    this.months.getChildren().each(function(month) {
      month.removeClass('prime-selected');
    });
    currentMonth.addClass('prime-selected');
  },

  /**
   * Opens the year select box.
   */
  openYearSelect: function() {
    this.years = this.datepicker.queryFirst('.years');
    if (Prime.Utils.isDefined(this.months)) {
      this.months.hide();
    }

    if (this.years === null) {
      var html = '<div class="years">';
      var startYear = this.date.getFullYear() - 10;
      var endYear = this.date.getFullYear() + 10;
      for (var i = startYear; i < endYear; i++) {
        html += '<div data-year="' + i + '">' + i + '</div>';
      }
      html += '</div>';
      this.datepicker.appendHTML(html);
      this.years = this.datepicker.queryFirst('.years');
      this.years.getChildren().each(function(year) {
        year.addEventListener('click', function() {
          new Prime.Effects.Fade(this.years).withDuration(100).go();
          this.setYear(parseInt(year.getDataAttribute('year')));
        }.bind(this));
      }.bind(this));
    }

    new Prime.Effects.Appear(this.years).withDuration(100).go();
    this.years.setLeft(this.yearDisplay.getLeft() - 10);
    this.years.setTop(this.yearDisplay.getAbsoluteTop());
    var currentYear = this.years.queryFirst('[data-year="' + this.date.getFullYear() + '"]');
    this.years.getChildren().each(function(year) {
      year.removeClass('prime-selected');
    });
    currentYear.addClass('prime-selected');
  },

  /**
   * Moves the DateTimePicker to the previous month and redraws the calendar.
   *
   * @returns {Prime.Widgets.DateTimePicker} This DateTimePicker.
   */
  previousMonth: function() {
    var newDate = new Date(this.date);
    newDate.setDate(1); // Set to 1 until month has been set
    newDate.setMonth(parseInt(this.monthDisplay.getDataAttribute('month')));
    newDate.setFullYear(parseInt(this.yearDisplay.getDataAttribute('year')));
    Prime.Date.plusMonths(newDate, -1);
    this.drawCalendar(newDate);
    return this;
  },

  /**
   * Rebuilds the entire widget using the date value. Even if the user has moved to a different month
   * display, this will rebuild the table completely.
   *
   * @returns {Prime.Widgets.DateTimePicker} This DateTimePicker.
   */
  render: function() {
    this.drawCalendar(this.date);
    this._refreshInputs();

    if (this.options.dateOnly) {
      this.time.hide();
    }
    return this;
  },

  /**
   * Sets the date of the DateTimePicker and redraws the calendar to the month for the date.
   *
   * @param {Date} newDate The new date.
   * @returns {Prime.Widgets.DateTimePicker} This DateTimePicker.
   */
  setDate: function(newDate) {
    this.date = newDate;
    if (this.options.dateOnly) {
      this.element.setValue(Prime.Date.toDateOnlyISOString(newDate));
    } else {
      this.element.setValue(newDate.toISOString());
    }
    this.render();

    if (this.callback !== null) {
      this.callback(this);
    }

    return this;
  },

  /**
   * @param {number} month The month. A 0 based number between 0 (January) and 11 (December).
   * @returns {Prime.Widgets.DateTimePicker}
   */
  setMonth: function(month) {
    var currentYear = parseInt(this.yearDisplay.getDataAttribute('year'));
    if (month < 0) {
      month = 11;
      currentYear--;
    } else if (month > 11) {
      currentYear++;
      month = 0;
    }

    this.date.setMonth(month);
    this.date.setYear(currentYear);
    this.setDate(this.date);

    return this;
  },

  /**
   *
   * @param {number} year The year.
   * @returns {Prime.Widgets.DateTimePicker}
   */
  setYear: function(year) {
    this.yearDisplay.setDataAttribute('year', year);
    this.yearDisplay.setTextContent(year);
    this.date.setYear(year);
    this.setDate(this.date);
    return this;
  },

  /**
   * Show the Date Picker widget
   *
   * @returns {Prime.Widgets.DateTimePicker} This DateTimePicker.
   */
  show: function() {
    this.datepicker.setLeft(this.element.getLeft());
    this.datepicker.setTop(this.element.getAbsoluteTop() + this.element.getHeight() + 8);
    new Prime.Effects.Appear(this.datepicker).withDuration(200).go();
    return this;
  },

  /**
   * Sets the callback handler that is called with the DateTimePicker's value is changed.
   *
   * @param callback {Function} The callback function.
   * @return {Prime.Widgets.DateTimePicker} This.
   */
  withCallback: function(callback) {
    this.callback = callback;
    return this;
  },

  /**
   * Render the DateTimePicker w/out the time picker. Only the calendar will be displayed and the input field will be updated with date only.
   *
   *
   * @returns {Prime.Widgets.DateTimePicker} This DateTimePicker.
   */
  withDateOnly: function() {
    this.options['dateOnly'] = true;
    return this;
  },

  /**
   * Set more than one option at a time by providing a map of key value pairs. This is considered an advanced
   * method to set options on the widget. The caller needs to know what properties are valid in the options object.
   *
   * @param {Object} options Key value pair of configuration options.
   * @returns {Prime.Widgets.DateTimePicker} This DateTimePicker.
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
   * Build the HTML for a single calendar week.
   *
   * @param date {Date} The date to build the calendar week based on.
   * @param startDayOfWeek {Number} The day of the week of this week begins. A 0 based number between 0 and 6.
   * @param startDayOfMonth {Number} The day of the month this week begins. A number between 1 and 31.
   * @param daysInMonth {Number} The number of days in this calendar month.
   * @returns {string} The HTML for this week.
   * @private
   */
  _buildCalendarWeek: function(date, startDayOfWeek, startDayOfMonth, daysInMonth) {
    var daysInPreviousMonth = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    var startDayOfPreviousMonth = daysInPreviousMonth - startDayOfWeek + 1;
    var startDayOfNextMonth = 1;

    var row = '<tr>';
    var emptyColumns = 0;
    var year = date.getFullYear();
    var month = date.getMonth();

    for (var i = 0; i < 7; i++) {
      var dayOfWeek = startDayOfMonth + i;
      // Days of the previous month
      if (dayOfWeek <= startDayOfWeek) {
        row += '<td><a class="prime-inactive" href="#" data-year="' + year + '" data-month="' + (month - 1) + '" data-day="' + startDayOfPreviousMonth + '">' + startDayOfPreviousMonth + '</a></td>';
        startDayOfPreviousMonth++;
        emptyColumns++;
      } else if (dayOfWeek > daysInMonth) {
        // Days of the next month
        row += '<td><a class="prime-inactive" href="#" data-year="' + year + '" data-month="' + month + '" data-day="' + dayOfWeek + '">' + startDayOfNextMonth + '</a></td>';
        startDayOfNextMonth++;
      } else {
        // Days in the current month
        var day = dayOfWeek - emptyColumns;
        var selected = this.date.getDate() === day && this.date.getMonth() === month;
        row += '<td><a ' + (selected ? 'class="prime-selected"' : '') + 'href="#" data-year="' + year + '" data-month="' + month + '" data-day="' + day + '">' + day + '</a></td>';
      }
    }

    row += '</tr>';
    return row;
  },

  /**
   * Clamp the value between the minimum and maximum values.
   *
   * @param {Number} min the minimum number value.
   * @param {Number} max The maximum number value.
   * @param {Number} value The value to clamp.
   * @returns {Number} The resulting value, either the min, max or actual value if not out of bounds.
   * @private
   */
  _clamp: function(min, max, value) {
    return Math.max(min, Math.min(value, max));
  },

/**
   * Handles when the AM/PM element is selected and the user hits a key. If the user hits A, this changes to AM. If the
   * user hits P, this changes to PM. If the use hits the up or down arrows, this toggles between AM and PM.
   *
   * @param {KeyboardEvent} event The keyboard event.
   * @private
   */
  _handleAmPmKey: function(event) {
    if (event.keyCode === Prime.Events.Keys.TAB) {
      if (event.shiftKey) {
        this.secondInput.domElement.setSelectionRange(0, this.secondInput.getValue().length);
        this.secondInput.focus();
      } else {
        this.monthInput.domElement.setSelectionRange(0, this.monthInput.getValue().length);
        this.monthInput.focus();
      }
      Prime.Utils.stopEvent(event);
      return;
    }

    // Decode the key event
    var current = this.ampmInput.getValue();
    if (event.keyCode === 65) {
      // User hit A
      if (current === Prime.Widgets.DateTimePicker.AM_PM[1]) {
        Prime.Date.plusHours(this.date, -12);
      }
    } else if (event.keyCode === 80) {
      // User hit P
      if (current === Prime.Widgets.DateTimePicker.AM_PM[0]) {
        Prime.Date.plusHours(this.date, 12);
      }
    } else if (event.keyCode === Prime.Events.Keys.UP_ARROW || event.keyCode === Prime.Events.Keys.DOWN_ARROW) {
      // User hit up or down arrow
      if (current === Prime.Widgets.DateTimePicker.AM_PM[0]) {
        Prime.Date.plusHours(this.date, 12);
      } else if (current === Prime.Widgets.DateTimePicker.AM_PM[1]) {
        Prime.Date.plusHours(this.date, -12);
      }
    } else if (event.keyCode === Prime.Events.Keys.ENTER || event.keyCode === Prime.Events.Keys.ESCAPE) {
      return;
    }

    this.setDate(this.date);
    this.ampmInput.domElement.setSelectionRange(0, this.ampmInput.getValue().length);
    Prime.Utils.stopEvent(event);
  },

  /**
   * Handle date/time change events. This pulls the values from the 3 date fields and makes a new Date. Then it calls
   * {@link #setDate(Date)}.
   *
   * @param {KeyboardEvent} event The keyboard event.
   * @private
   */
  _handleDateTimeChange: function(event) {
    var newDate = new Date();
    var hours = this._clamp(1, 12, parseInt(this.hourInput.getValue()));
    if (this.ampmInput.getValue() === Prime.Widgets.DateTimePicker.AM_PM[0]) {
      if (hours === 12) {
        newDate.setHours(0);
      } else {
        newDate.setHours(hours);
      }
    } else {
      if (hours === 12) {
        newDate.setHours(12);
      } else {
        newDate.setHours(hours + 12);
      }
    }

    var seconds = this._clamp(0, 59, parseInt(this.secondInput.getValue()));
    var minutes = this._clamp(0, 59, parseInt(this.minuteInput.getValue()));

    newDate.setSeconds(seconds);
    newDate.setMinutes(minutes);
    newDate.setDate(1); // Set to 1 until month has been set
    newDate.setMonth(parseInt(this.monthInput.getValue()) - 1);
    newDate.setDate(parseInt(this.dayInput.getValue()));
    newDate.setYear(parseInt(this.yearInput.getValue()));

    this.setDate(newDate);
    Prime.Utils.stopEvent(event);
  },

  /**
   * Handle the click on a day.
   *
   * @parameter {MouseEvent} event The click event.
   * @private
   */
  _handleDayClick: function(event) {
    var dayElement = new Prime.Document.Element(event.target);
    if (!dayElement.is('a')) {
      dayElement = dayElement.queryFirst('a');
    }

    var newDate = new Date(this.date);
    newDate.setDate(1); // Set to 1 until month has been set
    newDate.setFullYear(parseInt(dayElement.getDataAttribute('year')));
    newDate.setMonth(parseInt(dayElement.getDataAttribute('month')));
    newDate.setDate(parseInt(dayElement.getDataAttribute('day')));
    this.setDate(newDate);
    Prime.Utils.stopEvent(event);
  },

  /**
   * Handles when a key is click in the day input field so that tab and shift tab work properly.
   * <p>
   * Also handles up and down arrow to increment and decrement the day.
   *
   * @param {KeyboardEvent} event The key event.
   * @private
   */
  _handleDayKey: function(event) {
    if (event.keyCode === Prime.Events.Keys.UP_ARROW) {
      Prime.Date.plusDays(this.date, 1);
      this.setDate(this.date);
      this.dayInput.domElement.setSelectionRange(0, this.dayInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.DOWN_ARROW) {
      Prime.Date.plusDays(this.date, -1);
      this.setDate(this.date);
      this.dayInput.domElement.setSelectionRange(0, this.dayInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.ENTER) {
      this.date.setDate(parseInt(this.dayInput.getValue()));
    }
  },

  /**
   * Handles a global click event. This determines if the click was outside of the DateTimePicker and closes it.
   *
   * @param {MouseEvent} event The click event.
   * @private
   */
  _handleGlobalClick: function(event) {
    // Skip this function completely if they clicked the input field
    if (event.target === this.element.domElement) {
      return;
    }

    var top = this.datepicker.getTop();
    var bottom = this.datepicker.getBottom();
    var left = this.datepicker.getLeft();
    var right = this.datepicker.getRight();
    if (this.datepicker.isVisible() && (event.x < left || event.x > right || event.y < top || event.y > bottom)) {
      if (Prime.Utils.isDefined(this.years)) {
        this.years.hide();
      }
      if (Prime.Utils.isDefined(this.months)) {
        this.months.hide();
      }
      this.hide();
    }
  },

  /**
   * Handles a global key event. This determines if the DateTimePicker is open and if enter or escape was hit.
   *
   * @param {KeyboardEvent} event The key event.
   * @private
   */
  _handleGlobalKey: function(event) {
    // Skip this function completely if the DateTimePicker isn't open
    if (!this.datepicker.isVisible()) {
      return;
    }

    if (event.keyCode === Prime.Events.Keys.ENTER) {
      this.setDate(this.date);
      this.hide();
      this.element.focus();
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.ESCAPE) {
      this.hide();
      this.element.focus();
    }
  },

  /**
   * Handles when a key is click in the hours input field so that tab and shift tab work properly.
   * <p>
   * Also handles up and down arrow to increment and decrement the hour.
   *
   * @param {KeyboardEvent} event The key event.
   * @private
   */
  _handleHourKey: function(event) {
    if (event.keyCode === Prime.Events.Keys.UP_ARROW) {
      Prime.Date.plusHours(this.date, 1);
      this.setDate(this.date);
      this.hourInput.domElement.setSelectionRange(0, this.hourInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.DOWN_ARROW) {
      Prime.Date.plusHours(this.date, -1);
      this.setDate(this.date);
      this.hourInput.domElement.setSelectionRange(0, this.hourInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.ENTER) {
      this.date.setHours(parseInt(this.hourInput.getValue()));
    }
  },

  /**
   * Handle the click event for the input date field. If the DateTimePicker is hidden this will call the {@link #show()}
   * function.
   *
   * @returns {boolean} Always true.
   * @private
   */
  _handleInputClick: function() {
    if (!this.datepicker.isVisible()) {
      this.show();
      this.monthInput.domElement.setSelectionRange(0, this.monthInput.getValue().length);
      this.monthInput.focus();
    }
  },

  /**
   * Handle the key event for the input date field. If the user hits tab or shift-tab, this moves the focus to the
   * nested inputs.
   *
   * @param {KeyboardEvent} event The keyboard event.
   * @private
   */
  _handleInputKey: function(event) {
    if (this.datepicker.isVisible() && event.keyCode === Prime.Events.Keys.TAB) {
      if (event.shiftKey) {
        this.ampmInput.domElement.setSelectionRange(0, this.ampmInput.getValue().length);
        this.ampmInput.focus();
      } else {
        this.monthInput.domElement.setSelectionRange(0, this.monthInput.getValue().length);
        this.monthInput.focus();
      }
      Prime.Utils.stopEvent(event);
    }
  },

  /**
   * Handle the key down event and capture the up and down arrow key to increment and decrement the minute.

   * @param {KeyboardEvent} event The key event.
   * @private
   */
  _handleMinuteKey: function(event) {
    if (event.keyCode === Prime.Events.Keys.UP_ARROW) {
      Prime.Date.plusMinutes(this.date, 1);
      this.setDate(this.date);
      this.minuteInput.domElement.setSelectionRange(0, this.minuteInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.DOWN_ARROW) {
      Prime.Date.plusMinutes(this.date, -1);
      this.setDate(this.date);
      this.minuteInput.domElement.setSelectionRange(0, this.minuteInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.ENTER) {
      this.date.setMinutes(parseInt(this.minuteInput.getValue()));
    }
  },

  /**
   * Handles the click on the month to open the month select.
   *
   * @private
   */
  _handleMonthExpand: function() {
    this.openMonthSelect();
  },

  /**
   * Handles when a key is click in the month input field so that tab and shift tab work properly.
   * <p>
   * Also handles up and down arrow to increment and decrement the month.
   *
   * @param {KeyboardEvent} event The key event.
   * @private
   */
  _handleMonthKey: function(event) {
    if (event.keyCode === Prime.Events.Keys.TAB && event.shiftKey) {
      if (this.options.dateOnly) {
        this.yearInput.domElement.setSelectionRange(0, this.yearInput.getValue().length);
        this.yearInput.focus();
      } else {
        this.ampmInput.domElement.setSelectionRange(0, this.ampmInput.getValue().length);
        this.ampmInput.focus();
      }
      Prime.Utils.stopEvent(event);
      return;
    }

    if (event.keyCode === Prime.Events.Keys.UP_ARROW) {
      Prime.Date.plusMonths(this.date, 1);
      this.setDate(this.date);
      this.monthInput.domElement.setSelectionRange(0, this.monthInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.DOWN_ARROW) {
      Prime.Date.plusMonths(this.date, -1);
      this.setDate(this.date);
      this.monthInput.domElement.setSelectionRange(0, this.monthInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.ENTER) {
      this.date.setMonth(parseInt(this.monthInput.getValue()) - 1);
    }
  },

  /**
   * Handle the next month button click.
   *
   * @param {MouseEvent} event The mouse event.
   * @private
   */
  _handleNextMonth: function(event) {
    this.nextMonth();
    Prime.Utils.stopEvent(event);
  },

  /**
   * Handle the previous month button click.
   *
   * @param {MouseEvent} event The mouse event.
   * @private
   */
  _handlePreviousMonth: function(event) {
    this.previousMonth();
    Prime.Utils.stopEvent(event);
  },

  /**
   * Handle the key down event and capture the up and down arrow key to increment and decrement the second.

   * @param {KeyboardEvent} event The key event.
   * @private
   */
  _handleSecondKey: function(event) {
    if (event.keyCode === Prime.Events.Keys.UP_ARROW) {
      Prime.Date.plusSeconds(this.date, 1);
      this.setDate(this.date);
      this.secondInput.domElement.setSelectionRange(0, this.secondInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.DOWN_ARROW) {
      Prime.Date.plusSeconds(this.date, -1);
      this.setDate(this.date);
      this.secondInput.domElement.setSelectionRange(0, this.secondInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.ENTER) {
      this.date.setSeconds(parseInt(this.secondInput.getValue()));
    }
  },

  /**
   * Handles the click on the year to open the year select.
   *
   * @private
   */
  _handleYearExpand: function() {
    this.openYearSelect();
  },

  /**
   * Handles when a key is click in the year input field so that tab and shift tab work properly.
   * <p>
   * Also handles up and down arrow to increment and decrement the year.
   *
   * @param {KeyboardEvent} event The key event.
   * @private
   */
  _handleYearKey: function(event) {
    if (event.keyCode === Prime.Events.Keys.UP_ARROW) {
      Prime.Date.plusYears(this.date, 1);
      this.setDate(this.date);
      this.yearInput.domElement.setSelectionRange(0, this.yearInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.DOWN_ARROW) {
      Prime.Date.plusYears(this.date, -1);
      this.setDate(this.date);
      this.yearInput.domElement.setSelectionRange(0, this.yearInput.getValue().length);
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.TAB && this.options.dateOnly) {
      if (event.shiftKey) {
        this.dayInput.domElement.setSelectionRange(0, this.dayInput.getValue().length);
        this.dayInput.focus();
      } else {
        this.monthInput.domElement.setSelectionRange(0, this.monthInput.getValue().length);
        this.monthInput.focus();
      }
      Prime.Utils.stopEvent(event);
    } else if (event.keyCode === Prime.Events.Keys.ENTER) {
      this.date.setFullYear(parseInt(this.yearInput.getValue()));
    }
  },
  /**
   * Refresh the time inputs.
   *
   * @private
   */
  _refreshInputs: function() {
    // Set Time -- assuming 12-hour time for the input fields and ISO 24-hour time for the field
    var hours = Prime.Date.getHourOfDay(this.date);
    this.hourInput.setValue(hours);

    var minutes = this.date.getMinutes();
    this.minuteInput.setValue(("00" + minutes).slice(-2));

    var seconds = this.date.getSeconds();
    this.secondInput.setValue(("00" + seconds).slice(-2));

    if (this.date.getHours() >= 12) {
      this.ampmInput.setValue(Prime.Widgets.DateTimePicker.AM_PM[1]);
    } else {
      this.ampmInput.setValue(Prime.Widgets.DateTimePicker.AM_PM[0]);
    }

    this.monthInput.setValue(this.date.getMonth() + 1);
    this.dayInput.setValue(this.date.getDate());
    this.yearInput.setValue(this.date.getFullYear());
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
};/*
 * Copyright (c) 2015-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};

/**
 * Constructs a new Draggable object for the given element.
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element for the Draggable widget.
 * @param {string} [gripSelector=] gripSelector  The optional selector to identify the 'grippy' part.
 * @constructor
 */
Prime.Widgets.Draggable = function(element, gripSelector) {
  Prime.Utils.bindAll(this);

  this.element = Prime.Document.Element.wrap(element);
  if (!Prime.Utils.isDefined(gripSelector)) {
    this.grip = this.element;
  } else {
    this.grip = this.element.queryFirst(gripSelector);
    if (this.grip === null) {
      throw Error('Unable to find an element using the provided selector [' + gripSelector + ']');
    }
  }
  this.grip.addClass('prime-draggable-grip');

  this.originalStyle = {
    'cursor': this.element.getStyle('cursor'),
    'z-index': this.element.getStyle('z-index')
  };

  this.offset = {};

  this.grip.addEventListener('mousedown', this._handleMouseDown);
  this.element.addEventListener('mouseup', this._handleOnMouseUp);

  this.parent = new Prime.Document.Element(this.element.domElement.parentNode);
  this.parent.addEventListener('mouseup', this._handleParentMouseUp);
  this.element.addClass('prime-draggable');
};

Prime.Widgets.Draggable.prototype = {

  /**
   * Destroys the Draggable Widget
   */
  destroy: function() {
    this.element.removeClass('prime-draggable prime-draggable-active');
    this.element.setStyles(this.originalStyle);
  },

  /* ===================================================================================================================
   * Private methods
   * ===================================================================================================================*/

  /**
   * Handle Mouse Down Event
   * @param {Event} event The mouse event.
   * @private
   */
  _handleMouseDown: function(event) {

    this.element.addClass('prime-draggable-active');

    this.offset = {
      'z_index': this.element.getStyle('z-index'),
      'height': this.element.getOuterHeight(),
      'width': this.element.getOuterWidth(),
      'x': this.element.getLeft() + this.element.getOuterWidth() - event.pageX,
      'y': this.element.getTop() + this.element.getOuterHeight() - event.pageY
    };

    this.element.setStyle('z-index', this.offset.z_index + 1000);
    // defensive move to make sure we don't register more than one.
    this.parent.removeEventListener('mousemove', this._handleParentMouseMove);
    this.parent.addEventListener('mousemove', this._handleParentMouseMove);
    event.preventDefault();
  },

  /**
   * Handle the Mouse Move event for the parent element of this draggable widget.
   * @param {Event} event The mouse event.
   * @private
   */
  _handleParentMouseMove: function(event) {
    this.element.setLeft(event.pageX + this.offset.x - this.offset.width);
    var scrollTop = Prime.Window.getScrollTop();
    this.element.setTop(event.pageY + this.offset.y - this.offset.height + scrollTop);
  },

  /**
   * Handle Mouse Up event for the parent element of this draggable widget.
   * @private
   */
  _handleParentMouseUp: function() {
    this.element.removeClass('prime-draggable-active');
    this.element.setStyle('z-index', this.offset.z_index);
  },

  /**
   * Handle the Mouse Up event for this draggable widget.
   * @private
   */
  _handleOnMouseUp: function() {
    this.parent.removeEventListener('mousemove', this._handleParentMouseMove);
    this.element.removeClass('prime-draggable-active');
  }
};/*
 * Copyright (c) 2014-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};


/**
 * Constructs a MultipleSelect object for the given element.
 *
 * The MultipleSelect generates a number of different HTML elements directly after the SELECT element you pass to the
 * constructor. A fully rendered MultipleSelect might look something like this:
 *
 * <pre>
 * &lt;select id="foo">
 *   &lt;option value="one">One&lt;/option>
 *   &lt;option value="two">Two&lt;/option>
 *   &lt;option value="three">Three&lt;/option>
 * &lt;/select>
 * &lt;div id="foo-display" class="prime-multiple-select-display">
 *   &lt;ul id="foo-option-list" class="prime-multiple-select-option-list">
 *     &lt;li id="foo-option-one" class="prime-multiple-select-option">&lt;span>One&lt;/span>&lt;a href="#">X&lt;/a>&lt;/li>
 *     &lt;li id="foo-option-two" class="prime-multiple-select-option">&lt;span>Two&lt;/span>&lt;a href="#">X&lt;/a>&lt;/li>
 *     &lt;li id="foo-option-three" class="prime-multiple-select-option">&lt;span>Three&lt;/span>&lt;a href="#">X&lt;/a>&lt;/li>
 *     &lt;li class="prime-multiple-select-input-option">&lt;input type="text" class="prime-multiple-select-input" value="aaa"/>&lt;/li>
 *   &lt;/ul>
 *   &lt;ul class="prime-multiple-select-search-result-list">
 *     &lt;li class="prime-multiple-select-search-result">One&lt;/li>
 *     &lt;li class="prime-multiple-select-search-result">Two&lt;/li>
 *     &lt;li class="prime-multiple-select-search-result">Three&lt;/li>
 *     &lt;li class="prime-multiple-select-add-custom">Add Custom Entry: aaa/li>
 *   &lt;/ul>
 * &lt;/div>
 * </pore>
 *
 * The with* methods can be used to setup the configuration for this MultipleSelect, but here are some defaults:
 *
 * <ul>
 *   <li>placeholder = "Choose"</li>
 *   <li>customAddEnabled = true</li>
 *   <li>customAddLabel = "Add Custom Value:"</li>
 *   <li>noSearchResultsLabel = "No Matches For:"</li>
 * </ul>
 *
 * @constructor
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element for the MultipleSelect.
 */
Prime.Widgets.MultipleSelect = function(element) {
  this.element = Prime.Document.Element.wrap(element);
  if (this.element.domElement.tagName !== 'SELECT') {
    throw new TypeError('You can only use Prime.Widgets.MultipleSelect with select elements');
  }

  if (this.element.getAttribute('multiple') !== 'multiple') {
    throw new TypeError('The select box you are attempting to convert to a Prime.Widgets.MultipleSelect must have the multiple="multiple" attribute set');
  }

  Prime.Utils.bindAll(this);

  this.removeIcon = 'X';
  this.element.hide();
  this.placeholder = 'Choose';
  this.noSearchResultsLabel = 'No Matches For: ';
  this.customAddEnabled = true;
  this.customAddLabel = 'Add Custom Value: ';

  var id = this.element.getId();
  if (id === null || id === '') {
    id = 'prime-multiple-select' + Prime.Widgets.MultipleSelect.count++;
    this.element.setId(id);
  }

  this.displayContainer = Prime.Document.queryById(id + '-display');
  this.input = null;
  if (this.displayContainer === null) {
    this.displayContainer = Prime.Document.newElement('<div/>').
        setId(id + '-display').
        addClass('prime-multiple-select-display').
        addEventListener('click', this._handleClickEvent).
        addEventListener('keyup', this._handleKeyUpEvent).
        insertAfter(this.element);

    this.displayContainerSelectedOptionList = Prime.Document.newElement('<ul/>').
        addClass('prime-multiple-select-option-list').
        appendTo(this.displayContainer);

    this.searchResultsContainer = Prime.Document.newElement('<ul/>').
        addClass('prime-multiple-select-search-result-list').
        hide().
        appendTo(this.displayContainer);
  } else {
    this.displayContainer.
        removeAllEventListeners().
        addEventListener('click', this._handleClickEvent).
        addEventListener('keyup', this._handleKeyUpEvent);
    this.displayContainerSelectedOptionList = Prime.Document.queryFirst('.prime-multiple-select-option-list', this.displayContainer);
    this.searchResultsContainer = Prime.Document.queryFirst('.prime-multiple-select-search-result-list', this.displayContainer);
  }

  Prime.Document.queryFirst('html').addEventListener('click', this._handleGlobalClickEvent);
};

/*
 * Statics
 */
Prime.Widgets.MultipleSelect.count = 1;
Prime.Widgets.MultipleSelect.AddOptionEvent = 'Prime:Widgets:MultipleSelect:addOption';
Prime.Widgets.MultipleSelect.DeselectOptionEvent = 'Prime:Widgets:MultipleSelect:deselectOption';
Prime.Widgets.MultipleSelect.SelectOptionEvent = 'Prime:Widgets:MultipleSelect:selectOption';

Prime.Widgets.MultipleSelect.prototype = {
  /**
   * Pass through to add event listeners to this MultipleSelect. The custom events that this MultipleSelect fires are:
   *
   *  'Prime:Widgets:MultipleSelect:deselectOption'
   *  'Prime:Widgets:MultipleSelect:selectOption'
   *  'Prime:Widgets:MultipleSelect:addOption'
   *
   * @param {string} event The name of the event.
   * @param {Function} listener The listener function.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  addEventListener: function(event, listener) {
    this.element.addEventListener(event, listener);
    return this;
  },

  /**
   * Adds the given option to this select. The option will not be selected.
   *
   * @param {String} value The value for the option.
   * @param {String} display The display text for the option.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  addOption: function(value, display) {
    if (this.containsOptionWithValue(value)) {
      return this;
    }

    Prime.Document.newElement('<option/>').
        setValue(value).
        setHTML(display).
        appendTo(this.element);

    // Fire the custom event
    this.element.fireEvent(Prime.Widgets.MultipleSelect.AddOptionEvent, value, this);

    return this;
  },

  /**
   * Determines if this MultipleSelect contains an option with the given value.
   *
   * @param {String} value The value to look for.
   */
  containsOptionWithValue: function(value) {
    return this.findOptionWithValue(value) !== null;
  },

  /**
   * Deselects the option with the given value by removing the selected attribute from the option in the select box and
   * removing the option from the display container.
   *
   * @param {Prime.Document.Element} option The option to deselect.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  deselectOption: function(option) {
    option.setSelected(false);

    var id = this._makeOptionID(option);
    var displayOption = Prime.Document.queryById(id);
    if (displayOption !== null) {
      displayOption.removeFromDOM();
    }

    // If there are no selected options left, add back the placeholder attribute to the input and resize it
    if (Prime.Document.query('.prime-multiple-select-option', this.displayContainerSelectedOptionList).length === 0) {
      this.input.setAttribute('placeholder', this.placeholder);
      this.searcher.resizeInput();
    }

    // Fire the custom event
    this.element.fireEvent(Prime.Widgets.MultipleSelect.DeselectOptionEvent, option.getValue(), this);

    return this;
  },

  /**
   * Deselects the option with the given value by removing the selected attribute from the option in the select box and
   * removing the option from the display container. If the MultipleSelect doesn't contain an option for the given value,
   * this method throws an exception.
   *
   * @param {String} value The value to look for.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  deselectOptionWithValue: function(value) {
    var option = this.findOptionWithValue(value);
    if (option === null) {
      throw new Error('MultipleSelect doesn\'t contain an option with the value [' + value + ']');
    }

    this.deselectOption(option);

    return this;
  },

  /**
   * Finds the HTMLSelectOption with the given text and returns it wrapped in a Prime.Document.Element.
   *
   * @param {String} text The text to look for.
   * @returns {Prime.Document.Element} The option element or null.
   */
  findOptionWithText: function(text) {
    var options = this.element.getOptions();
    for (var i = 0; i < options.length; i++) {
      if (options[i].getTextContent() === text) {
        return options[i];
      }
    }

    return null;
  },

  /**
   * Finds the HTMLSelectOption with the given value and returns it wrapped in a Prime.Document.Element.
   *
   * @param {String} value The value to look for.
   * @returns {Prime.Document.Element} The option element or null.
   */
  findOptionWithValue: function(value) {
    for (var i = 0; i < this.element.domElement.length; i++) {
      var cur = this.element.domElement.options[i];
      if (cur.value === value) {
        return new Prime.Document.Element(cur);
      }
    }

    return null;
  },

  /**
   * @returns {string[]} The currently selected options values.
   */
  getSelectedValues: function() {
    return this.element.getSelectedValues();
  },

  /**
   * Determines if the MultipleSelect contains an option with the given value.
   *
   * @param {string} value The value.
   * @returns {boolean} True if the MultipleSelect contains an option with the given value, false otherwise.
   */
  hasOptionWithValue: function(value) {
    return this.findOptionWithValue(value) !== null;
  },

  /**
   * Highlights the final selected option (if there is one) to indicate that it will be unselected if the user clicks
   * the delete key again.
   *
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  highlightOptionForUnselect: function() {
    var options = this.displayContainerSelectedOptionList.getChildren();
    if (options.length > 1) {
      options[options.length - 2].addClass('prime-multiple-select-option-highlighted');
    }

    return this;
  },

  /**
   * @returns {boolean} True if the last option is highlighted for unselect.
   */
  isLastOptionHighlightedForUnselect: function() {
    var options = this.displayContainerSelectedOptionList.getChildren();
    return options.length > 1 && options[options.length - 2].hasClass('prime-multiple-select-option-highlighted');
  },

  /**
   * Removes all of the options from the MultipleSelect.
   *
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  removeAllOptions: function() {
    // Remove in reverse order because the options array is dynamically updated when elements are deleted from the DOM
    var options = this.element.domElement.options;
    for (var i = options.length - 1; i >= 0; i--) {
      this.removeOption(new Prime.Document.Element(options[i]));
    }

    return this;
  },

  /**
   * Removes the highlighted option.
   */
  removeHighlightedOption: function() {
    var options = this.displayContainerSelectedOptionList.getChildren();
    this.deselectOptionWithValue(options[options.length - 2].getAttribute('value'));
    this.search(null);
  },

  /**
   * Removes the given option from the MultipleSelect by removing the option in the select box and the option in the
   * display container.
   *
   * @param {Prime.Document.Element} option The option to remove.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  removeOption: function(option) {
    if (!(option instanceof Prime.Document.Element)) {
      throw new TypeError('MultipleSelect#removeOption only takes Prime.Document.Element instances');
    }

    option.removeFromDOM();

    var id = this._makeOptionID(option);
    var displayOption = Prime.Document.queryById(id);

    // Check if the option has already been selected
    if (displayOption !== null) {
      displayOption.removeFromDOM();
    }

    return this;
  },

  /**
   * Removes the option with the given value from the MultipleSelect by removing the option in the select box and the
   * option in the display container. If the MultipleSelect doesn't contain an option with the given value, this throws
   * an exception.
   *
   * @param {Prime.Document.Element} value The value of the option to remove.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  removeOptionWithValue: function(value) {
    var option = this.findOptionWithValue(value);
    if (option === null) {
      throw new Error('MultipleSelect doesn\'t contain an option with the value [' + value + ']');
    }

    this.removeOption(option);

    return this;
  },

  /**
   * Rebuilds the display from the underlying select element. All of the current display options (li elements) are
   * removed. New display options are added for each selected option in the select box.
   *
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  render: function() {
    // Close the search
    this.searchResultsContainer.hide();

    // Remove the currently displayed options
    this.displayContainerSelectedOptionList.getChildren().each(function(option) {
      option.removeFromDOM();
    });

    // Add the input option since the select options are inserted before it
    this.inputOption = Prime.Document.newElement('<li/>')
        .addClass('prime-multiple-select-input-option')
        .appendTo(this.displayContainerSelectedOptionList);
    this.input = Prime.Document.newElement('<input/>')
        .addClass('prime-multiple-select-input')
        .addEventListener('click', this._handleClickEvent)
        .addEventListener('blur', this._handleBlurEvent)
        .setAttribute('type', 'text')
        .appendTo(this.inputOption);
    this.searcher = new Prime.Widgets.Searcher(this.input, this.searchResultsContainer, this)
        .withCustomAddEnabled(this.customAddEnabled)
        .withCustomAddLabel(this.customAddLabel)
        .withNoSearchResultsLabel(this.noSearchResultsLabel);

    // Add the selected options
    var hasSelectedOptions = false;
    var options = this.element.getOptions();
    for (var i = 0; i < options.length; i++) {
      var option = options[i];
      if (option.isSelected()) {
        this.selectOption(option);
        hasSelectedOptions = true;
      }
    }

    // Put the placeholder attribute in if the MultipleSelect has no selected options
    if (!hasSelectedOptions) {
      this.input.setAttribute('placeholder', this.placeholder);
    }

    this.searcher.resizeInput();

    return this;
  },

  /**
   * Selects the given option by setting the selected attribute on the option in the select box (the object passed in is
   * the option from the select box wrapped in a Prime.Document.Element) and adding it to the display container. If the
   * option is already in the display container, that step is skipped.
   *
   * @param {Prime.Document.Element} option The option object from the select box wrapped in a Prime.Document.Element instance.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  selectOption: function(option) {
    if (!(option instanceof Prime.Document.Element)) {
      throw new TypeError('MultipleSelect#selectOption only takes Prime.Document.Element instances');
    }

    var id = this._makeOptionID(option);

    // Check if the option has already been selected
    if (Prime.Document.queryById(id) === null) {
      option.setSelected(true);

      var li = Prime.Document.newElement('<li/>')
          .addClass('prime-multiple-select-option')
          .setAttribute('value', option.getValue())
          .setId(id)
          .insertBefore(this.inputOption);
      Prime.Document.newElement('<span/>')
          .setHTML(option.getHTML())
          .setAttribute('value', option.getValue())
          .appendTo(li);
      Prime.Document.newElement('<a/>')
          .setAttribute('href', '#')
          .setAttribute('value', option.getValue())
          .addClass('prime-multiple-select-remove-option')
          .setHTML(this.removeIcon)
          .addEventListener('click', this._handleClickEvent)
          .appendTo(li);
    }

    // Remove the placeholder attribute on the input and resize it
    this.input.removeAttribute('placeholder');

    // Close the search results and resize the input
    this.searcher.closeSearchResults();

    // Scroll the display to the bottom
    this.displayContainerSelectedOptionList.scrollToBottom();

    // Fire the custom event
    this.element.fireEvent(Prime.Widgets.MultipleSelect.SelectOptionEvent, option.getValue(), this);

    return this;
  },

  /**
   * Selects the option with the given value by setting the selected attribute on the option in the select box (the
   * object passed in is the option from the select box wrapped in a Prime.Document.Element) and adding it to the display
   * container. If the option is already in the display container, that step is skipped.
   * <p/>
   * If there isn't an option with the given value, this throws an exception.
   *
   * @param {String} value The value of the option to select.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  selectOptionWithValue: function(value) {
    var option = this.findOptionWithValue(value);
    if (option === null) {
      throw new Error('MultipleSelect doesn\'t contain an option with the value [' + value + ']');
    }

    this.selectOption(option);

    return this;
  },

  /**
   * Sets the selected options. This mimics the function on Element to provide consistency.
   *
   * @param {string[]} [arguments] The list of options to select based on their values.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  setSelectedValues: function() {
    this.element.setSelectedValues.apply(this.element, arguments);
    this.render();
    return this;
  },

  /**
   * Unhighlights the last option if it is highlighted.
   *
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  unhighlightOptionForUnselect: function() {
    this.displayContainerSelectedOptionList.getChildren().each(function(element) {
      element.removeClass('prime-multiple-select-option-highlighted');
    });
    return this;
  },

  /**
   * Sets whether or not this MultipleSelect allows custom options to be added.
   *
   * @param {boolean} enabled The flag.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  withCustomAddEnabled: function(enabled) {
    this.customAddEnabled = enabled;
    return this;
  },

  /**
   * Sets the label used when custom options are added.
   *
   * @param {string} customAddLabel The label.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  withCustomAddLabel: function(customAddLabel) {
    this.customAddLabel = customAddLabel;
    return this;
  },

  /**
   * Sets the label that is printed when there are no search results. This must be called before render is called.
   *
   * @param {string} noSearchResultsLabel The label text.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  withNoSearchResultsLabel: function(noSearchResultsLabel) {
    this.noSearchResultsLabel = noSearchResultsLabel;
    return this;
  },

  /**
   * Sets the placeholder text for this MultipleSelect. This must be called before render is called.
   *
   * @param {string} placeholder The placeholder text.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  withPlaceholder: function(placeholder) {
    this.placeholder = placeholder;
    return this;
  },

  /**
   * Sets the remove icon value. This overrides the default value.
   *
   * @param {string} removeIcon The remove icon text.
   * @returns {Prime.Widgets.MultipleSelect} This MultipleSelect.
   */
  withRemoveIcon: function(removeIcon) {
    this.removeIcon = removeIcon;
    return this;
  },

  /* ===================================================================================================================
   * Searcher's callback interface methods.
   * ===================================================================================================================*/

  /**
   * Called when the Searcher gets a keyboard event that deletes beyond the search input. This highlights the last word
   * in the phrase for removal.
   */
  deletedBeyondSearchInput: function() {
    if (this.isLastOptionHighlightedForUnselect()) {
      this.removeHighlightedOption();
    }

    this.highlightOptionForUnselect();
  },

  /**
   * Called when the search needs to determine if the custom add option should be displayed. As long as this
   * MultipleSelect does not contain the given value, the custom add option should be displayed.
   *
   * @param {string} value The value.
   * @returns {boolean} True if this MultipleSelect does not contain the value, false otherwise.
   */
  doesNotContainValue: function(value) {
    return !this.containsOptionWithValue(value);
  },

  /**
   * Called when the Searcher is executing a search. This executes a search via the callback and returns the results.
   *
   * @param {string} [searchText] The text to search for.
   * @returns {Object} The SearchResults.
   */
  search: function(searchText) {
    this.unhighlightOptionForUnselect();

    var options = this.element.domElement.options;
    var selectableOptions = [];
    for (var i = 0; i < options.length; i++) {
      var option = new Prime.Document.Element(options[i]);
      if (option.isSelected()) {
        continue;
      }

      var html = option.getHTML();
      if (searchText === null || searchText === '' || html.toLowerCase().indexOf(searchText.toLowerCase()) === 0) {
        selectableOptions.push(html);
      }
    }

    // Alphabetize the options
    if (selectableOptions.length > 0) {
      selectableOptions.sort();
    }

    return {results: selectableOptions, tooManyResults: false};
  },

  /**
   * Called when the Searcher gets an event that causes a search result to be selected. This adds the word.
   */
  selectSearchResult: function(value) {
    // Add the custom option if there is one
    var option = this.findOptionWithText(value);
    if (option === null) {
      this.addOption(value, value);
      option = this.findOptionWithText(value)
    }

    this.selectOption(option);
  },


  /* ===================================================================================================================
   * Private Methods
   * ===================================================================================================================*/

  /**
   * Handles the blur event when the input goes out of focus.
   *
   * @private
   */
  _handleBlurEvent: function() {
    window.setTimeout((function() {
      if (document.activeElement !== this.input.domElement) {
        this.searcher.closeSearchResults();
      }
    }).bind(this), 300);
  },

  /**
   * Handles all click events sent to the MultipleSelect.
   *
   * @param {Event} event The mouse event.
   * @private
   */
  _handleClickEvent: function(event) {
    var target = new Prime.Document.Element(event.target);
    if (target.hasClass('prime-multiple-select-remove-option')) {
      this.removeOptionWithValue(target.getAttribute('value'));
    } else if (target.is('span') || target.is('span')) {
      target.selectElementContents();
    } else if (target.is('.prime-multiple-select-option-list') || target.getParent().is('.prime-multiple-select-display')) {
      this.input.focus();
    }

    Prime.Utils.stopEvent(event);
  },

  /**
   * Handles mouse clicks outside of this MultipleSelect. If they clicked anything that is not within this MultipleSelect,
   * it closes the search results.
   *
   * @param {Event} event The event.
   * @returns {boolean} Always true so the event is bubbled.
   * @private
   */
  _handleGlobalClickEvent: function(event) {
    var target = new Prime.Document.Element(event.target);
    if (this.displayContainer.domElement !== target.domElement && !target.isChildOf(this.displayContainer)) {
      this.searcher.closeSearchResults();
    }
  },

  /**
   * Handles all key up events sent to the display container.
   *
   * @param {Event} event The browser event object.
   * @returns {boolean} True if the search display is not open, false otherwise. This will prevent the event from continuing.
   * @private
   */
  _handleKeyUpEvent: function(event) {
    var key = event.keyCode;
    if (key === Prime.Events.Keys.ESCAPE) {
      this.unhighlightOptionForUnselect();
    }
  },

  /**
   * Makes an ID for the option.
   *
   * @param {Prime.Document.Element} option The option to make the ID for.
   * @private
   */
  _makeOptionID: function(option) {
    return this.element.getId() + '-option-' + option.getValue().replace(' ', '-');
  }
};/*
 * Copyright (c) 2014-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};


/**
 * Constructs a PhraseBuilder object for the given element.
 *
 * The PhraseBuilder uses a callback function to build a set of search results. The user can then
 * select one of those search results and add it to their phrase. A fully rendered PhraseBuilder might look something
 * like this:
 *
 * <pre>
 * &lt;select id="foo">
 *   &lt;option value="one">One&lt;/option>
 *   &lt;option value="two">Two&lt;/option>
 *   &lt;option value="three">Three&lt;/option>
 * &lt;/select>
 * &lt;div id="foo-display" class="prime-phrase-builder-display">
 *   &lt;ul id="foo-option-list" class="prime-phrase-builder-option-list">
 *     &lt;li id="foo-option-one" class="prime-phrase-builder-option">&lt;span>One&lt;/span>&lt;a href="#">X&lt;/a>&lt;/li>
 *     &lt;li id="foo-option-two" class="prime-phrase-builder-option">&lt;span>Two&lt;/span>&lt;a href="#">X&lt;/a>&lt;/li>
 *     &lt;li id="foo-option-three" class="prime-phrase-builder-option">&lt;span>Three&lt;/span>&lt;a href="#">X&lt;/a>&lt;/li>
 *     &lt;li class="prime-phrase-builder-input-option">&lt;input type="text" class="prime-phrase-builder-input" value="F"/>&lt;/li>
 *   &lt;/ul>
 *   &lt;ul class="prime-phrase-builder-search-result-list">
 *     &lt;li class="prime-phrase-builder-search-result">Four&lt;/li>
 *     &lt;li class="prime-phrase-builder-search-result">Five&lt;/li>
 *     &lt;li class="prime-phrase-builder-search-result">Fifteen&lt;/li>
 *     &lt;li class="prime-phrase-builder-add-custom">Add Custom Entry: F/li>
 *   &lt;/ul>
 * &lt;/div>
 * </pore>
 *
 * The with* methods can be used to setup the configuration for this PhraseBuilder, but here are some defaults:
 *
 * <ul>
 *   <li>placeholder = "Choose"</li>
 *   <li>customAddCallback = no-op</li>
 *   <li>customAddLabel = "Add Custom Value:"</li>
 *   <li>noSearchResultsLabel = "No Matches For:"</li>
 * </ul>
 *
 * @constructor
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element for the PhraseBuilder.
 * @param {Function} searchCallback The callback function used for searching.
 */
Prime.Widgets.PhraseBuilder = function(element, searchCallback) {
  this.element = Prime.Document.Element.wrap(element);
  this.customAddEnabled = false;
  if (this.element.domElement.tagName !== 'SELECT') {
    throw new TypeError('You can only use Prime.Widgets.PhraseBuilder with select elements');
  }

  if (this.element.getAttribute('multiple') !== 'multiple') {
    throw new TypeError('The select box you are attempting to convert to a Prime.Widgets.PhraseBuilder must have the multiple="multiple" attribute set');
  }

  Prime.Utils.bindAll(this);

  this.element.hide();

  this.searchCallback = searchCallback;

  var id = this.element.getId();
  if (id === null || id === '') {
    id = 'prime-phrase-builder' + Prime.Widgets.PhraseBuilder.count++;
    this.element.setId(id);
  }

  this.placeholder = 'Type Words for Phrase Here';
  this.customAddLabel = null;

  this.displayContainer = Prime.Document.queryById(id + '-display');
  this.input = null;
  if (this.displayContainer === null) {
    this.displayContainer = Prime.Document.newElement('<div/>').setId(id + '-display').addClass('prime-phrase-builder-display').addEventListener('click', this._handleClickEvent).addEventListener('keyup', this._handleKeyUpEvent).insertAfter(this.element);

    this.displayContainerSelectedOptionList = Prime.Document.newElement('<ul/>').addClass('prime-phrase-builder-option-list').appendTo(this.displayContainer);

    this.searchResultsContainer = Prime.Document.newElement('<ul/>').addClass('prime-phrase-builder-search-result-list').hide().appendTo(this.displayContainer);
  } else {
    this.displayContainer.removeAllEventListeners().addEventListener('click', this._handleClickEvent).addEventListener('keyup', this._handleKeyUpEvent);
    this.displayContainerSelectedOptionList = Prime.Document.queryFirst('.prime-phrase-builder-option-list', this.displayContainer);
    this.searchResultsContainer = Prime.Document.queryFirst('.prime-phrase-builder-search-result-list', this.displayContainer);
  }

  Prime.Document.queryFirst('html').addEventListener('click', this._handleGlobalClickEvent);
};

/*
 * Statics
 */
Prime.Widgets.PhraseBuilder.count = 1;

Prime.Widgets.PhraseBuilder.prototype = {
  /**
   * Adds the given word to the phrase by adding an option to the backing select and adding the word to the display.
   * This also closes the search if it is open.
   *
   * @param {String} word The word to add.
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  addWord: function(word) {
    if (this.containsWord(word)) {
      return this;
    }

    var option = Prime.Document.newElement('<option/>').setValue(word).setHTML(word).setAttribute('selected', 'selected').appendTo(this.element);

    this._addSelectedOptionToDisplay(option);

    // Remove the placeholder attribute on the input
    this.input.removeAttribute('placeholder');

    // Close the search results
    this.searcher.closeSearchResults();

    // Scroll the display to the bottom
    this.displayContainerSelectedOptionList.scrollToBottom();

    return this;
  },

  /**
   * Determines if this PhraseBuilder contains the given word.
   *
   * @param {string} word The word to look for.
   */
  containsWord: function(word) {
    return this._findOptionForWord(word) !== null;
  },

  /**
   * @returns {string[]} The words in the phrase.
   */
  getWords: function() {
    return this.element.getSelectedValues();
  },

  /**
   * Highlights the last word in the phrase (if there is one) to indicate that it will be removed if the user clicks the
   * delete key again.
   *
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  highlightWordForRemoval: function() {
    var options = this.displayContainerSelectedOptionList.getChildren();
    if (options.length > 1) {
      options[options.length - 2].addClass('prime-phrase-builder-option-highlighted');
    }

    return this;
  },

  /**
   * @returns {boolean} True if the last word is highlighted for removal.
   */
  isLastWordHighlightedForRemoval: function() {
    var options = this.displayContainerSelectedOptionList.getChildren();
    return options.length > 1 && options[options.length - 2].hasClass('prime-phrase-builder-option-highlighted');
  },

  /**
   * Removes all of the words in the phrase.
   *
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  removeAllWords: function() {
    // Remove in reverse order because the options array is dynamically updated when elements are deleted from the DOM
    var options = this.element.domElement.options;
    for (var i = options.length - 1; i >= 0; i--) {
      this.removeWord(new Prime.Document.Element(options[i]).getTextContent());
    }

    return this;
  },

  /**
   * Removes the highlighted option.
   */
  removeHighlightedWord: function() {
    var options = this.displayContainerSelectedOptionList.getChildren();
    this.removeWord(options[options.length - 2].getAttribute('value'));
  },

  /**
   * Removes the given word from the phrase. This removes the option from the select and from the display.
   *
   * @param {string} word The word to remove.
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  removeWord: function(word) {
    var option = this._findOptionForWord(word);
    if (option === null) {
      return this;
    }

    option.removeFromDOM();

    var id = this._makeOptionID(option);
    var displayOption = Prime.Document.queryById(id);
    if (displayOption !== null) {
      displayOption.removeFromDOM();
    }

    // If there are no selected options left, add back the placeholder attribute to the input and resize it
    if (Prime.Document.query('.prime-phrase-builder-option', this.displayContainerSelectedOptionList).length === 0) {
      this.input.setAttribute('placeholder', this.placeholder);
      this.searcher.resizeInput();
    }

    return this;
  },

  /**
   * Rebuilds the display from the underlying select element. All of the current display options (li elements) are
   * removed. New display options are added for each selected option in the select box.
   *
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  render: function() {
    // Remove the currently displayed options
    this.displayContainerSelectedOptionList.getChildren().each(function(option) {
      option.removeFromDOM();
    });

    // Add the input option since the select options are inserted before it
    this.inputOption = Prime.Document.newElement('<li/>').addClass('prime-phrase-builder-input-option').appendTo(this.displayContainerSelectedOptionList);
    this.input = Prime.Document.newElement('<input/>').addClass('prime-phrase-builder-input').setAttribute('type', 'text').appendTo(this.inputOption);
    this.searcher = new Prime.Widgets.Searcher(this.input, this.searchResultsContainer, this)
        .withCustomAddEnabled(this.customAddEnabled);
    if (this.customAddEnabled) {
      this.searcher.withCustomAddCallback(this.customAddCallback);
    }
    if (this.customAddLabel !== null) {
      this.searcher.withCustomAddLabel(this.customAddLabel);
    }

    // Add the selected options
    for (var i = 0; i < this.element.domElement.length; i++) {
      var option = this._createOption(this.element.domElement.options[i]);
      this._addSelectedOptionToDisplay(option);
    }

    // Put the placeholder attribute in if the PhraseBuilder has no selected options
    if (this.element.domElement.length === 0) {
      this.input.setAttribute('placeholder', this.placeholder);
    }

    // This closes the search results and resizes everything inside it
    this.searcher.closeSearchResults();

    return this;
  },

  /**
   * Create a new Prime Element for the option and set attributes.
   * Added so that subclasses can define how this should work.
   */
  _createOption: function(option) {
    return new Prime.Document.Element(option).setAttribute('selected', 'selected');
  },

  /**
   * Unhighlights the last option if it is highlighted.
   *
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  unhighlightWordForRemoval: function() {
    this.displayContainerSelectedOptionList.getChildren().each(function(element) {
      element.removeClass('prime-phrase-builder-option-highlighted');
    });
    return this;
  },

  /**
   * Sets the placeholder text for this PhraseBuilder. This must be called before render is called.
   *
   * @param {string} placeholder The placeholder text.
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  withPlaceholder: function(placeholder) {
    this.placeholder = placeholder;
    return this;
  },

  /**
   * Sets whether or not this Searcher allows custom options to be added and, optionally, a callback function.
   *
   * @param {function} callback The function to call that will return true if the custom option can be added.
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  withCustomAdd: function(callback) {
    this.customAddEnabled = true;
    if (callback === undefined) {
      this.customAddCallback = function() {
        return true;
      };
    } else {
      this.customAddCallback = callback;
    }
    return this;
  },

  /**
   * Sets the label used when custom options are added.
   *
   * @param {string} customAddLabel The label.
   * @returns {Prime.Widgets.PhraseBuilder} This PhraseBuilder.
   */
  withCustomAddLabel: function(customAddLabel) {
    this.customAddLabel = customAddLabel;
    return this;
  },

  /* ===================================================================================================================
   * Searcher's callback interface methods.
   * ===================================================================================================================*/

  /**
   * Called when the Searcher gets a keyboard event that deletes beyond the search input. This highlights the last word
   * in the phrase for removal.
   */
  deletedBeyondSearchInput: function() {
    if (this.isLastWordHighlightedForRemoval()) {
      this.removeHighlightedWord();
    }

    this.highlightWordForRemoval();
  },

  /**
   * Called when the Searcher is executing a search. This executes a search via the callback and returns the results.
   *
   * @param {string} [searchText] The text to search for.
   * @returns The SearchResults.
   */
  search: function(searchText) {
    this.unhighlightWordForRemoval();
    return this.searchCallback(searchText, this.getWords());
  },

  /**
   * Called when the Searcher gets an event that causes a search result to be selected. This adds the word.
   */
  selectSearchResult: function(value) {
    this.addWord(value);
  },


  /* ===================================================================================================================
   * Private methods
   * ===================================================================================================================*/

  /**
   * Adds the given selected option to the display.
   *
   * @param {Prime.Document.Element} option The option.
   * @protected
   */
  _addSelectedOptionToDisplay: function(option) {
    var id = this._makeOptionID(option);

    // Check if the option has already been selected
    if (Prime.Document.queryById(id) === null) {
      var li = Prime.Document.newElement('<li/>')
          .addClass('prime-phrase-builder-option')
          .setAttribute('value', option.getValue())
          .setId(id)
          .insertBefore(this.inputOption);
      Prime.Document.newElement('<span/>')
          .setHTML(option.getHTML())
          .setAttribute('value', option.getValue())
          .appendTo(li);
      Prime.Document.newElement('<a/>')
          .setAttribute('href', '#')
          .setAttribute('value', option.getValue())
          .addClass('prime-phrase-builder-remove-option')
          .setHTML('X')
          .addEventListener('click', this._handleClickEvent)
          .appendTo(li);
    }
  },

  /**
   * Finds the HTMLSelectOption for the given word in the phrase and returns it wrapped in a Prime.Document.Element.
   *
   * @param {string} word The word to look for.
   * @returns {Prime.Document.Element} The option element or null.
   * @private
   */
  _findOptionForWord: function(word) {
    var options = this.element.getOptions();
    for (var i = 0; i < options.length; i++) {
      if (options[i].getTextContent() === word) {
        return options[i];
      }
    }

    return null;
  },

  /**
   * Handles all click events sent to the PhraseBuilder.
   *
   * @param {Event} event The mouse event.
   * @private
   */
  _handleClickEvent: function(event) {
    var target = new Prime.Document.Element(event.currentTarget);
    if (this.displayContainer.domElement === target.domElement) {
      this.searcher.focus();
    } else if (target.hasClass('prime-phrase-builder-remove-option')) {
      this.removeWord(target.getAttribute('value'));
    } else {
      console.log('Clicked something else target=[' + event.target + '] currentTarget=[' + event.currentTarget + ']');
    }

    Prime.Utils.stopEvent(event);
  },

  /**
   * Handles when the input field is focused by opening the search results.
   *
   * @private
   */
  _handleFocusEvent: function() {
    this.search();
  },

  /**
   * Handles mouse clicks outside of this PhraseBuilder. If they clicked anything that is not within this PhraseBuilder,
   * it closes the search results.
   *
   * @param {Event} event The event.
   * @returns {boolean} Always true so the event is bubbled.
   * @private
   */
  _handleGlobalClickEvent: function(event) {
    var target = new Prime.Document.Element(event.target);
    if (this.displayContainer.domElement !== target.domElement && !target.isChildOf(this.displayContainer)) {
      this.searcher.closeSearchResults();
    }
  },

  /**
   * Handles all key up events sent to the display container.
   *
   * @param {Event} event The browser event object.
   * @returns {boolean} True if the search display is not open, false otherwise. This will prevent the event from continuing.
   * @private
   */
  _handleKeyUpEvent: function(event) {
    var key = event.keyCode;
    if (key === Prime.Events.Keys.ESCAPE) {
      this.unhighlightWordForRemoval();
    }
  },

  /**
   * Makes an ID for the option.
   *
   * @param {Prime.Document.Element} option The option to make the ID for.
   * @private
   */
  _makeOptionID: function(option) {
    return this.element.getId() + '-option-' + option.getValue().replace(' ', '-');
  }
};

/**
 * A Prime.Widgets.PhraseBuilder that supports using the same word multiple times
 */
Prime.Widgets.PhraseBuilderSupportsDupes = function(element, searchCallback) {
  Prime.Widgets.PhraseBuilder.call(this, element, searchCallback);
};

Prime.Widgets.PhraseBuilderSupportsDupes.prototype = Object.create(Prime.Widgets.PhraseBuilder.prototype);
Prime.Widgets.PhraseBuilderSupportsDupes.constructor = Prime.Widgets.PhraseBuilderSupportsDupes;

/**
 * The difference is that the created option element will have a data attribute that hold
 * the display element's ID, and there is no check to see if the word is already in the option set
 */
Prime.Widgets.PhraseBuilderSupportsDupes.prototype.addWord = function(word) {
  var option = Prime.Document.newElement('<option/>')
      .setValue(word)
      .setHTML(word)
      .setAttribute('selected', 'selected')
      .setDataAttribute('display-id', '' + Math.random() + 1)
      .appendTo(this.element);

  this._addSelectedOptionToDisplay(option);

  // Remove the placeholder attribute on the input
  this.input.removeAttribute('placeholder');

  // Close the search results
  this.searcher.closeSearchResults();

  // Scroll the display to the bottom
  this.displayContainerSelectedOptionList.scrollToBottom();

  return this;
};

/**
 * This is now based on a data attribute on the option, not based on the name
 */
Prime.Widgets.PhraseBuilderSupportsDupes.prototype._makeOptionID = function(option) {
  return option.getDataAttribute('displayId');
};

/**
 * Override to add the data attribute
 */
Prime.Widgets.PhraseBuilderSupportsDupes.prototype._createOption = function(option) {
  return new Prime.Document.Element(option)
      .setAttribute('selected', 'selected')
      .setDataAttribute('display-id', '' + Math.random() + 1);
};/*
 * Copyright (c) 2014-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};


/**
 * Constructs a Searcher object for the given text input.
 *
 * The Searcher object can be attached and used in conjunction with any other widgets in a generic manner. It
 * provides search capabilities and manages the search results. This is useful for MultipleSelects, IntelliSense and
 * other widgets. Here's the HTML for the search results.
 *
 * <pre>
 *   &lt;input type="text" class="prime-search-result-input" value="F"/>
 *   &lt;ul class="prime-search-result-list">
 *     &lt;li class="prime-search-result">Four&lt;/li>
 *     &lt;li class="prime-search-result">Five&lt;/li>
 *     &lt;li class="prime-search-result">Fifteen&lt;/li>
 *     &lt;li class="prime-add-custom">Add Custom Entry: F/li>
 *   &lt;/ul>
 * &lt;/div>
 * </pre>
 *
 * The with* methods can be used to setup the configuration for this SearchResults, but here are some defaults:
 *
 * <ul>
 *   <li>customAddEnabled = true</li>
 *   <li>customAddCallback = function(customValue){return true;}</li>
 *   <li>customAddLabel = "Add Custom:"</li>
 *   <li>tooManySearchResultsLabel = "Too Many Matches For:"</li>
 *   <li>noSearchResultsLabel = "No Matches For:"</li>
 * </ul>
 *
 * The callback object must conform to this interface:
 *
 * <pre>
 *   CallbackObject {
 *     object{results:Array, tooManyResults:boolean} search(_searchString:string),
 *     void selectSearchResult(selectedSearchResult:string),
 *     void deletedBeyondSearchInput()
 *   }
 * </pre>
 *
 * @constructor
 * @param {Prime.Document.Element|Element|EventTarget} inputElement The input element that is used to execute the search.
 * @param {Prime.Document.Element|Element|EventTarget} searchResultsContainer The element that is used to store the search results.
 * @param {*} callbackObject The object that is used to callback for searching and numerous other functions to help
 *            communicate state and determine how to draw the input and search results.
 */
Prime.Widgets.Searcher = function(inputElement, searchResultsContainer, callbackObject) {
  this.inputElement = Prime.Document.Element.wrap(inputElement);
  if (this.inputElement.domElement.tagName !== 'INPUT') {
    throw new TypeError('You can only use Prime.Widgets.SearchResults with INPUT elements');
  }

  Prime.Utils.bindAll(this);

  this.inputElement.
      addClass('prime-searcher-input').
      addEventListener('blur', this._handleBlurEvent).
      addEventListener('click', this._handleClickEvent).
      addEventListener('keyup', this._handleKeyUpEvent).
      addEventListener('keydown', this._handleKeyDownEvent).
      addEventListener('focus', this._handleFocusEvent);

  this.searchResultsContainer = (searchResultsContainer instanceof Prime.Document.Element) ? searchResultsContainer : new Prime.Document.Element(searchResultsContainer);
  this.searchResultsContainer.addClass('prime-searcher-search-results-list');

  this.noSearchResultsLabel = 'No Matches For: ';
  this.tooManySearchResultsLabel = 'Too Many Matches For: ';
  this.customAddEnabled = true;
  this.customAddCallback = function() {return true;};
  this.customAddLabel = 'Add Custom: ';
  this.callbackObject = callbackObject;

  this.closeSearchResults();
};


Prime.Widgets.Searcher.prototype = {
  /**
   * Closes the search results display, unhighlights any options that are highlighted and resets the input's value to
   * empty string.
   */
  closeSearchResults: function() {
    this._removeAllSearchResults();
    this.searchResultsContainer.hide();
    this.inputElement.setValue('');
    this.resizeInput();
  },

  focus: function() {
    this.inputElement.focus();
  },

  /**
   * @returns {Prime.Document.Element} The highlighted search result or null.
   */
  getHighlightedSearchResult: function() {
    return Prime.Document.queryFirst('.prime-searcher-highlighted-search-result', this.searchResultsContainer);
  },

  /**
   * Highlights the next search result if one is highlighted. If there isn't a highlighted search result, this
   * highlights the first one. This method handles wrapping.
   *
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  highlightNextSearchResult: function() {
    var searchResult = this.getHighlightedSearchResult();
    if (searchResult !== null) {
      searchResult = searchResult.getNextSibling();
    }

    // Grab the first search result in the list if there isn't a next sibling
    if (searchResult === null) {
      searchResult = Prime.Document.queryFirst('.prime-searcher-search-result', this.searchResultsContainer);
    }

    if (searchResult !== null) {
      this.highlightSearchResult(searchResult);
    }

    return this;
  },

  /**
   * Highlights the previous search result if one is highlighted. If there isn't a highlighted search result, this
   * selects the last one. This method handles wrapping.
   *
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  highlightPreviousSearchResult: function() {
    var searchResult = this.getHighlightedSearchResult();
    if (searchResult !== null) {
      searchResult = searchResult.getPreviousSibling();
    }

    if (searchResult === null) {
      searchResult = Prime.Document.queryLast('.prime-searcher-search-result', this.searchResultsContainer);
    }

    if (searchResult !== null) {
      this.highlightSearchResult(searchResult);
    }

    return this;
  },

  /**
   * Highlights the given search result.
   *
   * @param {Prime.Document.Element} searchResult The search result to highlight.
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  highlightSearchResult: function(searchResult) {
    this.searchResultsContainer.getChildren().each(function(element) {
      element.removeClass('prime-searcher-highlighted-search-result');
    });

    searchResult.addClass('prime-searcher-highlighted-search-result');
    var scrollTop = this.searchResultsContainer.getScrollTop();
    var height = this.searchResultsContainer.getHeight();
    var searchResultOffset = searchResult.getOffsetTop();
    if (searchResultOffset + 1 >= scrollTop + height) {
      this.searchResultsContainer.scrollTo(searchResult.getOffsetTop() - this.searchResultsContainer.getHeight() + searchResult.getOuterHeight());
    } else if (searchResultOffset < scrollTop) {
      this.searchResultsContainer.scrollTo(searchResultOffset);
    }

    return this;
  },

  /**
   * @returns {boolean} True if the search results add custom option is being displayed currently.
   */
  isCustomAddVisible: function() {
    return Prime.Document.queryFirst('.prime-searcher-add-custom', this.searchResultsContainer) !== null;
  },

  /**
   * @returns {boolean} True if any search results are being displayed currently.
   */
  isSearchResultsVisible: function() {
    return this.searchResultsContainer.isVisible();
  },

  /**
   * Poor mans resizing of the input field as the user types into it.
   */
  resizeInput: function() {
    var text = this.inputElement.getValue() === '' ? this.inputElement.getAttribute('placeholder') : this.inputElement.getValue();
    var newLength = Prime.Utils.calculateTextLength(this.inputElement, text) + 35;
    this.inputElement.setWidth(newLength);
  },

  /**
   * Executes a search by optionally updating the input to the given value (if specified) and then rebuilding the search
   * results using the input's value. This method also puts focus on the input and shows the search results (in case
   * they are hidden for any reason).
   *
   * @param {string} [searchText] The text to search for (this value is also set into the input box). If this is not
   * specified then the search is run using the input's value.
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  search: function(searchText) {
    // Set the search text into the input box if it is different and then lowercase it
    if (Prime.Utils.isDefined(searchText) && this.inputElement.getValue() !== searchText) {
      this.inputElement.setValue(searchText);
    }

    searchText = Prime.Utils.isDefined(searchText) ? searchText.toLowerCase() : this.inputElement.getValue();
    this.resizeInput();

    // Clear the search results (if there are any)
    this._removeAllSearchResults();

    // Call the callback
    var searchResults = this.callbackObject.search(searchText);
    if (!searchResults.hasOwnProperty('results') || !searchResults.hasOwnProperty('tooManyResults')) {
      throw new TypeError('The callback must return an Object that contains the properties results[Array] and tooManyResults[boolean]');
    }

    var count = 0;
    var matchingSearchResultElement = null;
    for (var i = 0; i < searchResults.results.length; i++) {
      var searchResult = searchResults.results[i];
      var element  = Prime.Document.newElement('<li/>').
          addClass('prime-searcher-search-result').
          setAttribute('value', searchResult).
          setHTML(searchResult).
          addEventListener('click', this._handleClickEvent).
          addEventListener('mouseover', this._handleMouseOverEvent).
          appendTo(this.searchResultsContainer);
      if (searchResult.toLowerCase().trim() === searchText.toLowerCase().trim()) {
        matchingSearchResultElement = element;
      }

      count++;
    }

    // Show the custom add option if necessary
    var trimmedLength = searchText.trim().length;
    if (this.customAddEnabled && trimmedLength !== 0 && matchingSearchResultElement === null
        && ( !('doesNotContainValue' in this.callbackObject) || this.callbackObject.doesNotContainValue(searchText))) {
      matchingSearchResultElement = Prime.Document.newElement('<li/>').
          addClass('prime-searcher-search-result prime-searcher-add-custom').
          addEventListener('click', this._handleClickEvent).
          addEventListener('mouseover', this._handleMouseOverEvent).
          setHTML(this.customAddLabel + searchText).
          appendTo(this.searchResultsContainer);
      count++;
    }

    if (count === 0 && trimmedLength !== 0) {
      Prime.Document.newElement('<li/>').
          addClass('prime-searcher-no-search-results').
          setHTML(this.noSearchResultsLabel + searchText).
          appendTo(this.searchResultsContainer);
      count++;
    }

    // Handle too many results
    if (searchResults.tooManyResults) {
      Prime.Document.newElement('<li/>').
          addClass('prime-searcher-too-many-search-results').
          setHTML(this.tooManySearchResultsLabel + searchText).
          appendTo(this.searchResultsContainer);
      count++;
    }

    if (count !== 0) {
      this.searchResultsContainer.show();

      if (count >= 10) {
        this.searchResultsContainer.setHeight(this.searchResultsContainer.getChildren()[0].getOuterHeight() * 10 + 1);
      } else {
        this.searchResultsContainer.setHeight(this.searchResultsContainer.getChildren()[0].getOuterHeight() * count + 1);
      }
    } else {
      this.searchResultsContainer.hide();
    }

    if (matchingSearchResultElement !== null) {
      this.highlightSearchResult(matchingSearchResultElement);
    }

    return this;
  },

  /**
   * Selects the highlighted search result unless there isn't one highlighted, in which case, this does nothing.
   *
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  selectHighlightedSearchResult: function() {
    var searchResult = this.getHighlightedSearchResult();
    if (searchResult === null) {
      return this;
    }

    var custom = searchResult.hasClass('prime-searcher-add-custom');
    var value = (custom) ? this.inputElement.getValue().trim() : searchResult.getHTML();
    if(custom) {
      // The client of this searcher needs to warn the user.
      if(!this.customAddCallback(value)) {
        return this;
      }
    }

    this.callbackObject.selectSearchResult(value);
    this.closeSearchResults();

    return this;
  },

  /**
   * Sets whether or not this Searcher allows custom options to be added.
   *
   * @param {boolean} enabled The flag.
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  withCustomAddEnabled: function(enabled) {
    this.customAddEnabled = enabled;
    return this;
  },

  /**
   * Sets whether or not this Searcher allows custom options to be added.
   *
   * @param {Function} callback The function to call that will return true if the custom option can be added.
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  withCustomAddCallback: function(callback) {
    this.customAddCallback = callback;
    return this;
  },

  /**
   * Sets the label used when custom options are added.
   *
   * @param {string} customAddLabel The label.
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  withCustomAddLabel: function(customAddLabel) {
    this.customAddLabel = customAddLabel;
    return this;
  },

  /**
   * Sets the label that is printed when there are too many search results.
   *
   * @param {string} tooManySearchResultsLabel The label text.
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  withTooManySearchResultsLabel: function(tooManySearchResultsLabel) {
    this.tooManySearchResultsLabel = tooManySearchResultsLabel;
    return this;
  },

  /**
   * Sets the label that is printed when there are no search results.
   *
   * @param {string} noSearchResultsLabel The label text.
   * @returns {Prime.Widgets.Searcher} This Searcher.
   */
  withNoSearchResultsLabel: function(noSearchResultsLabel) {
    this.noSearchResultsLabel = noSearchResultsLabel;
    return this;
  },

  /* ===================================================================================================================
   * Private methods
   * ===================================================================================================================*/

  /**
   * Handles the blur event when the input goes out of focus.
   *
   * @private
   */
  _handleBlurEvent: function() {
    window.setTimeout((function() {
      if (document.activeElement !== this.inputElement.domElement) {
        this.closeSearchResults();
      }
    }).bind(this), 300);
  },

  /**
   * Handles all click events sent to the Searcher.
   *
   * @param {Event} event The mouse event.
   * @private
   */
  _handleClickEvent: function(event) {
    var target = new Prime.Document.Element(event.currentTarget);
    if (target.hasClass('prime-searcher-add-custom') || target.hasClass('prime-searcher-search-result')) {
      this.selectHighlightedSearchResult();
    } else if (target.domElement === this.inputElement.domElement) {
      this.search();
    } else {
      console.log('Clicked something else target=[' + event.target + '] currentTarget=[' + event.currentTarget + ']');
    }
  },

  /**
   * Handles when the input field is focused by opening the search results.
   *
   * @private
   */
  _handleFocusEvent: function() {
    this.search();
  },

  /**
   * Handles the key down events that should not be propagated.
   *
   * @param {KeyboardEvent} event The keyboard event object.
   * @private
   */
  _handleKeyDownEvent: function(event) {
    var key = event.keyCode;
    if (key === Prime.Events.Keys.BACKSPACE) {
      this.previousSearchString = this.inputElement.getValue();
    } else if (key === Prime.Events.Keys.UP_ARROW) {
      this.highlightPreviousSearchResult();
      Prime.Utils.stopEvent(event);
    } else if (key === Prime.Events.Keys.DOWN_ARROW) {
      if (this.isSearchResultsVisible()) {
        this.highlightNextSearchResult();
      } else {
        this.search();
      }

      Prime.Utils.stopEvent(event);
    } else if (key === Prime.Events.Keys.ENTER) {
      Prime.Utils.stopEvent(event); // Don't bubble enter otherwise the form submits
    }
  },

  /**
   * Handles all key up events sent to the search results container.
   *
   * @param {KeyboardEvent} event The keyboard event object.
   *  @private
   */
  _handleKeyUpEvent: function(event) {
    var key = event.keyCode;
    var value = this.inputElement.getValue();

    if (key == Prime.Events.Keys.BACKSPACE) {
      if (value === '' && this.previousSearchString === '') {
        this.callbackObject.deletedBeyondSearchInput();
      } else {
        this.search();
      }
    } else if (key === Prime.Events.Keys.ENTER) {
      // If a search result is highlighted, add it
      if (this.getHighlightedSearchResult() !== null) {
        this.selectHighlightedSearchResult();
      }

      Prime.Utils.stopEvent(event);
    } else if (key === Prime.Events.Keys.ESCAPE) {
      this.searchResultsContainer.hide();
    } else if (key === Prime.Events.Keys.SPACE || key === Prime.Events.Keys.DELETE ||
        (key >= 48 && key <= 90) || (key >= 96 && key <= 111) || (key >= 186 && key <= 192) || (key >= 219 && key <= 222)) {
      this.search();
    }
  },

  /**
   * Handles mouseover events for the search results (only) by highlighting the event target.
   *
   * @param {Event} event The mouseover event.
   * @private
   */
  _handleMouseOverEvent: function(event) {
    var target = new Prime.Document.Element(event.currentTarget);
    this.highlightSearchResult(target);
  },

  /**
   * Removes all of the search results.
   *
   * @private
   */
  _removeAllSearchResults: function() {
    Prime.Document.query('li', this.searchResultsContainer).removeAllFromDOM();
  }
};
/*
 * Copyright (c) 2015-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};
Prime.Widgets = Prime.Widgets || {};

/**
 * Constructs the side menu.
 *
 * @param {Prime.Document.Element|Element} button The button element that is used to open the side menu.
 * @param {Prime.Document.Element|Element} mainBody The main body element of the page. This should be after the side
 * menu element in the DOM and contain the entire page (but not the &lt;body> element).
 * @constructor
 */
Prime.Widgets.SideMenu = function(button, mainBody) {
  Prime.Utils.bindAll(this);

  this.body = new Prime.Document.Element(document.body);
  Prime.Document.Element.wrap(button).addEventListener('click', this._handleClickEvent);

  Prime.Document.Element.wrap(mainBody).addClass('prime-side-menu-body');
  this._setInitialOptions();
};

Prime.Widgets.SideMenu.constructor = Prime.Widgets.SideMenu;

Prime.Widgets.SideMenu.prototype = {
  /**
   * Creates a side menu by copying an existing side menu into a new element that is the first child under the &lt;body>
   * element.
   *
   * @param {Prime.Document.Element} element The existing menu element to copy into a new side menu.
   */
  copyFromElement: function(element) {
    var sideMenu = Prime.Document.newElement('<nav/>')
        .prependTo(this.body)
        .addClass('prime-side-menu')
        .setHTML(element.getHTML());
    sideMenu.query('a').each(function(e) {
      e.addEventListener('click', this._handleTOCClickEvent);
    }.bind(this));
  },

  /**
   * Closes the side menu.
   * @returns {Prime.Widgets.SideMenu} This.
   */
  close: function() {
    this.body.removeClass('prime-side-menu-open');
    return this;
  },

  /**
   * @returns {boolean} True if the side menu is currently open.
   */
  isOpen: function() {
    return this.body.hasClass('prime-side-menu-open');
  },

  /**
   * Opens the mobile nav.
   * @returns {Prime.Widgets.SideMenu} This.
   */
  open: function() {
    this.body.addClass('prime-side-menu-open');
    this.touchable = new Prime.Widgets.Touchable(this.body).withSwipeLeftHandler(this._handleSwipeLeft);
    return this;
  },

  /**
   * Sets this SideMenu to use the given element. You can also call copyFromElement to setup the side menu.
   *
   * @param {Prime.Document.Element|Element} sideMenuElement The existing side menu element.
   * @returns {Prime.Widgets.SideMenu} This.
   */
  usingSideMenuElement: function(sideMenuElement) {
    sideMenuElement = Prime.Document.Element.wrap(sideMenuElement);
    sideMenuElement.query('a').each(function(e) {
      e.addEventListener('click', this._handleTOCClickEvent);
    }.bind(this));

    return this;
  },

  /**
   * Set more than one option at a time by providing a map of key value pairs. This is considered an advanced
   * method to set options on the widget. The caller needs to know what properties are valid in the options object.
   *
   * @param {Object} options Key value pair of configuration options.
   * @returns {Prime.Widgets.SideMenu} This.
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
   * Handles the click event on the side menu button and calls either the open or close function.
   *
   * @private
   */
  _handleClickEvent: function(event) {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
    Prime.Utils.stopEvent(event);
  },

  /**
   * Handles the synthetic swipe left event that Prime.js provides.
   *
   * @private
   */
  _handleSwipeLeft: function() {
    if (this.isOpen()) {
      this.close();
    }

    if (Prime.Utils.isDefined(this.touchable)) {
      this.touchable.destroy();
      this.touchable = null;
    }
  },

  /**
   * Handles the click event on a mobile link.
   *
   * @private
   */
  _handleTOCClickEvent: function() {
    this.close();
  },

  /**
   * Set the initial options for this widget.
   * @private
   */
  _setInitialOptions: function() {
    // Defaults
    this.options = {};
  }
};/*
 * Copyright (c) 2014-2015, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};

/**
 * Constructs a new SplitButton object for the given ul element.
 *
 * The markup must be a ul element with one or more items containing an a tag with an href.
 * You may optionally add a 'default' class on one of the items to indicate this is the default action.
 * If this is not provided the first item will be considered the default action.
 *
 * Example 1, two actions the second action is set as default and shows on top w/out expansion.
 * <pre>
 *   &lt;ul&gt;
 *     &lt;li&gt;&lt;a href="/admin/foo/delete/"&gt;Delete&lt;/a&gt;&lt;/li&gt;
 *     &lt;li class="default"&gt;&lt;a href="/admin/foo/edit/"&gt;Edit&lt;/a&gt;&lt;/li&gt;
 *   &lt;/ul&gt;
 * </pre>
 *
 * Example 2, two actions w/out a default. The top level action causes the button to expand.
 * <pre>
 *   &lt;ul&gt;
 *     &lt;li&gt;&lt;a href="#"&gt;Select&hellip;&lt;/a&gt;&lt;/li&gt;
 *     &lt;li&gt;&lt;a href="/admin/foo/delete/"&gt;Delete&lt;/a&gt;&lt;/li&gt;
 *     &lt;li&gt;&lt;a href="/admin/foo/edit/"&gt;Edit&lt;/a&gt;&lt;/li&gt;
 *   &lt;/ul&gt;
 * </pre>
 *
 * @param element {Prime.Document.Element|Element|EventTarget} The ul element to transform into a split button.
 * @constructor
 */
Prime.Widgets.SplitButton = function(element) {
  this.element = Prime.Document.Element.wrap(element);
  var nodeName = this.element.domElement.nodeName.toLowerCase();
  if (nodeName !== 'ul') {
    throw new TypeError('SplitButton requires a ul element. The passed element type is <' + nodeName + '>');
  }

  if (this.element.hasClass('prime-initialized')) {
    throw new Error('This element has already been initialized. Call destroy before initializing again.');
  }

  Prime.Utils.bindAll(this);

  this.element.hide().addClass('prime-split-button');
  this.container = Prime.Document.queryUp('div,td', this.element);

  // If a default action was not found, use the first one
  this.defaultAction = this.element.queryFirst('ul > li.default a');
  if (this.defaultAction === null) {
    this.defaultAction = this.element.queryFirst('ul > li a');
  }

  // Build the split button markup and add listeners
  this._buildSplitButton();
  this.splitButton.addEventListener('mouseover', this._handleMouseOver);
  this.splitButton.addEventListener('mouseout', this._handleMouseOut);
  this.element.addEventListener('mouseout', this._handleMouseOut);
  this.dropDown.addEventListener('click', this._handleDropDownClick);
  this.dropDownDiv.addEventListener('click', this._handleDropDownClick);
  this.defaultButton.addEventListener('click', this._handleDefaultButton);

  // Register a single global listener to handle closing buttons
  var body = new Prime.Document.Element(document.body);
  if (!body.getAttribute('data-prime-split-button-handler')) {
    body.addEventListener('click', this._hideAllButtons);
    body.setAttribute('data-prime-split-button-handler', 'true');
  }
  this.element.addClass('prime-initialized');
};

Prime.Widgets.SplitButton.constructor = Prime.Widgets.SplitButton;

Prime.Widgets.SplitButton.prototype = {

  /**
   * Destroy the the SplitButton widget
   */
  destroy: function() {
    this.splitButton.removeAllEventListeners();
    this.dropDown.removeAllEventListeners();
    this.splitButton.removeFromDOM();

    this.element.removeEventListener('mouseout', this._handleMouseOut);
    this.element.removeAttribute('data-prime-active');
    this.element.setStyle('margin-top', '');
    this.element.removeClass('prime-initialized prime-split-button').show();
    this.defaultAction.show();
  },

  /* ===================================================================================================================
   * Private methods
   * ===================================================================================================================*/

  /**
   * Handle the default button click
   * @param {MouseEvent} event the click event.
   * @private
   */
  _handleDefaultButton: function(event) {
    this.defaultAction.fireEvent('click', null, null, false, true);
    Prime.Utils.stopEvent(event);
  },

  /**
   * Handle the split button click to expand the action list.
   * @param {MouseEvent} event the click event.
   * @private
   */
  _handleDropDownClick: function(event) {
    this._clearActiveMarker();
    this._setActiveMarker();
    this._hideAllButtons();

    if (this.element.isVisible()) {
      this.element.hide();
      this.splitButton.addClass('prime-inactive')
    } else {
      this.element.setStyle('margin-top', this.dropDownDiv.getHeight() + 2 + 'px');
      this.element.show();
      var width = 1;
      this.splitButton.getChildren('div').each(function(element) {
        width += element.getWidth();
      });
      this.element.setWidth(width);
      this.splitButton.removeClass('prime-inactive')
    }

    Prime.Utils.stopEvent(event);
  },

  /**
   * Handles the mouse over event.
   *
   * @private
   */
  _handleMouseOver: function() {
    this.splitButton.removeClass('prime-inactive')
  },

  /**
   * Handles the mouse out event.
   *
   * @private
   */
  _handleMouseOut: function() {
    if (!this.element.isVisible()) {
      this.splitButton.addClass('prime-inactive')
    }
  },

  /**
   * Build the necessary markup to transform the ul to a split button action.
   * @private
   */
  _buildSplitButton: function() {

    var div = Prime.Document.newElement('<div>');
    div.addClass('prime-split-button prime-inactive');
    div.prependTo(this.container);

    // set a reference to this object
    this.splitButton = Prime.Document.queryFirst('div.prime-split-button', this.container);

    var buttonDiv = Prime.Document.newElement('<div>');
    var button = Prime.Document.newElement('<a>');

    button.addClass('prime-split-button-default');
    button.setAttribute('href', this.defaultAction.getAttribute('href'));
    button.setHTML(this.defaultAction.getHTML());
    // Setting href to '#' will expand the button and remove it from the expanded list
    if (button.getAttribute('href') === '#') {
      button.addEventListener('click', this._handleDropDownClick);
      this.defaultAction.getParent().hide();
    }

    var dropDownDiv = Prime.Document.newElement('<div>');
    var dropDown = Prime.Document.newElement('<a>');
    dropDown.addClass('prime-drop-down');

    dropDownDiv.prependTo(this.splitButton);
    // re-assign reference to the DOM element
    dropDownDiv = Prime.Document.queryLast('div', this.splitButton);
    dropDown.prependTo(dropDownDiv.domElement);

    buttonDiv.prependTo(this.splitButton);
    // re-assign reference to the DOM element
    buttonDiv = Prime.Document.queryFirst('div', this.splitButton);
    button.prependTo(buttonDiv.domElement);

    this.defaultButton = Prime.Document.queryFirst('div', this.splitButton);
    this.dropDown = Prime.Document.queryFirst('a.prime-drop-down', this.splitButton);
    this.dropDownDiv = Prime.Document.queryUp('div', this.dropDown);
    this.element.setStyle('margin-top', this.dropDown.getHeight() + '');
  },

  /**
   * Clear the active marker.
   * @private
   */
  _clearActiveMarker: function() {
    Prime.Document.query('ul.prime-split-button.prime-initialized[data-prime-active]').each(function(element) {
      element.removeAttribute('data-prime-active');
    });
  },

  /**
   * Hide all visible split buttons on the page. And ensure all are set to inactive.
   * @param {Event} [event] The JavaScript event - this parameter is optional.
   * @private
   */
  _hideAllButtons: function(event) {
    Prime.Document.query('ul.prime-split-button.prime-initialized').each(function(element) {
      if (!Prime.Utils.isDefined(event)) {
        if (!element.domElement.hasAttribute('data-prime-active') && element.isVisible()) {
          element.hide();
        }
      } else {
        if (element.isVisible()) {
          element.hide();
        }
      }

    });

    Prime.Document.query('div.prime-split-button:not(.prime-inactive)').each(function(element) {
      element.addClass('prime-inactive');
    });
  },

  /**
   * Set the active split button.
   * @private
   */
  _setActiveMarker: function() {
    this.element.setAttribute('data-prime-active', 'true');
  }
};/*
 * Copyright (c) 2015-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};

/**
 * Constructs a new Tabs object for the given ul element.
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The ul element to build the tab widget from
 * @constructor
 */
Prime.Widgets.Tabs = function(element) {
  this.element = Prime.Document.Element.wrap(element);

  if (this.element.getTagName().toLowerCase() === 'ul') {
    this.tabsContainer = this.element;
  } else {
    this.tabsContainer = this.element.queryFirst('ul');
  }

  if (this.tabsContainer === null) {
    throw new TypeError('Tabs requires a ul element. The passed element does not contain a ul element');
  }

  if (this.tabsContainer.hasClass('prime-initialized')) {
    throw new Error('This element has already been initialized. Call destroy before initializing again.');
  }

  Prime.Utils.bindAll(this);

  this._setInitialOptions();
  this.tabsContainer.hide().addClass('prime-tabs');
  this.tabContents = {};
  this.tabs = {};
  this.tabArray = [];
  this.selectedTab = null;
  this.selectHandler = null;

  this.tabsContainer.query('li:not(.prime-disabled)').each(function(tab) {
    var a = tab.queryFirst('a').addEventListener('click', this._handleClick);
    var dataSet = tab.getDataSet();

    var href = a.getAttribute('href');
    var isAnchor = href.charAt(0) === '#';
    if (isAnchor) {
      dataSet.tabId = href.substring(1);
      dataSet.tabURL = '';
    } else {
      dataSet.tabId = href;
      dataSet.tabURL = href;
    }

    this.tabs[dataSet.tabId] = tab;
    this.tabArray.push(tab);

    var content = Prime.Document.queryById(dataSet.tabId);
    if (content === null && isAnchor) {
      throw new Error('A div is required with the following ID [' + dataSet.tabId + ']');
    } else if (content === null) {
      content = Prime.Document.newElement('<div>').insertAfter(this.element).setAttribute('id', href);
    }

    content.hide();

    content.addClass('prime-tab-content');
    this.tabContents[dataSet.tabId] = content;
  }.bind(this));

  this.tabsContainer.addClass('prime-initialized');
};

Prime.Widgets.Tabs.prototype = {
  /**
   * Destroys the Tabs widget
   */
  destroy: function() {
    this.tabsContainer.getChildren().each(function(tab) {
      var a = Prime.Document.queryFirst('a', tab);
      a.removeEventListener('click', this._handleClick);
    }.bind(this));

    for (var i = 0; i < this.tabs.length; i++) {
      this.tabs[i].removeClass('prime-tab-content');
    }

    this.tabsContainer.removeClass('prime-tabs prime-initialized');
  },

  /**
   * Hides the tab for the given Id.
   *
   * @param id The Id of the tab to hide.
   */
  hideTab: function(id) {
    var tab = this.tabs[id];
    tab.hide();
    this.redraw();
  },

  /**
   * Re-applies the first-child, last-child, and prime-active classes based on the current state of the tabs. If there
   * is no tab that is active, this also selects the first tab that is visible.
   */
  redraw: function() {
    var firstVisible = null;
    var lastVisible = null;
    var selectNew = false;
    var noneActive = true;
    for (var i = 0; i < this.tabArray.length; i++) {
      if (this.tabArray[i].isVisible()) {
        if (firstVisible === null) {
          firstVisible = this.tabArray[i];
        }

        lastVisible = this.tabArray[i];

        if (this.tabArray[i].hasClass('prime-active')) {
          noneActive = false;
        }
      } else if (this.tabArray[i].hasClass('prime-active')) {
        selectNew = true;
      }

      this.tabArray[i].removeClass('first-child last-child');
    }

    firstVisible.addClass('first-child');
    lastVisible.addClass('last-child');

    var tabId = null;
    if (selectNew || noneActive) {
      if (this.localStorageSupported && this.options['localStorageKey'] !== null) {
        var item = sessionStorage.getItem(this.options['localStorageKey']);
        if (item !== null) {
          tabId = JSON.parse(item).tabId;
        }
      }

      // If no tabId was found or the tab is not currently visible, select the first visible
      if (tabId === null || !this.tabs[tabId] || !this.tabs[tabId].isVisible()) {
        tabId = firstVisible.getDataSet().tabId;
      }
      this.selectTab(tabId);
    }

    // If error class handling was enabled, add the error class to the tab and set focus
    if (this.options.errorClass) {
      for (tabId in this.tabContents) {
        if (this.tabContents.hasOwnProperty(tabId)) {
          var errorElement = this.tabContents[tabId].queryFirst('.' + this.options.errorClass);
          if (errorElement !== null) {
            this.tabs[tabId].queryFirst('a').addClass(this.options.errorClass);
            this.selectTab(tabId);
          }
        }
      }
    }
  },

  /**
   * Render the Tabs widget. Call this after you have set all the initial options.
   *
   * @returns {Prime.Widgets.Tabs} This Tabs.
   */
  render: function() {
    // Check if local storage is enabled to save selected tab
    this.localStorageSupported = Prime.Utils.isDefined(Storage) && this.options['localStorageKey'] !== null;

    this.tabsContainer.show();
    this.redraw();
    return this;
  },

  /**
   * Select the active tab. Sets the prime-active class on the li and shows only the corresponding tab content.
   *
   * @param id The Id of the tab to select.
   */
  selectTab: function(id) {
    if (this.selectedTab !== null && this.selectedTab.getDataSet().tabId === id) {
      return;
    }

    for (var tabId in this.tabs) {
      if (this.tabs.hasOwnProperty(tabId)) {
        this.tabs[tabId].removeClass('prime-active');
      }
    }

    this.tabs[id].addClass('prime-active');
    this.selectedTab = this.tabs[id];
    for (tabId in this.tabContents) {
      if (this.tabContents.hasOwnProperty(tabId) && tabId === id) {
        this.tabContents[tabId].show();
        if (this.selectHandler) {
          this.selectHandler(this.tabs[tabId], this.tabContents[tabId]);
        }
      } else {
        this.tabContents[tabId].hide();
      }
    }

    // Save current selected tab state in local storage. The JSON object isn't necessary at the moment,
    // but we can tack on other properties as needed for additional state in the future.
    if (this.localStorageSupported) {
      var data = {
        'tabId': id
      };
      sessionStorage.setItem(this.options['localStorageKey'], JSON.stringify(data));
    }

    var ajaxURL = this.selectedTab.getDataSet().tabURL;
    if (ajaxURL !== '') {
      this.selectedTab.addClass('prime-loading');
      this.tabContents[id].setHTML('');
      this.tabContents[id].addClass('prime-loading');
      new Prime.Ajax.Request(ajaxURL, 'GET')
          .withSuccessHandler(this._handleAJAXResponse)
          .withErrorHandler(this._handleAJAXResponse)
          .go();
    }
  },

  /**
   * Shows the tab for the given Id.
   *
   * @param {String} id The Id of the tab to hide.
   */
  showTab: function(id) {
    this.tabs[id].show();
    this.redraw();
  },

  /**
   * Adds a callback for AJAX calls. This is invoked after the AJAX load completes and the HTML is inserted into the
   * DOM. The function is passed the container for the tab that was selected.
   *
   * @returns {Prime.Widgets.Tabs} This Tabs.
   */
  withAJAXCallback: function(callback) {
    this.options['ajaxCallback'] = callback;
    return this;
  },

  /**
   * Enable error class handling. When this option is used, if the specified error class is found on any element
   * in the tab content the same error class will be added to the tab to identify the tab contains errors.
   *
   * @returns {Prime.Widgets.Tabs} This Tabs.
   */
  withErrorClassHandling: function(errorClass) {
    this.options['errorClass'] = errorClass;
    return this;
  },

  /**
   * Enables local storage of the currently selected tab. If the user navigates away from the page and back, the same
   * tab will be selected. This key is how the selected tab is stored in local storage and by setting a key you also
   * enable this feature.
   *
   * @param {String} key The local storage key.
   * @returns {Prime.Widgets.Tabs} This Tabs.
   */
  withLocalStorageKey: function(key) {
    this.options['localStorageKey'] = key;
    return this;
  },

  /**
   * Specifies a handler function that is called whenever tabs are changed.
   *
   * @param {Function} func The handler function.
   * @returns {Prime.Widgets.Tabs} This Tabs.
   */
  withSelectHandler: function(func) {
    this.selectHandler = func;
    return this;
  },

  /**
   * Set more than one option at a time by providing a map of key value pairs. This is considered an advanced
   * method to set options on the widget. The caller needs to know what properties are valid in the options object.
   *
   * @param {Object} options Key value pair of configuration options.
   * @returns {Prime.Widgets.Tabs} This Tabs.
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
   * Handles the AJAX response.
   *
   * @param {XMLHttpRequest} xhr The AJAX response.
   * @private
   */
  _handleAJAXResponse: function(xhr) {
    this.selectedTab.removeClass('prime-loading');
    var container = this.tabContents[this.selectedTab.getDataSet().tabId];
    container.removeClass('prime-loading');
    container.setHTML(xhr.responseText);

    if (this.options['ajaxCallback'] !== null) {
      this.options['ajaxCallback'](container);
    }
  },

  /**
   * Handle the tab click by showing the corresponding panel and hiding the others.
   *
   * @param {MouseEvent} event The click event on the anchor tag.
   * @private
   */
  _handleClick: function(event) {
    var a = new Prime.Document.Element(event.currentTarget);
    if (!a.hasClass('prime-disabled')) {
      var href = a.getAttribute('href');
      if (href.charAt(0) === '#') {
        this.selectTab(href.substring(1));
      } else {
        this.selectTab(href);
      }
    }

    Prime.Utils.stopEvent(event);
  },

  /**
   * Set the initial options for this widget.
   * @private
   */
  _setInitialOptions: function() {
    // Defaults
    this.options = {
      'ajaxCallback': null,
      'errorClass': null,
      'localStorageKey': null
    };

    var userOptions = Prime.Utils.dataSetToOptions(this.element);
    for (var option in userOptions) {
      if (userOptions.hasOwnProperty(option)) {
        this.options[option] = userOptions[option];
      }
    }
  }
};/*
 * Copyright (c) 2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

/**
 * The Prime.Widgets namespace.
 *
 * @namespace Prime.Widgets
 */
Prime.Widgets = Prime.Widgets || {};

/**
 * Constructs a new Touchable object for the given element.
 *
 * @param {Prime.Document.Element|Element|EventTarget} element The Prime Element for the Touchable widget.
 * @param {Function} [eventPropagationHandler] A Function that handles how the event is handled for the touchstart,
 * touchend, touchmove, and touchcancel events. This Function takes the event object as its only parameter.
 * @constructor
 */
Prime.Widgets.Touchable = function(element, eventPropagationHandler) {
  Prime.Utils.bindAll(this);

  this.eventPropagationHandler = eventPropagationHandler;
  this.element = Prime.Document.Element.wrap(element);
  this.element
      .addEventListener('touchstart', this._handleTouchStart)
      .addEventListener('touchmove', this._handleTouchMove)
      .addEventListener('touchcancel', this._handleTouchCancel)
      .addEventListener('touchend', this._handleTouchEnd);
};

Prime.Widgets.Touchable.constructor = Prime.Widgets.Touchable;
Prime.Widgets.Touchable.prototype = {
  /**
   * Destroys the Touchable Widget
   */
  destroy: function() {
    this.element
        .removeEventListener('touchstart', this._handleTouchStart)
        .removeEventListener('touchmove', this._handleTouchMove)
        .removeEventListener('touchcancel', this._handleTouchCancel)
        .removeEventListener('touchend', this._handleTouchEnd)
        .removeEventListenersByPattern(/Prime\.Widgets\.Touchable:.+/)
  },

  /**
   * Provide a handler that will be called when a long press is detected.
   *
   * @param {Function} handler The event handler.
   * @returns {Prime.Widgets.Touchable} This
   */
  withLongPressHandler: function(handler) {
    this.element.addEventListener('Prime.Widgets.Touchable:longPress', handler);
    return this;
  },

  /**
   * Provide a handler that will be called when a move event is detected.
   *
   * @param {Function} handler The event handler.
   * @returns {Prime.Widgets.Touchable} This
   */
  withMoveHandler: function(handler) {
    this.element.addEventListener('Prime.Widgets.Touchable:move', handler);
    return this;
  },

  /**
   * Provide a handler that will be called when a long press is detected.
   *
   * @param {Function} handler The event handler.
   * @returns {Prime.Widgets.Touchable} This
   */
  withSwipeDownHandler: function(handler) {
    this.element.addEventListener('Prime.Widgets.Touchable:swipeDown', handler);
    return this;
  },

  /**
   * Provide a handler that will be called when a swipe left event is detected.
   *
   * @param {Function} handler The event handler.
   * @returns {Prime.Widgets.Touchable} This
   */
  withSwipeLeftHandler: function(handler) {
    this.element.addEventListener('Prime.Widgets.Touchable:swipeLeft', handler);
    return this;
  },

  /**
   * Provide a handler that will be called when a swipe right event is detected.
   *
   * @param {Function} handler The event handler.
   * @returns {Prime.Widgets.Touchable} This
   */
  withSwipeRightHandler: function(handler) {
    this.element.addEventListener('Prime.Widgets.Touchable:swipeRight', handler);
    return this;
  },

  /**
   * Provide a handler that will be called when a swipe up event is detected.
   *
   * @param {Function} handler The event handler.
   * @returns {Prime.Widgets.Touchable} This
   */
  withSwipeUpHandler: function(handler) {
    this.element.addEventListener('Prime.Widgets.Touchable:swipeUp', handler);
    return this;
  },

  /* ===================================================================================================================
   * Private methods
   * ===================================================================================================================*/

  /**
   * Collects all of the touch data at the end of the touch and calculates the distances and times.
   *
   * @param {TouchEvent} event The TouchEvent.
   * @private
   */
  _collectTouchData: function(event) {
    var touchPoints = event.changedTouches.length;
    if (touchPoints > 1) {
      return;
    }

    var touch = event.changedTouches[0];
    this.elapsedTime = new Date().getTime() - this.touchStarted;
    this.touchEndX = touch.pageX;
    this.touchEndY = touch.pageY;
    this.touchX = this.touchStartX - this.touchEndX;
    this.touchY = this.touchStartY - this.touchEndY;
  },

  /**
   * Called when all processing is finished and the handlers are called based on direction and time of the touches.
   *
   * @private
   */
  _finished: function() {
    // Make sure this was a swipe
    var event = {
      'elapsedTime': this.elapsedTime,
      'touchStartX': this.touchStartX,
      'touchStartY': this.touchStartY,
      'touchEndX': this.touchEndX,
      'touchEndY': this.touchEndY,
      'touchX': this.touchX,
      'touchY': this.touchY,
      'element': this.element,
      'target': this.element.domElement
    };
    event.swipe = Math.abs(event.touchX) > 50 || Math.abs(event.touchY) > 50;
    event.swipeX = event.swipe && Math.abs(event.touchX) > Math.abs(event.touchY);
    event.swipeY = event.swipe && !event.swipeX;
    event.longPress = !event.swipe && event.elapsedTime > 500;

    if (event.longPress) {
      this.element.fireCustomEvent('Prime.Widgets.Touchable:longPress', event);
    } else if (event.swipeX && event.touchX > 0) {
      this.element.fireCustomEvent('Prime.Widgets.Touchable:swipeLeft', event);
    } else if (event.swipeX) {
      this.element.fireCustomEvent('Prime.Widgets.Touchable:swipeRight', event);
    } else if (event.swipeY && event.touchY > 0) {
      this.element.fireCustomEvent('Prime.Widgets.Touchable:swipeUp', event);
    } else if (event.swipeY) {
      this.element.fireCustomEvent('Prime.Widgets.Touchable:swipeDown', event);
    }
  },

  /**
   * Handle the touch cancel event.
   *
   * @param {TouchEvent} event The touch event.
   * @private
   */
  _handleTouchCancel: function(event) {
    this._collectTouchData(event);
    this._finished();
    if (Prime.Utils.isDefined(this.eventPropagationHandler)) {
      this.eventPropagationHandler(event);
    }
  },

  /**
   * Handle the touch end event.
   *
   * @param {TouchEvent} event The touch event.
   * @private
   */
  _handleTouchEnd: function(event) {
    this._collectTouchData(event);
    this._finished();
    if (Prime.Utils.isDefined(this.eventPropagationHandler)) {
      this.eventPropagationHandler(event);
    }
  },

  /**
   * Handle the touch move event.
   *
   * @param {TouchEvent} event The touch event.
   * @private
   */
  _handleTouchMove: function(event) {
    this.element.fireEvent('Prime.Widgets.Touchable:move', event);
    if (Prime.Utils.isDefined(this.eventPropagationHandler)) {
      this.eventPropagationHandler(event);
    }
  },

  /**
   * Handle the touch start event.
   *
   * @param {TouchEvent} event The touch event.
   * @private
   */
  _handleTouchStart: function(event) {
    var touchPoints = event.changedTouches.length;
    if (touchPoints > 1) {
      if (Prime.Utils.isDefined(this.eventPropagationHandler)) {
        this.eventPropagationHandler(event);
      }

      return;
    }

    var touch = event.changedTouches[0];
    this.touchStarted = new Date().getTime();
    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;
    if (Prime.Utils.isDefined(this.eventPropagationHandler)) {
      this.eventPropagationHandler(event);
    }
  }
};/*
 * Copyright (c) 2012-2016, Inversoft Inc., All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
'use strict';

var Prime = Prime || {};

Prime.Window = {
  /**
   * Attaches an event listener to the window, returning the handler proxy.
   *
   * @param {string} event The name of the event.
   * @param {Function} listener The event handler.
   * @returns {Window} The window object.
   */
  addEventListener: function(event, listener) {
    if (event.indexOf(':') === -1) {
      window.eventListeners = window.eventListeners || {};
      window.eventListeners[event] = window.eventListeners[event] || [];
      window.eventListeners[event].push(listener);
      if (window.addEventListener) {
        window.addEventListener(event, listener, false);
      } else if (window.attachEvent) {
        window.attachEvent('on' + event, listener);
      } else {
        throw new TypeError('Unable to set event onto the window. Neither addEventListener nor attachEvent methods are available');
      }
    } else {
      // Custom event
      window.customEventListeners = window.customEventListeners || {};
      window.customEventListeners[event] = window.customEventListeners[event] || [];
      window.customEventListeners[event].push(listener);
    }

    return window;
  },

  /**
   * Returns the inner height of the window. This includes only the rendering area and not the window chrome (toolbars,
   * status bars, etc). If this method can't figure out the inner height, it throws an exception.
   *
   * @returns {number} The inner height of the window.
   */
  getInnerHeight: function() {
    if (typeof(window.innerHeight) === 'number') {
      // Most browsers
      return window.innerHeight;
    } else if (document.documentElement && document.documentElement.clientHeight) {
      // IE 6+ in 'standards compliant mode'
      return document.documentElement.clientHeight;
    } else if (document.body && document.body.clientHeight) {
      // IE 4 compatible
      return document.body.clientHeight;
    }

    throw new Error('Unable to determine inner height of the window');
  },

  /**
   * Returns the inner width of the window. This includes only the rendering area and not the window chrome (toolbars,
   * status bars, etc). If this method can't figure out the inner width, it throws an exception.
   *
   * @returns {number} The inner width of the window.
   */
  getInnerWidth: function() {
    if (typeof(window.innerWidth) === 'number') {
      // Most browsers
      return window.innerWidth;
    } else if (document.documentElement && document.documentElement.clientWidth) {
      // IE 6+ in 'standards compliant mode'
      return document.documentElement.clientWidth;
    } else if (document.body && document.body.clientWidth) {
      // IE 4 compatible
      return document.body.clientWidth;
    }

    throw new Error('Unable to determine inner width of the window');
  },

  /**
   * Returns the number of pixels the Window is scrolled by.
   *
   * @returns {number} The number of pixels.
   */
  getScrollTop: function() {
    if (typeof(window.pageYOffset) === 'number') {
      return window.pageYOffset;
    } else if (document.body && document.body.scrollTop) {
      return document.body.scrollTop;
    } else if (document.documentElement && document.documentElement.scrollTop) {
      return document.documentElement.scrollTop;
    }

    throw new Error('Unable to determine scrollTop of the window');
  }
};
