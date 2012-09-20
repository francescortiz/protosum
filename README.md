
pacaclass
=========

Javascript pythonish multiple inheritance class system.


About
----------------

Framework to work with class inheritance. It is pythonish, so remember:

  - You have multiple inheritance
  - Always use this ot access methods or atributes
  - Everything is public... well, we are on javascript, do your tricks if you need to.


USAGE
-----------

- PacaClass([className], [main superclass], [superclass], [superclass], ...);
  * Returns a subclass of the given classes
  * it popuplates [class].prototype.__class__ with a reference to the created class
  * if first argument is a string, it is used to populate [class].prototype.__class__.name
  * it popuplates [class].supers with an array af all superclassses.
    TODO: prevent repetitions in [class].supers array
- PacaClass.include("path/to/javascript/file.js", [async=false], [async_callback]);
  * Behaves like import
  
Then, for the instances you have:

- [instance].isInstance([class]);
  * like instanceof, but with support for multiple inheritance
- [instance].getSuper([superclass])
  * returns the specified super prototype.


EXAMPLE
----------------

Sample class

    var C = PacaClass(A, B); (function() { var public = C.prototype;

        public.someVar = "somveValue";
        public.c = "99";
        C.public_static_var = 'something';
        
        public.constructor = function(){
            this.getSuper(A).constructor.call(this, 'argument1', 'argument2');
            log("C constructor");
        }

        public.doC = function() {
            log(this.c);
        }

        public.whoAmI = function() {
            log("i am C and my supers say: ");
            this.getSuper(A).whoAmI.call(this); // calls whoAmI in A
            this.getSuper(B).whoAmI.call(this);  // calls whoAmI in B
        }
        
        public.customeEvent = function(event) {
            log("C.customEvent", "event.data = ", event.data, "this.someVar = ",this.someVar);
        }

        C.public_static_method = function() {
            log('This is a static method');
        };

    })();


Tests:

    var c = new C();

    c.isInstance(A); // true
    c.isInstance(B); // true

    c.doC(); // outputs: "[Object object]"
    c.whoAmI(); // outputs: "i am C and my supers say:\nI amb A\nI am B"
    C.static_method(); // outputs: "This is a static method"


Extras
-----------

### PacaClass.include
Loads javascript dynamically.

    // Makes code portable
    PacaClass.settings.JS_PATH = '/path/';

    // Code execution stops here until the script is available
    PacaClass.include("file.js");

    // Don't lock code execution.
    PacaClass.include("file.js", false); 

    // When file.js is loaded, execute file_loaded("file.js");
    PacaClass.include("file.js", false, file_loaded); 
    
### log
Simple logger.

    log('something');


LIMITATIONS
-------------

- Forget about private. But since the implementation is pythonish, and python doesn't
  have the concept of private, it is fine.
- Always provide a constructor, unless you are sure that no superclass has a
  constructor, to prevent unwanted repeated constructor calls.


CONSIDERATIONS
-----------------------------

- super and import are reserved words, so getSuper and include have been chosen instead.
- Declare public methods and attributes outside the constructor. Easiear to read. Allows
  access to them before class initialization.
- the proposed class declaration structure looks for being clear comfortable coming from
  other OOP languages.
