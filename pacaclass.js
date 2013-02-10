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

    /**
     * delegate a function to an objec.
     * @param method {Function}
     * @param instance {Object}
     * @param [args] {Array} If provided, the function will receive this array as arguments instead of the provided by the caller.
     * @return {Function}
     */
    var delegate = function (method, instance, args) {
        return function () {
            if (args) {
                return method.apply(instance, args);
            } else {
                return method.apply(instance, arguments);
            }
        }
    }

    var getClassName = function (classReference) {
        // search through the global object for a name that resolves to this object
        for (var name in this)
            if (this[name] == classReference)
                return name;
    }


    var __pacaclass_used_names__ = ",";

    var __pacaclass_toString__ = function() {
        return '[PacaClass: ' + this.__class__.__name__ + ']';
    }

    var __pacaclass_getSuper__ = function (requestedSuper) {

        var len = this.__class__.supers.length;
        for (var i = 0; i < len; i++) {
            var _super = this.__class__.supers[i];
            if (_super == requestedSuper) {
                return _super.prototype;
            }
        }

        throw new Error("getSuper: " + getClassName(requestedSuper) + " is not a superclass of " + getClassName(this.__class__))

    };

    var copyProto = function (sub, _super) {
        var thinF = function () {
        };
        thinF.prototype = _super.prototype;
        var newProto = new thinF();
        for (var i in sub.prototype) {
            newProto[i] = sub.prototype[i];
        }
        sub.prototype = newProto;
    }

    var single = function (sub, _super) {
        copyProto(sub, _super);
        if (_super.prototype.constructor == Object.prototype.constructor) {
            _super.prototype.constructor = _super;
        }
    }

    var multi = function (sub, _super) {
        var proto = _super.prototype;
        for (var f in proto) {
            if (sub.prototype[f] === undefined) {
                if (proto[f] == "function") {
                    sub.prototype[f] = function () {
                        return proto[f].apply(this, arguments);
                    }
                } else {
                    sub.prototype[f] = proto[f];
                }
            }
        }
    }

    /**
     *
     * @return {Function}
     * @constructor
     */
    var PacaClass = function () {


        var className = "PacaClass";

        var args = arguments ? arguments : [];

        if (typeof args[0] == "string") {
            var className = args[0];
            if (__pacaclass_used_names__.indexOf("," + className + ",") != -1) {
                log("PACACLASS WARNING: class name \"" + className + "\" already in use.");
            }
            __pacaclass_used_names__ += className + ",";
            if (window[className]) {
                log("PACACLASS WARNING: \"" + className + "\" is overwriting an existing window attribute.");
            }
            var na = [];
            for (var i = 1; i < args.length; i++) {
                na.push(args[i]);
            }
            args = na;
        } else {
            throw new Error('First PacaClass argument must be the class name.');
        }

        var pacaclass;
        eval("var " + className + " = function(){this.constructor && this.constructor.apply(this,arguments);};");
        eval("pacaclass = " + className);
        pacaclass.__name__ = className;
        pacaclass.supers = [];
        pacaclass.prototype.__class__ = pacaclass;
        pacaclass.prototype.destroy = function () {
            // empty destructor
        }
        pacaclass.prototype.getSuper = __pacaclass_getSuper__;

        pacaclass.prototype.toString = __pacaclass_toString__;

        pacaclass.prototype.delegate = function (method, args) {
            return delegate(method, this, args);
        }

        pacaclass.prototype.isInstance = function (requestedSuper) {
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
            return pacaclass;
        }

        single(pacaclass, args[0]);
        pacaclass.supers.push(args[0]);
        if (args[0].supers.length) {
            pacaclass.supers = pacaclass.supers.concat(args[0].supers);
        }
        for (var i = 1; i < args.length; i++) {
            multi(pacaclass, args[i]);
            pacaclass.supers.push(args[i]);
            if (args[i].supers.length) {
                pacaclass.supers = pacaclass.supers.concat(args[i].supers);
            }
        }

        return pacaclass;

    };

    PacaClass.settings = {
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
    PacaClass.include = function (src, async, async_listener) {

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
            AjaxPage(src, PacaClass.settings.JS_PATH + src, async);
        }
    }

    window.log = log;
    window.delegate = delegate;
    window.PacaClass = PacaClass;

})(window);
