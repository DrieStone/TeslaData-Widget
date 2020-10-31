# Rough theme development overveiw

In general, you should use themes for any customization you want to do to the display or data. Refer to the [Scriptable documentation](https://scriptable.app/) for relavant javascript functions.

## colors

The easiest way to theme the widget is to modify the colors. This can be done by overriding the colors used in the theme file:

     colors.background:"#ddbbbb";
   
Colors should be hex colors, RRGGBBAA (red, green, blue, alpha) or RRGGBB (red, green, blue). RGB (red, green, blue) is valid, but there's a bug in Scriptable where green and blue are swapped. It's recommended not to use this format.

## car_data.postLoad(json)

The postLoad function can be overwritten so you can consume additional data from your json file and modify (or add) variables to the car_data object. For instance, you may wish to grab your car's color and add it to car_data:

   
    car_data.postLoad = function (json){
      var this.car_color = json.exterior_color;
      var colors.car_color = "#ffffff";
      switch (this.car_color){
        case "deepBlue":
          colors.car_color = "#0000ff";
          break;
      }
    }

## Theme

The theme object is called to draw the data to the widget. You can override the theme.draw function to completely change the way that the widget is drawn, however if you want to use the existing theme, but change certain parts, the existing theme is split into 5 boxes that are stacked vertically: Car Status, Car Name, Status Lights, Range Info, and Battery Bar. You can override any of these functions to provide your own style.

For instance, if you wanted to change the way that the car's name is displayed, you can override the drawCarName function:

    theme.drawCarName = function (widget, car_data, colors){
        let stack = widget.addStack();
	   stack.size = new Size(widgetSize.width,widgetSize.height*0.25);
	   stack.centerAlignContent();
	   stack.setPadding(0,3,5,3);
		
	   let carName = stack.addText(car_data.car_name);
	   carName.textColor = new Color(colors.text.primary);
	   carName.leftAlignText() // align the text left instead of center
	   carName.font = Font.semiboldSystemFont(24)
	   carName.minimumScaleFactor = 0.5
    }

## Icons

Iconography is broken into separate functions as well, so you can override one of these functions to change the icon used to draw for certain states:

	theme.getSleepingIcon = function(colors){
		symbolToUse = "zzz"; // change from moon.zzz.fill to a plain zzz icon
		let statusSymbol = SFSymbol.named(symbolToUse);
		return statusSymbol.image;
	}

## Battery Bar

You can review the themes directory to see the way that the 3d.js file restyles the battery bar. The battery bar is its own object that you can modify. You can replace the entire draw function to create a different style battery bar. The function must return an image.
