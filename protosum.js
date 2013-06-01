/***************
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 ****************/

(function(window) {


//    /**
//     * Bind a function to a context, making call and apply and other properties work as if no binding was applied.
//     * It is intended to be used with class methods. It is intended to automate calls to delegate, but might
//     * not be applied at all, because then delegating is used even when no delegating is needed. Less performance.
//     *
//     * A alternative could be to make a tool to automatically set
//     *     instance.delegated.method = __pc_bind_method__(instance.method, instance)
//     *
//     * @param func Function
//     * @param context *
//     * @return Function
//     * @private
//     */
//    var __pc_bind_method__ = function(func, context) {
//        var f = delegate(func, context);
//        f.__pc_context__ = context;
//        f.__pc_orig__ = func;
//        f.call = function() {
//            var context = arguments[0];
//            Array.prototype.shift.call(arguments);
//            return f.__pc_orig__.apply(context, arguments);
//        }
//        f.apply = function(context, arguments) {
//            return f.__pc_orig__.apply(context, arguments);
//        }
//        f.toString = func.toString;
//        f.length = func.length;
//        return f;
//    }


    /**
     * Simple logger
     */
    var log = function () {
        var stderr = document.getElementById('stderr');
        if (stderr) {
            var m = "";
            var sep = "";
            for (var i = 0; i < arguments.length; i++) {
                var v = arguments[i];
                if (typeof v == 'string') {
                    m += sep + '"' + v + '"';
                } else {
                    m += sep + v;
                }
                sep = ', ';
            }
            stderr.innerHTML += m + "<br/>";
        } else {
            try {
                console.log.apply(console, arguments);
            } catch (e) {
                var m = "";
                for (var i = 0; i < arguments.length; i++) {
                    m += arguments[i] + ", ";
                }
                alert(m);
            }
        }
    };

//    /**
//     * delegate a function to an object.
//     * @param method {Function}
//     * @param instance {Object}
//     * @param [args] {Array} If provided, the function will receive this array as arguments instead of the provided by the caller.
//     * @return {Function}
//     */
//    var delegate = function (method, instance, args) {
//        if (args) {
//            return function () {
//                return method.apply(instance, args);
//            }
//        } else {
//            return function () {
//                return method.apply(instance, arguments);
//            }
//        }
//    }

    var getClassName = function (classReference) {
        // search through the global object for a name that resolves to this object
        for (var name in this)
            if (this[name] == classReference)
                return name;
    }


    var __protosum_used_names__ = ",";

    var __protosum_toString__ = function() {
        return '[ProtoSum: ' + this.__class__.__name__ + ']';
    }

    /**
     *
     * @param [requestedSuper]  Class  if not provided returns de default super.
     * @return {*}
     * @private
     */
    var __protosum_getSuper__ = function (requestedSuper) {
        var len = this.__class__.supers.length;
        if (requestedSuper) {
            for (var i = 0; i < len; i++) {
                var _super = this.__class__.supers[i];
                if (_super === requestedSuper) {
                    return _super.prototype;
                }
            }
            throw new Error("getSuper: " + getClassName(requestedSuper) + " is not a superclass of " + getClassName(this.__class__))
        } else {
            if (len) {
                return this.__class__.supers[0];
            }
        }
    };

    var single = function (sub, _super) {
        multi(sub, _super);
    }

    var multi = function (sub, _super) {
        var proto = _super.prototype;
        for (var f in proto) {
            if (sub.prototype[f] === undefined) {
                sub.prototype[f] = proto[f];
            }
        }
    }

    /**
     * @return {Function}
     */
    var ProtoSum = function () {


        var className = "ProtoSum";

        var args = arguments ? arguments : [];

        if (typeof args[0] == "string") {
            var className = args[0];
            if (__protosum_used_names__.indexOf("," + className + ",") != -1) {
                log("PROTOSUM WARNING: class name \"" + className + "\" already in use.");
            }
            __protosum_used_names__ += className + ",";
            if (window[className]) {
                log("PROTOSUM WARNING: \"" + className + "\" is overwriting an existing window attribute.");
            }
            var na = [];
            for (var i = 1; i < args.length; i++) {
                na.push(args[i]);
            }
            args = na;
        } else {
            throw new Error('First ProtoSum argument must be the class name.');
        }

        // We want the JavascriptDebugger to show our instances named after className
        var protosum;
        eval("var " + className + " = function(){this.__init__ && this.__init__.apply(this,arguments);};");
        eval("protosum = " + className);

        protosum.__name__ = className;
        protosum.supers = [];
        protosum.prototype.__class__ = protosum;
        protosum.prototype.destroy = function () {
            // empty destructor
        }
        protosum.prototype.getSuper = __protosum_getSuper__;

        protosum.prototype.toString = __protosum_toString__;

//        protosum.prototype.delegate = function (method, args) {
//            return delegate(method, this, args);
//        }

        protosum.prototype.isInstance = function (requestedSuper) {
            if (this instanceof requestedSuper) {
                return true;
            }
            var len = this.__class__.supers.length;
            for (var i = 0; i < len; i++) {
                var _super = this.__class__.supers[i];
                if (_super == requestedSuper) {
                    return true;
                }
                if (_super.prototype.isInstance && _super.prototype.isInstance(requestedSuper)) {
                    return true;
                }
            }
            return false;
        }

        if (!args.length) {
            return protosum;
        }

        single(protosum, args[0]);
        protosum.supers.push(args[0]);
        if (args[0].supers.length) {
            protosum.supers = protosum.supers.concat(args[0].supers);
        }
        for (var i = 1; i < args.length; i++) {
            multi(protosum, args[i]);
            protosum.supers.push(args[i]);
            if (args[i].supers.length) {
                protosum.supers = protosum.supers.concat(args[i].supers);
            }
        }

        return protosum;

    };

    ProtoSum.settings = {
        /**
         * JS include base path. Makes code portable.
         */
        JS_PATH: ''
    };

    /**
     * Dynamically include js files
     * @param src {String}
     * @param [async] {Boolean}
     * @param [async_listener] {Function}
     */
    ProtoSum.include = function (src, async, async_listener) {

        if (!async) {
            async = false;
        }
        var async_listener = async_listener;

        function GetHttpRequest() {
            if (window.XMLHttpRequest) // Gecko
                return new XMLHttpRequest();
            else if (window.ActiveXObject) // IE
                return new ActiveXObject("MsXml2.XmlHttp");
        }

        function IncludeJS(sId, fileUrl, source) {
            if (source != null && !document.getElementById(sId)) {
                var oHead = document.getElementsByTagName('HEAD').item(0);
                var oScript = document.createElement("script");
                oScript.language = "javascript";
                oScript.type = "text/javascript";
                oScript.id = sId;
                oScript.defer = true;
                oScript.text = source;
                oHead.appendChild(oScript);
            }
        }

        function AjaxPage(sId, url, async) {
            var sId = sId;
            var async = async;
            var oXmlHttp = GetHttpRequest();
            oXmlHttp.OnReadyStateChange = function () {
                if (oXmlHttp.readyState == 4) {
                    if (oXmlHttp.status == 200 || oXmlHttp.status == 304) {
                        if (async) {
                            IncludeJS(sId, url, oXmlHttp.responseText);
                            if (async_listener) {
                                async_listener(sId);
                            }
                        }
                    } else {
                        log('XML request error: ' + oXmlHttp.statusText + ' (' + oXmlHttp.status + ')');
                    }
                }
            }
            oXmlHttp.open('GET', url, async);
            oXmlHttp.send(null);
            if (!async) {
                IncludeJS(sId, url, oXmlHttp.responseText);
            }
        }

        if (src.indexOf("http") != -1) {
            AjaxPage(src, src, async);
        } else {
            AjaxPage(src, ProtoSum.settings.JS_PATH + src, async);
        }
    }

    /***
     * Lightweight onready implementation. DOMReady is an array with a run method that executes all functions that it contains.
     * Add functions to this array via DOMReady.push([function]) and put <script>DOMReady.run()</script> in the end of your
     * HTML.
     * @type {Array}
     */
    var DOMReady = [];
    DOMReady.run = function() {
        var i,
            len = this.length;
        for (i = 0; i < len; i++) {
            this[i]();
        }
    };

    window.DOMReady = DOMReady;
    window.log = log;
//    window.delegate = delegate;
    window.ProtoSum = ProtoSum;

})(window);
