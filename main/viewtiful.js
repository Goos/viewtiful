/*
------------------------------------
   Viewtiful:
   A lean model|view|controller-based
   framework.
------------------------------------
*/

Array.prototype.hasObject = function(obj) {
   for (var i = 0; i <= this.length; i++) {
      if (this[i] === obj) {
         return true;
      }
   };
}

var checkSubviewInstances = function(instance, callback) {
	if (!this instanceof Viewtiful || !typeof callback === "function") {
		return;
	}
	if (this instanceof instance) {
		callback.apply(this);
	}
	if (this.subviews) {
		for(var i = 0; i <= this.subviews.length; i++) {	
			checkSubviewInstances.apply(this.subviews[i], arguments);
		}
	}
}

function testSupport() {
   var supports = {};
   supports.placeholders = false;
   supports.localStorage = (!!window.localStorage);
   input = document.createElement('input');
   if ('placeholder' in input) {
      supports.placeholders = true;
   }
   var el = document.createElement('p'), t, has3d,
      transforms = {
           'WebkitTransform':'-webkit-transform',
           'OTransform':'-o-transform',
           'msTransform':'-ms-transform',
           'MozTransform':'transform',
           'Transform':'transform'
      };
       /* Add it to the body to get the computed style.*/
      document.body.insertBefore(el, document.body.lastChild);
      for(t in transforms){
         if( el.style[t] !== undefined ) {
               el.style[ transforms[t] ] = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)';
               has3d = window.getComputedStyle(el).getPropertyValue( transforms[t] );
         }
      }
      // Checking for erronous android versions
      var androidVersion = navigator.userAgent.match(/Android (\d+(?:\.\d+)+)/);
      if( has3d !== undefined) {
           supports.transform3d = (has3d !== 'none');
           if (androidVersion !== null && !/^([0-2]\.[0-9])/.test(androidVersion[1])) {
            supports.transform3d = false;
           }
      } else {
           supports.transform3d = false;
      }
  return supports;
}

/*
 - Class inheritance idea courtesy of John Resig
*/

(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Viewtiful = function(){};
  
   // Checking for web browser supports, and storing them
   Viewtiful.prototype.supports = testSupport();
   // Method for recursively detecting object instances
   Viewtiful.prototype.hasInstancesOf = checkSubviewInstances;
   
   // Adding gestures to the views.
   Viewtiful.prototype.addTapGesture = function(action, view) {
      if (typeof action !== "function") {
         console.log("Action has to be a function");
         return;
      } else if (!this.DOM) {
         console.log("Object is not a view");
         return;
      } else if (this.DOM.data("events") && this.DOM.data("events").touchstart) {
         this.DOM.off("touchstart touchmove touchend click $tap");
      }
      var viewContext = view || this,
          touchevent = {},
          self = this;

      self.DOM.on('$tap', function(e) {
         // Making sure the function isn't called more than once every 50ms
         if ( !touchevent.lastCalled || (Date.now() - touchevent.lastCalled) > 50) {
            touchevent.lastCalled = Date.now();
            return action.call(viewContext, e);   
         }
      });
      if('ontouchstart' in window) {
         self.DOM.on('touchstart', function(event) {
            var e = event.originalEvent;
            touchevent.touchMovePos = {x:0,y:0};
            touchevent.touchStartPos = {
               x : (e.touches && e.touches[0].pageX != 0) ? e.touches[0].pageX : e.pageX,
               y : (e.touches && e.touches[0].pageY != 0) ? e.touches[0].pageY : e.pageY
            };
            touchevent.touching = true;
         });
         self.DOM.on('touchmove', function(event) {
            var e = event.originalEvent;
            touchevent.touchMovePos = {
               x : (e.touches && e.touches[0].pageX != 0) ? e.touches[0].pageX-touchevent.touchStartPos.x : e.pageX-touchevent.touchStartPos.x,
               y : (e.touches && e.touches[0].pageY != 0) ? e.touches[0].pageY-touchevent.touchStartPos.y : e.pageY-touchevent.touchStartPos.y
            };
            if(Math.abs(touchevent.touchMovePos.x)>10 || Math.abs(touchevent.touchMovePos.y)>10) {
               touchevent.touching = false;
            }
         });
         self.DOM.on('touchend', function(e) {
            e.preventDefault();
            if (touchevent.touching) {
               self.DOM.trigger('$tap');
            }
            return false;
         });
         self.DOM.on('click', function(e) { e.preventDefault(); });
      } else {
         self.DOM.on('click', function(e) {
            e.preventDefault();
            self.DOM.trigger('$tap');
         });
      }
   };
   Viewtiful.prototype.addPanGesture = function(actions, view) {
      if (typeof actions.started !== "function" || typeof actions.moved !== "function" || typeof actions.ended !== "function") {
         console.log("Actions have to be functions");
         return;
      } else if (!this.DOM) {
         console.log("Object is not a view");
         return;
      } else if (this.DOM.data("events") && this.DOM.data("events").touchstart) {
         this.DOM.off("touchstart touchmove touchend mousedown mousemove mouseup");
      }

      var viewContext = view || this, self = this;
      self.DOM.on('touchstart mousedown', function(event) { 
         actions.started.call(viewContext, event.originalEvent);
      });
      self.DOM.on('touchmove mousemove', function(event) { 
         actions.moved.call(viewContext, event.originalEvent);
      });
      self.DOM.on('touchend mouseup', function(event) { 
         actions.ended.call(viewContext, event.originalEvent);
      });
   };
   /* 
    *   Defining hereditary properties with optional setters & getters
    *   - Supports only one level of properties so far (e.g: view.background = "", not view.background.color.hex = "")
    *   - Supports custom setters & getters
    *   - Setters must be defined as "propertyname { set : function(value) { this._propertyname = value; } }", not
    *                                 propertyname { set : function(value) { this.propertyname = value; } }", in order to avoid infinite loops
    */
   Viewtiful.prototype.setProperties = function(properties) {
      for(var propname in properties) {
         // Optionally define property as "propertyname : 'asd'", instead of "propertyname : {default: 'asd'}"
         if ( typeof properties[propname] !== "object" && typeof properties[propname] !== "function") {
            this[propname] = properties[propname];
         } 
         else if( properties[propname] === null || properties[propname] instanceof Array || 
               (typeof properties[propname] === "object" && !properties[propname].set) || 
               (typeof properties[propname] === "object" && !properties[propname].get) ) {
            this[propname] = properties[propname];
         } else {
            // Custom setters & getters
            if ( (properties[propname].set && typeof properties[propname].set === "function") || (properties[propname].set && typeof properties[propname].set === "function")) {
               Object.defineProperty(this, propname, {
                  set : properties[propname].set,
                  get : properties[propname].get,
                  configurable: true,
                  enumerable : (properties[propname].private !== undefined) ? properties[propname].private : false
               });
            }
            if (properties[propname].defaultValue) {
               this["_"+propname] = properties[propname].defaultValue;
            } 
            /* DEPRECATED - TODO: add fallback to defineG[S]etter when defineProperty is unsupported */
            // if (properties[propname].set && typeof properties[propname].set === "function") {
            //    this.__defineSetter__(propname, properties[propname].set);
            // }
            // if (properties[propname].get && typeof properties[propname].get === "function") {
            //    this.__defineGetter__(propname, properties[propname].get);
            // }
            // // Setting the default value (optional)
            // if (properties[propname].default) {
            //    this["_"+propname] = properties[propname].default;
            // } else {
            //    this["_"+propname] = null;
            // }
         }
      }
  }
  // Create a new Class that inherits from this class
  Viewtiful.extend = function(prop) {
    var _super = this.prototype,
         propertyvars = null;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    // Setting up inherited properties
    if (_super.properties) {
      propertiesCopy = $.extend(true, {}, _super.properties);
      prototype.properties = propertiesCopy;
    } else {
      prototype.properties = {};
    }
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      if (typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name])) {
        prototype[name] = (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]);

      } else if (typeof prop[name] === "object" && name == "properties") {
         // Saving these for later
         propertyvars = prop[name];
         $.extend(true, prototype.properties, propertyvars);
      } else {
        prototype[name] = prop[name];
      }
      
    }
    
    // The dummy class constructor
   function Viewtiful() {
      // All construction is actually done in the init method
      if ( !initializing && this.init ) {
         if (_super.properties) {
            var propCopy = $.extend(true, {}, _super.properties);
            this.setProperties.call(this, propCopy);
         }
         if (propertyvars) {
            var propCopy = $.extend(true, {}, propertyvars);
            this.setProperties.call(this, propCopy);
         }
         
         this.init.apply(this, arguments);
      }
   }
    
    // Populate our constructed prototype object
    Viewtiful.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Viewtiful.prototype.constructor = Viewtiful;

    // And make this class extendable
    Viewtiful.extend = arguments.callee;
    
    return Viewtiful;
  };
})();

/*
-----------------
Application class:
   The top-level class which sets the 
   root-controller of the application, and
   keeps track of global values.
-----------------
*/
var Application = Viewtiful.extend({
   properties : {
      rootController : {
         set : function(controller) {
            this.DOM.css("background-color", controller.backgroundColor);
            if (this._rootController) {
               this._rootController.DOM.removeClass('root-controller').detach();
               this.DOM.prepend(controller.DOM);
               this._rootController = controller;
               controller.DOM.addClass('root-controller');
            } else {
               this.DOM.prepend(controller.DOM);
               this._rootController = controller;
               controller.DOM.addClass('root-controller');
            }
            controller.becameActive();
         },
         get : function() {
            return this._rootController;    
         }
      }
   },
   init : function(properties) {
      var self = this;
      this.drawDOM();
      self.DOM.prependTo("body");
   },
   drawDOM : function() {
      this.DOM = $("<div class='app'></div>");
   }
}),


/*
-----------------
Controller class:
   The base-class for the different
   controllers, which handle views &
   other controllers.
-----------------
*/
Controller = Viewtiful.extend({
   properties : {
      _className  : "Controller",
      _class       : null,
      loaded      : false
   },
   init : function(properties) {
      $.extend(true, this, properties);
      this.drawDOM();
   },
   drawDOM : function() {
      subClassText = (this._class) ? this._class+"-view-controller" : this._class,
      this.DOM = $(
      '<section ' 
        +'class="controller '+ subClassText +'" '
        +'style=""'
      +'></section>');
   },
   didLoad : function() {
      /* Runs first time controller becomes active */
      this.loaded = true;
   },
   becameActive : function() {
      if (!this.loaded) {
         this.didLoad();
      }
   },
   becameInactive : function() {

   }
}),


/*
-----------------
View class:
   The base-class for different
   views, handling the hierarchical-
   functionality of the views, as well 
   as their basic graphical properties.
-----------------
*/
View = Viewtiful.extend({
   properties : {
      _className : "View",
      _class       : "",
      controller  : null,
      active      : false,
      loaded      : false,
      delegate    : null,
      subviewIndex: null,
      subviews    : [],
      hidden      : {
          set: function(isHidden) {
            this._hidden = isHidden;
            if (this.DOM) {
              if (isHidden)
                this.DOM.addClass("is-view-hidden");
              else
                this.DOM.removeClass("is-view-hidden");
            }
          },
          get: function() {
            return this._hidden;
          }
      }
   },
   init : function(properties) {
      $.extend(true, this, properties);
      this.drawDOM();
      // calling setter to make sure view is hidden when DOM is generated
      if (this.hidden) {
        this.hidden = this.hidden;
      }
      
   },
  // DOM setup in separate method, in order to be able to override it when extending.
  drawDOM : function() {
   var subClassText = (this._class) ? this._class+"-view" : this._class;
   this.DOM = $('<div class="view '+subClassText+'"></div>');
  },
  /* 
   Callbacks for becoming active/inactive. These are called
   when their controller goes active/inactive.
  */
  becameActive: function() {
   if (!this.loaded) { this.loaded = true; this.didLoad(); }
   if (!this.active) {
      this.active = true;
      if (this.subviews.length) {
         for(var i = 0; i<this.subviews.length; i++) {
            this.subviews[i].becameActive();
         }
      }
   }
  },
   becameInactive: function() {
      if (this.active) {
         this.active = false;
         if (this.subviews.length) {
            for(var i = 0; i<this.subviews.length; i++) {
               this.subviews[i].becameInactive();
            }
         }
      }
  },
  didLoad: function() {

  },
   /*
   Subviews:
      Adding subviews adds the subviews' DOM
      to the parents DOM, while also adding a pointer
      to the object onto the parent, and the other way around.
      Usually overriden to identify specific types of Views.
      I.E a form adding input-subviews, to add specific behaviour.
   */
   addSubView : function(view) {
      if (view instanceof View) {
        if (this.active) {
          view.becameActive();
        }
        view.controller = (this.controller) ? this.controller : null;
        this.DOM.append(view.DOM);

        this.subviews.push(view);
        view.subviewIndex = this.subviews.length-1;
        view.superview = this;
      } else {
      	console.log("Error: Parameter specified is not a view");
      }
   },
   addSubViewAtIndex : function(view, index) {
      if (view instanceof View && this.subviews[index]) {
         if (this.active) {
            view.becameActive();
         }
         view.controller = (this.controller) ? this.controller : null;
         this.subviews[index].DOM.first().before(view.DOM);
         this.subviews.splice(index, 0, view);
         view.subviewIndex = index;
         view.superview = this;
      } else {
      	console.log("Error: View does not have specified index or is not a view")
      }
   },
   removeSubView : function(view) {
      if (view instanceof View && this.subviews.hasObject(view)) {
         view.becameInactive();
         view.controller = null;
         view.DOM.detach();
         this.subviews.splice(view.subviewIndex, 1);
         view.subviewIndex = null;
         view.superview = null;
      } else {
         console.log("Error: specified view does not exist in superview");
      }
   },
   removeSubViewByIndex : function(index) {
      if (this.subviews[index]) {
         view.becameInactive();
         view.controller = null;
         this.subviews[index].DOM.detach();
         this.subviews[index].subviewIndex = null;
         this.subviews[index].superview = null;
         this.subviews.splice(index, 1);
      } else {
         console.log("Error: subview index does not exist");
      }
   }
}),

/*
-----------------
ViewController class:
   The most basic controller - 
   the control has one rootView, and 
   manages the behaviour of it.
-----------------
*/
ViewController = Controller.extend({
   properties : {
      _className : "ViewController",
      backgroundColor : {
        set: function(val) {
          if (this.DOM) {
            this.DOM.css("backgroundColor", val);
          }
          this._backgroundColor = val;
        },
        get: function() {
          return this._backgroundColor;
        },
        defaultValue: "#f0f0f0"  
      },
      loaded : false,
      rootView    : {
         set : function(newRootView) {
            if (newRootView instanceof View) {
               if (this._rootView) {
                  this._rootView.DOM.removeClass('root-view');
                  this._rootView.DOM.replaceWith(newRootView.DOM);
                  this._rootView = newRootView;
                  newRootView.DOM.addClass('root-view');
               } else {
                  this.DOM.prepend(newRootView.DOM);
                  this._rootView = newRootView;
                  newRootView.DOM.addClass('root-view');
               }
               this._rootView.controller = this;
            }
         },
         get : function() {
            return this._rootView;
         }
      }
   },

  init : function(properties) {
      this._super(properties);
      var view = new View({_class: this._class});
      this.rootView = view;
  },
  drawDOM : function() {
   var subClassText = (this._class) ? this._class+"-view-controller" : this._class;
   this.DOM = $(
      '<section ' 
        +'class="controller view-controller '+ subClassText +'" '
        +'style=""'
      +'></section>');
  },
  becameActive : function() {  
      this.rootView.becameActive();
      this.DOM.addClass("active").css("backgroundColor", this.backgroundColor);
  },
  becameInactive : function() {
      this.rootView.becameInactive();
      this.DOM.removeClass("active");
  }
}),

/*
-----------------
TabController class:
   A controller which handles an arbitrary amount
   of ViewControllers by creating a tab-bar 
   with tab-item-buttons for each controller.
-----------------
*/
TabController = Controller.extend({
   properties : {
      _className : "TabController",
      tabBar : null,
      activeController: {
         set: function(i) {
            if (this.viewControllers[i]) {
              if (this.activeController) {
                this.activeController.becameInactive();
              }
              this._activeControllerIndex = i;
              if (this.activeController) {
                this.activeController.becameActive();
              }
            }
         },
         get: function() {
            return this.viewControllers[this._activeControllerIndex];
         }
      },
      viewControllers : []
   },
   init : function(properties) {
      this._super(properties);
      this.tabBar = new TabBar({_class: this._class+"-tabbar"});
      this.tabBar.delegate = this;
      this.DOM.append(this.tabBar.DOM);
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-tab-controller" : this._class;
      this.DOM = $(
         '<section ' 
           +'class="controller tab-controller '+ subClassText +'" '
           +'style=""'
         +'></section>');
   },
   // controller | tablabel | icon | withoutTab | /*inactiveIcon*/
   addViewController : function(args) {
      if (args.controller instanceof ViewController) {
         this.viewControllers.push(args.controller);
         this.DOM.append(args.controller.DOM);
         if (!args.withoutTab) {
            this.tabBar.addTabItem(args.tabLabel, args.icon);
         }
      }
   },
   tabWasSelected : function(tabBar, tabIndex) {
      this.activeController = tabIndex;
      if (this.viewControllers[tabIndex]) {
        this.backgroundColor = this.viewControllers[tabIndex].backgroundColor;
      }
   },
   becameActive : function() {
      this.tabBar.becameActive();
      if (this.activeController) {
         this.viewControllers[0].becameActive();
      }
   },
   becameInactive : function() {
      this.tabBar.becameInactive();
      this.activeController.becameInactive();
   }
}),

TabBar = View.extend({
   properties : {
      _className : "TabBar",
      delegate : null,
      selectionEnabled : true,
      /* 
       * TODO - Add setters for array / object-type properties
       * Clarify delegate flow
      */
      tabItems : [],
      selectedTab : {
         set: function(tabIndex) {
            for(var i=0; i<this.tabItems.length; i++) {
               this.tabItems[i].selected = false;
            }
            this.tabItems[tabIndex].selected = true;
            this._selectedIndex = tabIndex;
            this.tabWasSelected(this, tabIndex);
         },
         get: function() {
            return this.tabItems[this._selectedIndex];
         }
      }
   },
   init : function(properties) {
      this._super();
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-tabbar-view" : this._class;
      this.DOM = $("<nav class='view tabbar-view "+subClassText+"'></nav>");
   },
   didLoad : function() {
      $.each(this.tabItems, function(index, tab) {
         tab.addTapGesture(function() { this.selected = true; this.superview.selectedTab = index; }, tab);
      });
   },
   addTabItem : function(label, icon) {
      var index = this.tabItems.length+1, self = this;
      tabLabel = label || "Tab "+index;
      tabIcon = icon || ""; // TODO Add placeholder-image
      var tabItem = new TabItem({_class: this._class+"-tabitem", label: tabLabel, icon: tabIcon});
      this.tabItems.push(tabItem);
      this.addSubView(tabItem);
      $.each(this.tabItems, function(index, tab) {
        tab.DOM.css("width", 100/self.tabItems.length+"%");
      });
   },
   // Delegate method
   tabWasSelected : function(tabBar, tabIndex) {
      if (this.delegate.tabWasSelected && typeof this.delegate.tabWasSelected === "function" && this.selectionEnabled) {
         this.delegate.tabWasSelected(tabBar, tabIndex);
      }
   }
}),

TabItem = View.extend({
   properties : {
      selected : {
         set : function(bool) {
            this._selected = bool;
            if (this.DOM) {
               (bool) ? this.DOM.addClass("is-tab-selected") : this.DOM.removeClass("is-tab-selected");
            }
         },
         get : function() {
            return this._selected;
         }
      },
      icon : {
         set : function(img) {
            if (img) {
               if (!this._iconView) {
                  this._iconView = new ImageView({_class: this._class+"-icon", image: img});
               } else {
                  this._iconView.image = img;
               }
            }
         },
         get : function() {
            return this._iconView.image;
         }
      },
      label : {
         set : function(txt) {
            this._label = txt;
            if (this.DOM) {
               this.DOM.text(txt).attr("href", "#"+txt);
            }
         },
         get : function() {
            return this._label;
         }
      }
   },
   init : function(properties) {
      this._super();
      this.label = properties.label;
      this.icon = properties.icon;
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-tabitem-view" : this._class;
      this.DOM = $("<a href='#"+this.label+"' class='view tabitem-view "+subClassText+"'>"+this.label+"</a>");
   }
}),

NavigationBar = View.extend({
   properties : {
      _className  : "NavigationBar",
      buttonItems : []
   },
   init : function(properties) {
      this._super(properties);
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-navigationbar-view" : this._class;
      this.DOM = $("<nav class='view navigationbar-view "+subClassText+"'></nav>");
   },
   addSubView : function (view) {
      this._super();
      if (view instanceof NavigationBarItem) {
         this.buttonItems.push(view);
      }
   }

}),

NavigationBarItem = View.extend({
   properties : {
      _className : "NavigationBarItem",
      icon : null
   },
   init : function(properties) {
      this._super(properties);
   }
}),

ListItem = View.extend({
   properties : {
      _className : "ListItem"
   },
	init : function(properties) {
		this._super(properties);
	},
	drawDOM : function() {
		var subClassText = (this._class) ? this._class+"-listitem-view" : this._class;
		this.DOM = $("<li class='view listitem-view "+subClassText+"'></li>");

	}
}),

ListView = View.extend({
   properties : {
      _className : "ListView",
      listType : "unordered",
      items : []
   },
	init : function(properties) {
		var self = this;
		this._super(properties);
      this.items = [];
		this.populate(properties.items);
	},
	drawDOM : function() {
		var tag = (this.listType == "unordered") ? "ul" : "ol",
			subClassText = (this._class) ? this._class+"-list-view" : this._class;
		this.DOM = $("<"+tag+" class='view list-view "+subClassText+"'></"+tag+">");
	},
	populate : function(items) {
		var self = this;
		if (items && items.length) {
			$.each(items, function(index, item) {
				item._class = self._class;
				var newItem = new ListItem(item);
				self.addSubView(newItem);
	         self.items.push(newItem);
			});
		}
	}
}),

TextView = View.extend({
   properties : {
      _className : "TextView",
      text : {
         defaultValue :"Text View",
         set : function(text) { 
            this._text = text;
            if(this.DOM) { this.DOM.text(text); } 
         }, 
         get : function() {
            return this._text;
         }
      },
      fontCase : {
         set : function(fontCase) {
            var caseClasses = {
               uppercase: "is-text-uppercase",
               lowercase: "is-text-lowercase",
               capitalize: "is-text-capitalized"
            };
            if (fontCase in caseClasses) {
               if (this.DOM) {
                  this.DOM.removeClass(caseClasses.uppercase+" "+caseClasses.lowercase+" "+caseClasses.capitalize);
                  this.DOM.addClass(caseClasses[fontCase]);
               }
               this._fontCase = fontCase;
            }
         },
         get : function() {
            return this._case;
         }
      }
   },
   init : function(properties) {
      this._super(properties);

      // Setting font case when DOM has loaded
      this.fontCase = this._fontCase;
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-text-view" : this._class;
      this.DOM = $("<p class='view text-view "+subClassText+"'>"+this.text+"</p>");
   }
}),

HeaderView = TextView.extend({
   properties : {
      _className : "Header",
      text : "Header"
   },
   init : function(properties) {
      this._super(properties);
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-header-view" : this._class;
      this.DOM = $("<h1 class='view header-view "+subClassText+"'>"+this.text+"</h1>");
   }
}),

ImageView = View.extend({
   properties : {
      _className : "ImageView",
      image : {
         set : function(imageSource) {
            this._imageSource = imageSource;
            if (this.DOM) {
               this.imageDOM.attr("src", imageSource);  
            }
         },
         get : function() {
            return this._imageSource;
         }
      }
   },
	init : function(properties) {
		this._super(properties);
      this.image = properties.image;
      
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-image-view" : this._class;
      this.DOM = $("<figure class='view image-view "+subClassText+"'><img src='"+this._imageSource+"'></img></figure>");
      this.imageDOM = this.DOM.find('img');
   }
}),

InputField = View.extend({
   properties : {
      _className : "InputField",
      placeholder : "",
      label       : "",
      identifier  : "",
      type        : "",
      value       : {
         set: function(value) {
            if (this.inputDOM) {
               this.inputDOM.val(value);
            }
            this._value = value;
         },
         get: function() {
            if (this.inputDOM) {
               return this.inputDOM.val();   
            } else {
               return this._value;
            }
            
         }
      },
      name        : ""
   },
   init : function(properties) {
   	this._super(properties);
    var self = this;
    if (this.type == "radio") {
      this.labelDOM.click(function() { self.inputDOM.attr("checked", "checked"); });
    }
   },
   drawDOM : function() {
      this.type = (this.type === "") ? "text" : this.type;
      var placeholderText = "",
         labelClass = this._class+"-inputlabel",
         valueText = this.value || "",
         labelText = this.label || this.placeholder,
         nameText = this.name || this.identifier,
         subClassText = (this._class) ? this._class+"-input-view" : this._class;

      // Checking if browser supports the placeholder-attribute
      if (this.supports.placeholders) {
         placeholderText = "placeholder='"+this.placeholder+"'";
         // Checking if a label is specified
         if (!this.label) {
            labelClass += " is-label-hidden";
            labelText = "";
         }
      }
      if (this.type == "submit") {
         labelClass += " is-label-hidden";
         labelText = "";
         valueText = this.label || "Submit";
      } else {

      }

      this.DOM = $("<label for='"+this.identifier+"' class='inputlabel "+labelClass+"'>"+labelText+"</label>"
         +"<input id='"+this.identifier
            +"' type='"+this.type
            +"' name='"+nameText
            +"' value='"+valueText
            +"' class='view input-view "+subClassText+"'"
            +placeholderText
         +"'></input>");
      this.labelDOM = this.DOM.filter('label');
      this.inputDOM = this.DOM.filter('input');
   },
   validate : function() {

   }
}),

/*
-----------------
Form class:
   An input form, containing an
   arbitrary amount of inputs, usually accompanied 
   by a submit-button. The form automatically
   detects added inputs and submit-buttons.
   A submit-callback can be supplied as "ajaxSubmit",
   which is called in place of the standard submit.
-----------------
TO DO: Add standardized value-parameters to submit callback.
*/
Form = View.extend({
   properties : {
      _className : "Form",
      formAction  : null,
      method      : "POST",
      inputs      : [],
      submitButton: null,
      ajaxSubmit  : null,
      errorText   : {
        set : function(val) {
          this._errorText = val;
          if (this._errorView) {
            this._errorView.DOM.text(val);  
          }
        },
        get : function() {
          return this._errorText;
        }
      }
   },
   init : function(properties) {
      this._super(properties);
      // Clearing inputs to put in real ones
      this.inputs = [];
      this.populate(properties.inputs);
      this._errorView = new TextView({_class: "error", text: "", hidden: true});
      this.addSubView(this._errorView);
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-form-view" : this._class;
      this.DOM = $("<form action='"+this.formAction+"' method='"+this.method+"' class='view form-view "+subClassText+"'></form>")
   },
   submit : function() {
      this.DOM.trigger("submit");
   },
   didLoad : function() {
      var self = this;
      this.DOM.submit(function() {
         self._errorView.hidden = true;
         if (typeof self.ajaxSubmit === "function") {
            self.ajaxSubmit.apply(self);
         } else {
            return true;
         }
         return false;
      });
      if (this.submitButton) {
         this.submitButton.addTapGesture(function() { this.DOM.trigger("submit"); }, this);
      }
   },
   addSubView : function(view, useSuper) {
      this._super(view);
      var self = this,
      // Recursively checking for inputs when adding subviews
      addInput = function() {
         self.inputs.push(this);
         if (/submit/i.test(this.type)) {
            self.submitButton = this;
            // Getting rid of click-delay on mobile
            if (this.loaded) {
               self.submitButton.addTapGesture(function() {self.DOM.trigger("submit");}, self);
            }
      	}
      }
      if (!useSuper) {
      	view.hasInstancesOf(InputField, addInput);
      }
   },
   populate : function(items) {
   	var self = this;
		if (items && items.length) {
			$.each(items, function(index, item) {
				item._class = self._class;
				var newItem = new InputField(item);
				self.addSubView(newItem);
			});
		}
   },
   receivedError : function(error) {
      this.errorText = error;
      this._errorView.hidden = false;
   },
   becameInactive : function() {
      this._errorView.hidden = true;
   }
})
