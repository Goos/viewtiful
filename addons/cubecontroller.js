/*
-----------------
CubeController class:
   A slightly more complex controller, which
   handles six different ViewControllers,
   by animating a 3D-cube, with one
   controller on each side. It is 
   navigated through horizontally by dragging,
   or the rotateToSide()-method for a specified
   side-string. (front | right | left | back | top | bottom )
-----------------
*/

// Extracting rotation value out of 3d-matrix

$.fn.rotation = function () {
   var obj = this;
   var matrix = obj.css("-webkit-transform") ||
   obj.css("-moz-transform")    ||
   obj.css("-ms-transform")     ||
   obj.css("-o-transform")      ||
   obj.css("transform");
   if(matrix !== 'none') {
      var values = matrix.split('(')[1];
      values = values.split(')')[0];
      values = values.split(',');
      var a = values[0];
      var b = values[2];
      var c = values[8];
      var d = values[10];
      var scale = Math.sqrt(a*a + b*b);
      var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
   } else { var angle = 0; }
   return angle;
};

var CubeController = Controller.extend({
   properties : {
      _className : "CubeController",
      sides : { 
         top: {},
         front: {},
         bottom: {},
         left: {},
         back: {},
         right: {}
      },
      controls : {
         visible  : false,
         previous : null,
         next     : null
      },
      dimensions : {
         width: $(window).width(),
         height: $(window).height(),
         depth: $(window).width()
      },
      currentSide : "",
      defaultSide : "",
      touchingEnabled : false,
      _touchevent : {},
      z : {
         set: function(val) {
            this._z = val;
         },
         get: function() {
            return this._z+this.ZCONST;
         }
      },
      ZCONST : 0,
      _rotation : 0
   },
   init : function(properties) {
      this._super(properties);
      this.defaultSide = (this.defaultSide) ? this.defaultSide : "front";
      var self = this;
      $(window).resize(function() { self.resize.apply(self); });
      
      this.controls.previous.on("$tap", function(event) {
         self.cubeDOM.addClass("is-animated");
         self.rotateTo(-self.cubeDOM.rotation()+90);
      });
      this.controls.next.on("$tap", function(event) {
         self.cubeDOM.addClass("is-animated");
         self.rotateTo(-self.cubeDOM.rotation()-90);
      });
   },
   drawDOM : function() {
      var subClassText = (this._class) ? this._class+"-cube-controller" : this._class;
      this.DOM = $(
         '<section '
            +'class="controller cube-controller '+ subClassText + '" '
            +'style="">'
         +'</section>');
      this.cubeDOM = $('<div class="cube is-animated"></div>').appendTo(this.DOM);
      this.sides.top.DOM = $('<div class="side top"></div>').appendTo(this.cubeDOM);
      this.sides.front.DOM = $('<div class="side front"></div>').appendTo(this.cubeDOM);
      this.sides.bottom.DOM = $('<div class="side bottom"></div>').appendTo(this.cubeDOM);
      this.sides.left.DOM = $('<div class="side left"></div>').appendTo(this.cubeDOM);
      this.sides.back.DOM = $('<div class="side back"></div>').appendTo(this.cubeDOM);
      this.sides.right.DOM = $('<div class="side right"></div>').appendTo(this.cubeDOM);
      this.controls.previous = $('<a class ="view controls previous '+(this.controls.visible ? "" : "is-view-hidden")+'" href="#previous">Previous</a>').appendTo(this.DOM);
      this.controls.next = $('<a class ="view controls next '+(this.controls.visible ? "" : "is-view-hidden")+'" href="#next">Next</a>').appendTo(this.DOM);
      //TODO: convert to Viewtiful Views
   },
   didLoad : function() {
      this.addPanGesture({
         started: this._touchingBegan,
         moved : this._touchingMoved,
         ended  : this._touchingEnded
      });
   },
   becameActive : function() {
      this._super();
      var self = this;
      this.cubeDOM.removeClass("is-animated");
      this.resize();
      this.rotateToSide(this.defaultSide);
      setTimeout(function() {self.cubeDOM.addClass("is-animated");}, 100);
   },
   _touchingBegan : function(event) {
      if (this.touchingEnabled) {
         event.stopPropagation();
         this.cubeDOM.removeClass("is-animated");
         this._touchevent.touching = true;
         this._touchevent.startTime = Date.now();
         this._touchevent.startPos = {
            y: (event.touches && event.touches[0].pageY != 0) ? event.touches[0].pageY : event.pageY,
            x: (event.touches && event.touches[0].pageX != 0) ? event.touches[0].pageX : event.pageX
         };
         this._touchevent.hasMoved = false;
         this._touchevent.preventPanning = false;
         this._touchevent.preventScrolling = false;
         this._touchevent.startRotation = -this.cubeDOM.rotation();
         this._rotation = this._touchevent.startRotation;
      }
   },
   _touchingMoved : function(event) {
      event.stopPropagation();
      if (this._touchevent.touching) {
         var currentPos = {
            y: (event.touches && event.touches[0].pageY != 0) ? event.touches[0].pageY : event.pageY,
            x: (event.touches && event.touches[0].pageX != 0) ? event.touches[0].pageX : event.pageX
         };
         this._touchevent.deltaPos = {
            y: currentPos.y - this._touchevent.startPos.y,
            x: currentPos.x - this._touchevent.startPos.x
         };
         if (!this._touchevent.preventScrolling && Math.abs(this._touchevent.deltaPos.y) > 20) {
            this._touchevent.preventPanning = true;
         }
         else if (!this._touchevent.preventPanning && Math.abs(this._touchevent.deltaPos.x) > 20) {
            this._touchevent.preventScrolling = true;
            this._touchevent.hasMoved = true;
         } 

         if (!this._touchevent.preventPanning) {
            event.preventDefault();
            var degreeFactor = this.dimensions.width/90,
            rotateDegrees = this._touchevent.startRotation+this._touchevent.deltaPos.x/degreeFactor;
            this._rotation = rotateDegrees;
            var css = {
               "-webkit-transform": "translateZ(-"+this.z+"px) rotateY("+rotateDegrees+"deg)",
               "-moz-transform": "translateZ(-"+this.z+"px) rotateY("+rotateDegrees+"deg)",
               "-o-transform": "translateZ(-"+this.z+"px) rotateY("+rotateDegrees+"deg)",
               "-ms-transform": "translateZ(-"+this.z+") rotateY("+rotateDegrees+"deg)",
               "transform": "translateZ(-"+this.z+") rotateY("+rotateDegrees+"deg)"
            };
            this.cubeDOM.css(css);
         } 
      }
   },
   _touchingEnded : function(event) {
      if (this._touchevent.touching) {
         event.preventDefault();
         this._touchevent.touching = false;
         this._touchevent.endTime = Date.now();
         if (!this._touchevent.preventPanning && this._touchevent.hasMoved) {
            var velocity = Math.abs(this._touchevent.deltaPos.x / (this._touchevent.endTime-this._touchevent.startTime));
            this._rotation = (this._rotation < this._touchevent.startRotation) ? this._rotation-20 : this._rotation+20;
            this.cubeDOM.addClass("is-animated");
            var sidesRotated = Math.round(this._rotation/90),
               roundedRotation = sidesRotated*90;
            this.rotateTo(roundedRotation);
         }  
      }
   },
   _getClosestSide : function(deg) {
      deg = -deg;
      var hSides = [0,90,180,-90],
         sideNames = [
            {name: "front", deg: 0},
            {name: "right", deg: 90},
            {name: "back", deg: 180},
            {name: "left", deg: -90}
         ],
         side = this.currentSide,
         sortedClosest = hSides.sort(function(a,b){
            var c = deg; 
            return Math.min(360 - (a-c),Math.abs(a-c)) - Math.min(360 - (b-c),Math.abs(b-c))
         });

         for(var i = 0; i <= sideNames.length; i++) {
            if (sortedClosest[0] === sideNames[i].deg) {
               side = sideNames[i].name;
               return side;
            }
         }
      return side;
   },
   rotateTo : function(deg) {
      this.z = this.dimensions.width/2;
      var transform = "translateZ(-"+this.z+"px) rotateY("+deg+"deg)",
         css = {
         "-webkit-transform": transform,
         "-moz-transform": transform,
         "-o-transform": transform,
         "-ms-transform": transform,
         "transform": transform
      };
      // Get the closest side and set it to active
      var sideIndex = Math.abs(Math.round(deg/90)%4);
      switch (sideIndex) {
         case 0:
            this.currentSide = "front";
            if (this.sides[this.currentSide].controller) {
               this.sides[this.currentSide].controller.becameActive();
            }
            break;
         case 1:
            this.currentSide = "right";
            if (this.sides[this.currentSide].controller) {
               this.sides[this.currentSide].controller.becameActive();
            }
            break;
         case 2:
            this.currentSide = "back";
            if (this.sides[this.currentSide].controller) {
               this.sides[this.currentSide].controller.becameActive();
            }
            break;
         case 3: 
            this.currentSide = "left";
            if (this.sides[this.currentSide].controller) {
               this.sides[this.currentSide].controller.becameActive();
            }
            break;
      }
      this._rotation = deg;
      this.cubeDOM.css(css);

   },
   rotateToSide : function(sidename) {
      var   self = this,
            classes = [
                "is-cube-left",
                "is-cube-right",
                "is-cube-top",
                "is-cube-front",
                "is-cube-back",
                "is-cube-bottom"
            ].join(" "),
            transforms = this._generateCSS(sidename);

      this.currentSide = sidename;
      this.cubeDOM.removeClass(classes).addClass("is-cube-"+sidename);
      this.cubeDOM.css(transforms.cube);
      this._rotation = this.cubeDOM.rotation();
      /* Checking if a controller exists on the specified side,
         and makes it active, while making the previous controllers inactive. */
      clearTimeout(timeout);
      var timeout = setTimeout(function() {
         $.each(self.sides, function(key, side) {
            if (side.controller && key !== self.currentSide) {
               side.controller.becameInactive();
            }
         });
      }, 500);
      if (this.sides[sidename].controller) {
         this.sides[sidename].controller.becameActive();
      }
   },
   resize : function() {
      var   self = this,
            topHeight = (this.dimensions.width > this.dimensions.height) ? this.dimensions.height : this.dimensions.width;

      this.dimensions.height = $(window).height();
      this.dimensions.width = $(window).width();
      this.dimensions.depth = this.dimensions.width;

      this.DOM.width(this.dimensions.width).height(this.dimensions.height);
      this.z = this.dimensions.width/2;

      $.each(this.sides, function(sidename, side) {
         var transforms = self._generateCSS(sidename);
         side.DOM.css(transforms.side);
         if (sidename == self.currentSide) {
            self.cubeDOM.css(transforms.cube);
         }
         if (sidename == "top" || sidename == "bottom") {
            side.DOM.height(topHeight).width(self.dimensions.depth);
         }
      });
   },
   _generateCSS : function(sidename) {
      // Generating css for the different transforms, for a specified side
      var revolutions = (this._rotation || this._rotation === 0) ? Math.floor(Math.abs(this._rotation/360))+1 : 1,
         topHeight = (this.dimensions.width > this.dimensions.height) ? this.dimensions.height : this.dimensions.width,
         transforms = {},
         zTransforms = {
            top: this.dimensions.height/2,
            front: this.dimensions.width/2,
            bottom: this.dimensions.height/2,
            left: this.dimensions.width/2,
            back: this.dimensions.depth/2,
            right: this.dimensions.width/2
         };
      this.z = zTransforms[sidename];
      var cubeTransforms = {
            top: "translateZ(-"+this.z+"px) rotateX(-90deg)",
            front: "translateZ(-"+this.z+"px) rotateY("+(revolutions>1 ? 90*revolutions : 0)+"deg)",
            bottom: " translateZ(-"+this.z+"px) rotateX(90deg)",
            left: "translateZ(-"+this.z+"px) rotateY("+90*revolutions+"deg)",
            back: "translateZ(-"+this.z+"px) rotateY(-"+180*revolutions+"deg)",
            right: "translateZ(-"+this.z+"px) rotateY(-"+90*revolutions+"deg)"
         },
         // Need two as the transforms need to be in separate order (for some reason)
         sideTransforms = {
            top: "rotateX(90deg) translateZ("+topHeight/2+"px)", //fix gap
            front: "rotateY(0deg) translateZ("+zTransforms[sidename]+"px)",
            bottom: "rotateX(-90deg) translateZ("+zTransforms[sidename]+"px)",
            left: "rotateY(-90deg) translateZ("+zTransforms[sidename]+"px)",
            back: "rotateY(180deg) translateZ("+zTransforms[sidename]+"px)",
            right: "rotateY(90deg) translateZ("+zTransforms[sidename]+"px)"
         };

      transforms.cube = {
         "-webkit-transform": cubeTransforms[sidename],
         "-moz-transform": cubeTransforms[sidename],
         "-o-transform": cubeTransforms[sidename],
         "-ms-transform": cubeTransforms[sidename],
         "transform": cubeTransforms[sidename]
      };
      transforms.side = {
         "-webkit-transform": sideTransforms[sidename],
         "-moz-transform": sideTransforms[sidename],
         "-o-transform": sideTransforms[sidename],
         "-ms-transform": sideTransforms[sidename],
         "transform": sideTransforms[sidename]
      };
      return transforms;

   },
   addControllerToSide : function(controller, side) {
      if (controller instanceof ViewController) {
         this.sides[side].controller = controller;
         this.sides[side].DOM.append(controller.DOM).css("background-color", controller.backgroundColor);
      }
   }
  
});