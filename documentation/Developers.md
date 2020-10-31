# Rough development overveiw

In general, you should use themes for any customization you want to do to the display or data.

## colors

The easiest way to theme the widget is to modify the colors. This can be done by overriding the colors used in the theme file:

     background:"#ddbbbb";
   
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

