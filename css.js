/*
 * Author:     Nikonov Fedor Andreevich
 * Created At: 11.03.2022 9:54:02
 */

// CSS API: access css variables from js, convert em/rem to px

; (function () {
   // Polyfill
   Object._fromEntries = function (array) {
      var res = {};
      for (let i = 0; i < array.length; i++) {
         var entry = array[i];

         var prop = entry[0];
         var value = entry[1];

         if (value.constructor === Array)
            res[prop] = Object._fromEntries(value);
         else
            res[prop] = value;
      }
      return res;
   };

   // Options
   const PARENT_FONT_SIZE = 14;
   const ROOT_FONT_SIZE = 14;

   // API
   const CSS = {
      vars: {
         get(name) {
            return this._parent.props.get(document.documentElement, name);
         },
         set(name, value) {
            return this._parent.props.set(document.documentElement, name, value);
         },
         // Put "value" to object with all helpers methods, which first arg is binded to "value"
         _wrap(value) {
            return Object.assign({
               value: value,
            }, this._parent.helpers._bind(value));
         },
      },
      props: {
         get(el, name) {
            const res = getComputedStyle(el).getPropertyValue(name);
            return this._wrap(res);
         },
         set(el, name, value) {
            return this._wrap(el.style.setProperty(name, value));
         },
         // Put "value" to object with all helpers methods, which first arg is binded to "value"
         _wrap(value) {
            return Object.assign({
               value: value,
            }, this._parent.helpers._bind(value));
         },
      },
      helpers: {
         toPx(emValue, parentFontSize = PARENT_FONT_SIZE, rootFontSize = ROOT_FONT_SIZE, precision = 2) {
            emValue = emValue.trim().replace(/^calc/, '');

            let match;
            // Replace vars
            if (match = emValue.match(/var\((--.+?)\)/g)) {
               for (let value of match) {
                  let name = value.replace('var', '').replace(/^\(/, '').replace(/\)$/, ''); // var(--name) => --name
                  let targetVal = this._parent.vars.get(name).toPx();
                  emValue = emValue.replace(value, targetVal);
               }
            }
            // Replace px
            if (match = emValue.match(/(\d+(\.\d+)?)px/g)) {
               for (let value of match) {
                  let targetVal = parseFloat(value);
                  emValue = emValue.replace(value, targetVal);
               }
            }
            // Replace em
            if (match = emValue.match(/(\d+(\.\d+)?)em/g)) {
               for (let value of match) {
                  let targetVal = parseFloat(value) * rootFontSize;
                  emValue = emValue.replace(value, targetVal);
               }
            }
            // Replace rem
            if (match = emValue.match(/(\d+(\.\d+)?)rem/g)) {
               for (let value of match) {
                  let targetVal = parseFloat(value) * rootFontSize;
                  emValue = emValue.replace(value, targetVal);
               }
            }

            // Round value
            let res = eval(emValue);
            const decimal = 10 * precision;
            return Math.round(res * decimal) / decimal;
         },

         // Binds "value" to all functions in object
         _bind(value) {
            return Object._fromEntries(
               Object.keys(this)
                  .filter(key => this[key] instanceof Function) // Just functions
                  .map(key => [key, this[key].bind(this, value)]) // Bind values to them
            ); // Object from functions with bind
         }
      },
      init() {
         // Add ancestor relation to objects in root
         for (let prop in this) {
            if (prop !== 'init') {
               this[prop]._parent = this;
            }
         }
      }
   };

   CSS.init();

   // Exports
   window.CSS = CSS;
})();