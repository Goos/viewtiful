## Viewtiful

### Example usage:
    :::javascript  
    var MyView = View.extend({
        properties: {
            normalProperty : "defaultValue",
            propertyWithGSetters : {
                set: function(val) { this._propertyWithGSetters = val; },
                get: function() { return this._propertyWithGSetters; },
                defaultValue: "foontastical"
            }
            /* 
             * The view-objects' properties, such as "fontCase" for 
             * text, or "formAction" for forms, complete with 
             * optional getters and setters, as shown above.
             * NOTE: the underscore on the "private" properties is 
             * not strictly enforced, but mandatory.
            */
        },
        init: function() {
            /* 
            * The mandatory init-method, which usually begins with 
            * this._super(); to call the super-class' init method, 
            * in order to inherit its' initialization process, such 
            * as to set up the DOM-nodes (as seen in the next method). 
            */
        },
        drawDOM: function() {
            /* 
             * The drawDOM()-method defines what DOM-nodes should 
             * be defined, and is usually written as 
             * this.DOM = $("<DOMElement></DOMElement>").
            */
        },
            /* 
             * the rest of the methods, which are all inherited when 
             * extending an object. As an example, the View-class has a 
             * native addSubView()-method, which can be overridden by 
             * simply defining another method with the same name on the 
             * extended class. All methods can reach its' super-method 
             * in the same way as init(), by this._super();
            */
    });
    // Creating an instance of the class
    var myViewInstance = new MyView({normalProperty: "myDefaultValue"});
    var anotherMyViewInstance = new MyView({normalProperty: "someFooValue"});
    /* 
     * Properties are defined as an object parameter, setting the 
     * initial values of your view instance.
    */
    myViewInstance.addSubView(anotherMyViewInstance);
    /*
     * The Instance of myView has the method addSubView as it extended the base-class View, among other things.
    */
