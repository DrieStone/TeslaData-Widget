
colors.battery.border_3d = "#33333333";

battery_bar.draw = function(car_data,colors){
	let myDrawContext = new DrawContext();
	myDrawContext.opaque = false;
	myDrawContext.size = new Size(this.width+2,this.height+2);
	
	// draw the background
	myDrawContext.addPath(this.batteryPath);
	myDrawContext.setFillColor(new Color(colors.battery.background));
	myDrawContext.fillPath();
	
	// draw the max charge (as set by the user)
	let batteryMaxCharge  = new DrawContext()  ;
	batteryMaxCharge.opaque = false;
	batteryMaxCharge.size = new Size(this.width*car_data.battery_limit/100,this.height)
	if (car_data.car_state == "Charging"){
		batteryMaxCharge.setFillColor(new Color(colors.battery.charging));
	} else {
		batteryMaxCharge.setFillColor(new Color(colors.battery.max_charge));
	}
	batteryMaxCharge.addPath(this.batteryPath);
	batteryMaxCharge.fillPath();

	myDrawContext.drawImageAtPoint(batteryMaxCharge.getImage(),new Point(0,0));
	
	let usable_battery_level = Number(car_data.usable_battery_level);
	
	// draw the cold battery (if needed)
	if (usable_battery_level < car_data.battery_level && car_data.battery_level > 1){
		let unavailableCharge = new DrawContext()  ;
		unavailableCharge.opaque = false;
		unavailableCharge.size = new Size(this.width*car_data.battery_level/100,this.height);

		unavailableCharge.setFillColor(new Color(colors.battery.cold_charge));
		unavailableCharge.addPath(this.batteryPath);
		unavailableCharge.fillPath();

		myDrawContext.drawImageAtPoint(unavailableCharge.getImage(),new Point(0,0));
		
		usable_battery_level -= 2; // shave a little off so the cold battery display isn't just a sliver of blue.
	}
	

	myDrawContext.addPath(this.batteryPathInset);
	myDrawContext.setStrokeColor(new Color(colors.battery.border_3d,0.3));
	myDrawContext.setLineWidth(4);
	myDrawContext.strokePath();


	// draw the available charge
	if (usable_battery_level>1){
		// if there's at least some battery, build the current charge state bar
		let availableCharge = new DrawContext()  ;
		availableCharge.opaque = false;
		availableCharge.size = new Size(this.width*usable_battery_level/100,this.height);

		availableCharge.setFillColor(new Color(colors.battery.usable_charge));
		availableCharge.addPath(this.batteryPath);
		availableCharge.fillPath();
		
		this.drawHighlight(availableCharge,this.width*usable_battery_level/100,colors);			
	
		availableCharge.addPath(this.batteryPathInset);
		availableCharge.setStrokeColor(new Color(colors.battery.border_3d,0.7));
		availableCharge.setLineWidth(2);
		availableCharge.strokePath();
		
		
		myDrawContext.drawImageAtPoint(availableCharge.getImage(),new Point(0,0));
	}

	if (Number(car_data.battery_level)<99){
		myDrawContext.setFillColor(new Color(colors.battery.separator));
		myDrawContext.fillRect(new Rect(this.width*car_data.battery_level/100,1,1,this.height-1));
		if (usable_battery_level < car_data.battery_level){
			myDrawContext.fillRect(new Rect(this.width*usable_battery_level/100,1,1,this.height-1))
		}
		
		myDrawContext.setFillColor(new Color(colors.battery.border_3d,0.7));
		myDrawContext.fillRect(new Rect(this.width*car_data.battery_level/100+1,1,3,this.height-1))

	}


	// add a final stroke to the whole thing
	myDrawContext.addPath(this.batteryPath);// have to add the path again for some reason
	myDrawContext.setStrokeColor(new Color(colors.battery.border));
	myDrawContext.setLineWidth(1);
	myDrawContext.strokePath();
	
	return myDrawContext.getImage(); // return our final image
	
}

	
battery_bar.drawHighlight =function(contextToDrawOn,width,colors){
	width = width - 10;
	if (width > 4){
		const batteryHighlight = new Path();
		batteryHighlight.addRoundedRect(new Rect(5,6,width+2,3),1,1);

		contextToDrawOn.setFillColor(new Color(colors.battery.highlight,0.3));
		contextToDrawOn.addPath(batteryHighlight);
		contextToDrawOn.fillPath();
		
		contextToDrawOn.setFillColor(new Color(colors.battery.highlight,0.3));
		contextToDrawOn.fillEllipse(new Rect(7,6,width/4,4));
		contextToDrawOn.fillEllipse(new Rect(6,6,width/8,6));
		contextToDrawOn.fillEllipse(new Rect(5,6,width/12,8));

		contextToDrawOn.fillEllipse(new Rect(width,6,5,3))	;
	}
}
