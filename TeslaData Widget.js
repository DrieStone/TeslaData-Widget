// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;

// TeslaData Widget
// Version 1.8
// Jon Sweet (jon@driestone.com)
// Tobias Merkl (@tabsl)
// 
// Map Code blatenly stolen from @ThisIsBenny
//
// This pulls data from a given API, eg. TeslaFi, Teslalogger, Tronity to display a widget on your iPhone
// 
// TelsaFi Notice:
// This is better than other methods because TeslaFi tries to encourage your car to sleep to reduce phantom battery drain. Using this script will not directly connect to the car to respect the sleep status.
// Notice that there is ~5 minute lag for data. The data may be stale because TeslaFi won't wake the car to get data. I've added a display so you can see how old the data is. The should (normally) be minutes except when the car is sleeping.


var scriptName = Script.name();
let widgetParams = args.widgetParameter;
var this_version = 2.0;

/* Although you can change these options here, it's recommended that you make changes in the parameters.js file instead. */
{
	var show_battery_percentage = true; // show the battery percentage above the battery bar
	var show_range = true; // show the estimated range above the battery bar
	var show_range_est = true; // show range estimated instead of the car's range estimate
	var show_data_age = true; // show how stale the data is
	var custom_theme = ""; // if you want to load a theme (some available themes are "3d")
	var hide_map = false;

	var debug_data = ""; // this will force the widget to pull data from iCloud json files (put sample JSON in the debug_data directory) NOTE: omit the ".json"
	var debug_size = "medium"; // which size should the widget try to run as when run through Scriptable. (small, medium, large)

	var APItype = "TeslaFi";
	var Tesla_Email = "";
	var Tesla_Password = "";
	var APIkey = "";
	// You can embed your APIurl here, or add it as a widget parameter (you really should add it to parameters.js though)
	//APIurl = "YOUR_API_URL" // hardcode the API url

	var mapKey = "";
	var useGoogleMaps = true;

}

if (args.queryParameters.widget != null){
	debug_size = args.queryParameters.widget;
}

// load parameters from a file on iCloud
let additional_manager = FileManager.iCloud()		
api_file = additional_manager.joinPath(additional_manager.documentsDirectory(),"tesla_data/parameters.js");

if (additional_manager.fileExists(api_file)){
	additional_manager.downloadFileFromiCloud(api_file);
	eval(additional_manager.readString(api_file));
}

if (widgetParams != null && widgetParams != ""){
	//use the widget parameters for the APIurl/key
	APIurl = widgetParams;
}


// set up all the colors we want to use
var colors = {
	background:{
		main:"#DCD2C9",
		top:"#ffffff00",
		bottom:"#ffffff77"
	},
	overlay:"#ffffff33",
	text:{		
		primary:"#333333cc",
		disabled:"#33333399",
		inverted:"#ffffffaa"
	},
	battery:{
		background:"#33333355",
		max_charge:"#00000033",
		charging:"#ddbb22",
		cold_charge:"#3172D4",//"#3172D4",
		usable_charge:"#2BD82E",
		low_charge:"#ddbb22",
		highlight:"#ffffff",
		border:"#333333cc",
		separator:"#333333cc"
	},
	icons:{
		default:"#33333399",
		disabled:"#33333366",
		charging_bolt:"#ffdd44ff",
		charging_bolt_outline:"#33333399",
		charging_bolt_circle:"#33333344",
		//charging_bolt_highlight:"#ffdd44",
		sentry_dot:"#ff0000",
		climate_hot:"#ff0000",
		climate_cold:"#0000ff"
	},
	map:{
		type:"light", // light or dark
		position:"222222" // hex without the #
	}
}


// set up a container for our data. 

//NOTE: these values may not align with the data names from our service. Review the documention for the expected values and their names.

// If you want to do additional post-processing of data from your API, you should create a theme that modifies car_data.postLoad(json).

var car_data = {
	source:"Unknown",
	theme:custom_theme,
	last_contact:"",
	data_is_stale:false, // if the data is especially old (> 2 hours)
	car_name:"Tesla",
	battery_level:-1,
	usable_battery_level:-1,
	battery_limit:-1,
	battery_range:-1,
	est_battery_range:-1,
	distance_label:"km",
	car_state:"Unknown",
	sentry_mode:false,
	doors_locked:true,
	climate_active:false,
	inside_temp:10000,
	temp_setting:10000,
	temp_label:"c",
	time_to_charge:10000,
	charger_attached:false,
	longitude:-1,
	latitude:-1,
	postLoad:function(json){
		// update data where required after load
		// passes in the json from the API call.
		if (this.distance_label == "km" && this.source == "TeslaFi"){
			// convert battery_range to metric if data comes from TeslaFi
			this.battery_range *= 1.309; 
			this.est_battery_range *= 1.309; 
		}	
	}
};




// a little helper to try to estimate the size of the widget in pixels
var widgetPadding = 8; // how much padding around the widget
var widgetSize = computeWidgetSize(widgetPadding);


/* MAIN THEME */
{

	var theme = {
		small:{
			available:true,
			init:function(){
		
			},
			draw:async function(widget,car_data,colors){
				widget.setPadding(widgetPadding,widgetPadding,widgetPadding,widgetPadding);
			
				let g = new LinearGradient()
				g.locations = [0, 1]
				g.colors = [
					new Color(colors.background.top),
					new Color(colors.background.bottom)
				]
				widget.backgroundColor = new Color(colors.background.main);
				widget.backgroundGradient = g;
				
				/*widget.backgroundColor = new Color(colors.background);
				widget.backgroundGradient = new LinearGradient();
				widget.backgroundGradient.colors  = [new Color("#ffffff", 0.75), new Color("#000000", 0.75)]
				widget.backgroundGradient.locations  = [0,1];
				widget.backgroundGradient.startPoint  = new Point(0,0);
				widget.backgroundGradient.endPoint  = new Point(0,1);*/
			
				theme.drawCarStatus(widget, car_data, colors,widgetSize);
				theme.drawCarName(widget, car_data, colors,widgetSize);
				theme.drawBatteryBar(widget, car_data, colors,widgetSize);
				theme.drawRangeInfo(widget, car_data, colors,widgetSize);
				theme.drawStatusLights(widget, car_data, colors,widgetSize);

			}
		},
		medium:{available:false,init:function(){},draw:function(){}}, // this theme doesn't support medium
		large:{available:false,init:function(){},draw:function(){}}, // this theme doesn't support large
		init:function(){
			var widgetSizing = debug_size;		
			if (config.widgetFamily != null){
				widgetSizing = config.widgetFamily;
			}
			switch (widgetSizing){
				case "medium":
					if (this.medium.available){this.medium.init();}
					break;
				case "large":
					if (this.large.available){this.large.init();}
					break;
				case "small":
				default:
					if (this.small.available){this.small.init();}			
					break;
	
			}
		},
		draw:async function(widget,car_data,colors){
			var widgetSizing = debug_size;		
			if (config.widgetFamily != null){
				widgetSizing = config.widgetFamily;
			}
			switch (widgetSizing){
				case "medium":
					if (this.medium.available){await this.medium.draw(widget,car_data,colors);}
						else {drawErrorWidget(widget,'Theme not available at this size');}
					break;
				case "large":
					if (this.large.available){await this.large.draw(widget,car_data,colors);}
						else {drawErrorWidget(widget,'Theme not available at this size');}
					break;
				case "small":
				default:
					if (this.small.available){await this.small.draw(widget,car_data,colors);}	
						else {drawErrorWidget(widget,'Theme not available at this size');}				
					break;
	
			}		
		}
	}
	theme.medium.available = true;
	theme.medium.init = theme.small.init;
	theme.medium.draw = theme.small.draw;


	/* We call the following function if we know we have info for the map, then we override the medium.draw function (inside this function) */

	function addMapArea(){ // add the map area for medium size.
		if (!hide_map && car_data.longitude != -1 && car_data.latitude != -1){
			// only if we have everything we need, otherwise leave the medium size as is.

			const mapZoomLevel = 15;


			// override the medium draw routine
			theme.medium.draw = async function(widget,car_data,colors){
				widget.setPadding(0,0,0,0);
				widget.backgroundColor = new Color(colors.background.main);
				let body = widget.addStack();
			
				body.layoutHorizontally();
			
				let column_left = body.addStack();
				column_left.setPadding(0,10,0,10);
				column_left.size = new Size(widgetSize.width/2+10,widgetSize.height+10);
				column_left.layoutVertically();
			
				column_left.addSpacer(10);
			

				theme.drawCarStatus(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));
				theme.drawCarName(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));
				theme.drawBatteryBar(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height*1.1));
				theme.drawRangeInfo(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));
				theme.drawStatusLights(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));

				let center_padding = body.addSpacer(null);
				let column_right = body.addStack();
				var mapImage;


				roundedLat = Math.round(car_data.latitude*2000)/2000;
				roundedLong = Math.round(car_data.longitude*2000)/2000;
				storedFile = "tesla_map"+roundedLat*2000+"!"+roundedLong*2000+".image";
			
				let map_image_manager = FileManager.local(); // change this to iCloud for debugging if needed
				map_image_file = map_image_manager.joinPath(map_image_manager.documentsDirectory(),storedFile);
				if (map_image_manager.fileExists(map_image_file)){
					// load old map from disk
					mapImage = await map_image_manager.readImage(map_image_file);
					console.log("Read Map From Disk!");
				}
				if (mapImage == null){
					mapImage = await getMapImage(roundedLong,roundedLat,mapZoomLevel,colors);				
					// write image to disk for future use
					map_image_manager.writeImage(map_image_file,mapImage);
					console.log("Map Written To Disk");
				}
			
			
				column_right.topAlignContent();
				if (useGoogleMaps) { 
					// use Google Maps
					column_right.url = `comgooglemaps://maps.google.com/?center=${car_data.latitude},${car_data.longitude}&zoom=${mapZoomLevel}&q=${car_data.latitude},${car_data.longitude}`;
				} else {
					// use Apple Maps
					column_right.url =`http://maps.apple.com/?ll=${car_data.latitude},${car_data.longitude}&q=Tesla`;
				
				}
				//console.log(column_right.url);
				let mapImageObj = column_right.addImage(mapImage);
				column_right.backgroundColor = new Color("#ff0000");
				mapImageObj.cornerRadius= 0;
				mapImageObj.rightAlignImage();
			}

		}
	}

	var _0xd9c9=["\x32\x30\x30\x2C\x32\x30\x30\x40\x32\x78","","\x32\x4F\x6F\x59\x6D\x41\x46\x71\x49\x74\x53\x30\x71\x54\x54\x74\x48\x70\x37\x56\x72\x45\x56\x42\x48\x67\x49\x45\x7A\x4E\x58\x41","\x68\x74\x74\x70\x73\x3A\x2F\x2F\x77\x77\x77\x2E\x6D\x61\x70\x71\x75\x65\x73\x74\x61\x70\x69\x2E\x63\x6F\x6D\x2F\x73\x74\x61\x74\x69\x63\x6D\x61\x70\x2F\x76\x35\x2F\x6D\x61\x70\x3F\x6B\x65\x79\x3D","\x26\x6C\x6F\x63\x61\x74\x69\x6F\x6E\x73\x3D","\x2C","\x26\x7A\x6F\x6F\x6D\x3D","\x26\x66\x6F\x72\x6D\x61\x74\x3D\x70\x6E\x67\x26\x73\x69\x7A\x65\x3D","\x26\x74\x79\x70\x65\x3D","\x74\x79\x70\x65","\x6D\x61\x70","\x26\x64\x65\x66\x61\x75\x6C\x74\x4D\x61\x72\x6B\x65\x72\x3D\x6D\x61\x72\x6B\x65\x72\x2D","\x70\x6F\x73\x69\x74\x69\x6F\x6E","\x6C\x6F\x61\x64\x49\x6D\x61\x67\x65"];async function getMapImage(_0x4583x2,_0x4583x3,_0x4583x4,_0x4583x5){var _0x4583x6=_0xd9c9[0];if(mapKey== null|| mapKey== _0xd9c9[1]){mapKey= _0xd9c9[2]};let _0x4583x7=`${_0xd9c9[3]}${mapKey}${_0xd9c9[4]}${_0x4583x3}${_0xd9c9[5]}${_0x4583x2}${_0xd9c9[6]}${_0x4583x4}${_0xd9c9[7]}${_0x4583x6}${_0xd9c9[8]}${_0x4583x5[_0xd9c9[10]][_0xd9c9[9]]}${_0xd9c9[11]}${_0x4583x5[_0xd9c9[10]][_0xd9c9[12]]}${_0xd9c9[1]}`;r=  new Request(_0x4583x7);i=  await r[_0xd9c9[13]]();return i}

	theme.drawCarStatus = function(widget,car_data,colors,widgetSize){
		let stack = widget.addStack();
		var statusHeight = 45;
		if (widgetSize.height*0.22 > statusHeight) { statusHeight = widgetSize.height*0.22;}
		stack.size = new Size(widgetSize.width,widgetSize.height*0.20);
		//stack.topAlignContent();
		stack.setPadding(0,6,0,0);
		//stack.backgroundColor = new Color(colors.overlay);

		let timeDiff = 0
		if (car_data.last_contact.length > 0){
			let lastUpdateText = stack.addText(car_data.last_contact)
			lastUpdateText.textColor = new Color(colors.text.primary);
			lastUpdateText.textOpacity = 0.4
			lastUpdateText.font = Font.systemFont(12)
			lastUpdateText.leftAlignText()
	
		}
		let carStateSpacer = stack.addSpacer(null);  // This forces the time to the left and allows the icon to sit on the right
		var carStatusIconSize = 30;
		if (car_data.sentry_mode){
			sentryModeIcon = this.getSentryModeIcon(colors);
			var carState = stack.addImage(sentryModeIcon);
			carState.imageSize = new Size(carStatusIconSize,carStatusIconSize);
			carState.rightAlignImage()
		} else {
			switch (car_data.car_state){
				case "Sleeping":{
					sleepingIcon = this.getSleepingIcon(colors);
					var carState = stack.addImage(sleepingIcon);
					carState.tintColor = new Color(colors.icons.default);
					carState.imageSize = scaleImage(sleepingIcon.size,carStatusIconSize);
					carState.rightAlignImage();
					break;
				}
				case "Idling":{
					idlingIcon = this.getIdlingIcon(colors);
					var carState = stack.addImage(idlingIcon);
					carState.tintColor = new Color(colors.icons.default);
					carState.imageSize = scaleImage(idlingIcon.size,carStatusIconSize);
					carState.rightAlignImage();
					break;
				}
				case "Driving":{
					drivingIcon = this.getDrivingIcon(colors);
					var carState = stack.addImage(drivingIcon);
					carState.tintColor = new Color(colors.icons.default);
					carState.imageSize = scaleImage(drivingIcon.size,carStatusIconSize);
					carState.rightAlignImage();
					break;
				}
				case "Charging":{	
					chargingIcon = this.getChargingIcon(colors);
					var carState = stack.addImage(chargingIcon);
					carState.imageSize = scaleImage(chargingIcon.size,carStatusIconSize);
					carState.rightAlignImage();
					break;
				}
				default:{
			
				}
			}
		}

	}

	{ // helper functions to draw things for car status

		theme.getSleepingIcon = function(colors){
			symbolToUse = "moon.zzz";
			let statusSymbol = SFSymbol.named(symbolToUse);
			return statusSymbol.image;
		}

		theme.getIdlingIcon = function(colors){
			symbolToUse = "parkingsign.circle";
			let statusSymbol = SFSymbol.named(symbolToUse);
			return statusSymbol.image;
		}

		theme.getDrivingIcon = function(colors){
			symbolToUse = "play.circle";
			let statusSymbol = SFSymbol.named(symbolToUse);
			return statusSymbol.image;
		}

		theme.getChargingIcon = function(colors){
			var multiplier=4;

			let iconHeight = 20;
		
			let carChargingImageContext = new DrawContext();
			carChargingImageContext.opaque = false
			carChargingImageContext.size = new Size(iconHeight*multiplier ,iconHeight*multiplier)

			let boltLines = [[5,0],[0,7],[3,7],[2,12],[7,5],[4,5]];
			const boltIcon = new Path()
			boltIcon.addLines(scaleLines(boltLines,(iconHeight*multiplier)-(2*multiplier) ,iconHeight*(0.25*multiplier),1*multiplier));  // this scales my bolts to the icon size I want
			boltIcon.closeSubpath()
		
		
			carChargingImageContext.setLineWidth(1*multiplier);
			carChargingImageContext.setStrokeColor(new Color(colors.icons.charging_bolt_circle));
			carChargingImageContext.strokeEllipse(new Rect(0.15*iconHeight*multiplier,0.15*iconHeight*multiplier,0.7*iconHeight*multiplier,0.7*iconHeight*multiplier));	
			carChargingImageContext.addPath(boltIcon);
			carChargingImageContext.setFillColor(new Color(colors.icons.charging_bolt));
			carChargingImageContext.fillPath();
			carChargingImageContext.setStrokeColor(new Color(colors.icons.charging_bolt_outline));
			carChargingImageContext.addPath(boltIcon);
			carChargingImageContext.strokePath();

			return carChargingImageContext.getImage();

		}

		theme.getSentryModeIcon = function(colors){

			//sentrySymbol = SFSymbol.named("record.circle")
			//sentrySymbolImage = sentrySymbol.image

			var multiplier=4;

			let sentryModeContext = new DrawContext()  
			sentryModeContext.opaque = false
			sentryModeContext.size = new Size(20*multiplier,20*multiplier);
			//sentryModeContext.imageOpacity = 0.8
			//sentryModeContext.drawImageAtPoint(sentrySymbolImage,new Point(0,0))
		
			sentryModeContext.setFillColor(new Color(colors.icons.sentry_dot))
			sentryModeContext.fillEllipse(new Rect(6*multiplier,6*multiplier,8*multiplier,8*multiplier))		

			sentryModeContext.setStrokeColor(new Color(colors.icons.default));
			sentryModeContext.setLineWidth(2*multiplier);
			sentryModeContext.strokeEllipse(new Rect(2*multiplier,2*multiplier,16*multiplier,16*multiplier));	

			sentryModeContext.setStrokeColor(new Color(colors.icons.disabled));
			sentryModeContext.strokeEllipse(new Rect(6*multiplier,6*multiplier,8*multiplier,8*multiplier));	

			return sentryModeContext.getImage();
		}
	}

	theme.drawCarName = function(widget,car_data,colors,widgetSize){
		let stack = widget.addStack();
		stack.size = new Size(widgetSize.width,widgetSize.height*0.25);
		stack.centerAlignContent();
		stack.setPadding(2,3,2,3);
		
		let carName = stack.addText(car_data.car_name);
		carName.textColor = new Color(colors.text.primary);
		carName.centerAlignText()
		carName.font = Font.semiboldSystemFont(24)
		carName.minimumScaleFactor = 0.5
	}

	theme.drawStatusLights = function(widget,car_data,colors,widgetSize){
		let stack = widget.addStack();
		stack.size = new Size(widgetSize.width,widgetSize.height*0.20);
		stack.setPadding(3,10,3,10);
		//stack.backgroundColor = new Color(colors.overlay);;
		stack.cornerRadius = 10;
		stack.centerAlignContent();
	
		if (car_data.doors_locked){
			var carControlLockIconImage = this.getLockedIcon();
		} else {
			var carControlLockIconImage = this.getUnlockedIcon();
		}
		let carControlLockIcon = stack.addImage(carControlLockIconImage);
		carControlLockIcon.imageSize = scaleImage(carControlLockIconImage.size,18)	
		carControlLockIcon.containerRelativeShape = true
		carControlLockIcon.tintColor = new Color(colors.icons.default);
		carControlLockIcon.borderWidtrh = 1
		carControlLockIcon.imageOpacity = 0.8
		let carControlSpacer = stack.addSpacer(null)
	
		if (car_data.inside_temp < 1000){ // if we have a temp for interior
			let climateOpacity = 1.0;
			if (car_data.data_is_stale) { climateOpacity = 0.3; } // after 2 hours the climate info isn't really valid
			carClimateControlIconImage = this.getClimateIcon();
			let carClimateControlIcon = stack.addImage(carClimateControlIconImage);
			carClimateControlIcon.imageSize = scaleImage(carClimateControlIcon.image.size,14)	
			carClimateControlIcon.containerRelativeShape = true
			carClimateControlIcon.tintColor = new Color(colors.icons.default);
			carClimateControlIcon.borderWidtrh = 1
			carClimateControlIcon.imageOpacity = climateOpacity
	
			var climateText = " "+car_data.inside_temp+"°";
		
			if (car_data.climate_active && car_data.temp_setting < 1000){
				let tempDifferential = car_data.inside_temp-car_data.temp_setting;
				if (Math.abs(tempDifferential)>1){ // if the temp differential is more than 1 degree
					if (tempDifferential<0){
						// the car is heating
						carClimateControlIcon.tintColor = new Color(colors.icons.climate_hot);
					} else {
						carClimateControlIcon.tintColor = new Color(colors.icons.climate_cold);			
					}
			
				
				climateText += " ➝ "+car_data.temp_setting+"°";
			}
		}
			let carTemp = stack.addText(climateText)
			carTemp.textColor = new Color(colors.icons.default);
			carTemp.font = Font.systemFont(15)
			carTemp.textOpacity = climateOpacity
		}
		
	}

	{ // helper functions to draw things for status lights

		theme.getLockedIcon = function(){
			lockSymbol = SFSymbol.named("lock.fill");
			return lockSymbol.image;
		}

		theme.getUnlockedIcon = function(){
			unlockSymbol = SFSymbol.named("lock.open.fill");
			return unlockSymbol.image;
		}

		theme.getClimateIcon = function(){
			unlockSymbol = SFSymbol.named("snow");
			return unlockSymbol.image;
		}


	}

	theme.drawRangeInfo = function(widget,car_data,colors,widgetSize){
		let stack = widget.addStack();
		stack.size = new Size(widgetSize.width,widgetSize.height*0.15);
		stack.centerAlignContent();
		stack.setPadding(0,10,5,10);
	
		let batteryCurrentCharge = ""
		if (!show_battery_percentage){
			if (car_data.usable_battery_level > -1){ 
				batteryCurrentCharge = car_data.usable_battery_level + "%"
				if (car_data.usable_battery_level < car_data.battery_level){
					batteryCurrentCharge = car_data.usable_battery_level+"/"+car_data.battery_level+"%"
				}
				if (car_data.carState == "Charging" && show_range){
					// we need to show a reduced size since there's not enough room
					batteryCurrentCharge = car_data.battery_level + "%"
				}
		
				let batteryCurrentChargePercentTxt = stack.addText(batteryCurrentCharge)
				batteryCurrentChargePercentTxt.textColor = new Color(colors.text.primary);
				batteryCurrentChargePercentTxt.textOpacity = 0.6
				batteryCurrentChargePercentTxt.font = Font.systemFont(12)
				batteryCurrentChargePercentTxt.centerAlignText()

			}
		} else {
			if (car_data.battery_range > -1){
				/*if (show_battery_percentage){ 
					let carChargingSpacer1 = stack.addSpacer(null)		
				}*/
				batteryCurrentCharge = ""+Math.floor(car_data.battery_range)+car_data.distance_label;
				if (show_range_est && car_data.est_battery_range > -1) { 
					batteryCurrentCharge = ""+Math.floor(car_data.est_battery_range)+car_data.distance_label;
				} 			
				if (batteryCurrentCharge.length>0){			
					let batteryCurrentRangeTxt = stack.addText(batteryCurrentCharge)
					batteryCurrentRangeTxt.textColor = new Color(colors.text.primary);
					batteryCurrentRangeTxt.textOpacity = 0.6
					batteryCurrentRangeTxt.font = Font.systemFont(12)
					batteryCurrentRangeTxt.centerAlignText()
				}
	
			}
		}
	
	
	
		if (car_data.car_state == "Charging"){
			if (show_battery_percentage || show_range){
				let carChargingSpacer2 = stack.addSpacer(null);
			}


			// currently charging
			minutes = Math.round((car_data.time_to_charge - Math.floor(car_data.time_to_charge)) * 12) * 5;
			if (minutes < 10) {minutes = "0" + minutes}

			chargingSymbol = this.getChargerConnectedIcon();

			let carControlIconBolt = stack.addImage(chargingSymbol);
			carControlIconBolt.imageSize = scaleImage(chargingSymbol.size,12);
			carControlIconBolt.tintColor = new Color(colors.text.primary);
			carControlIconBolt.imageOpacity = 0.8;
		
			let carChargeCompleteTime = stack.addText(" "+Math.floor(car_data.time_to_charge)+":"+minutes);
			carChargeCompleteTime.textColor = new Color(colors.text.primary);
			carChargeCompleteTime.font = Font.systemFont(12);
			carChargeCompleteTime.textOpacity = 0.6;

			stack.setPadding(5,5,0,5);
			
		} else if (car_data.charger_attached){
			// car is connected to charger, but not charging
			if (show_battery_percentage || show_range){
				let carChargingSpacer2 = stack.addSpacer(null);
			}
			chargingSymbol = this.getChargerConnectedIcon();
			let carControlIconBolt = stack.addImage(chargingSymbol);
			carControlIconBolt.imageSize = scaleImage(chargingSymbol.size,12);
			carControlIconBolt.tintColor = new Color(colors.text.disabled);
			carControlIconBolt.imageOpacity = 0.6;
		}
		
	}

	{ // helper functions to draw things for range info

		theme.getChargerConnectedIcon = function(){
			lockSymbol = SFSymbol.named("bolt.circle");
			return lockSymbol.image;
		}
	}

	theme.drawBatteryBar = function(widget,car_data,colors,widgetSize){
		let stack = widget.addStack();
		stack.size = new Size(widgetSize.width,widgetSize.height*0.20);
		stack.topAlignContent();
		stack.setPadding(3,0,0,0);
	
		let batteryBarImg = stack.addImage(battery_bar.draw(car_data,colors,widgetSize));
		//batteryBarImg.imageSize = scaleImage(batteryBarImg.size,(widgetSize.height)*0.20);
		//batteryBarImg.imageSize = new Size(130,20)
		batteryBarImg.centerAlignImage();
	
		
	}


	var battery_bar = { // battery bar draw functions
		scale:3,
		batteryPath:new Path(),
		batteryPathInset:new Path(),
		width:widgetSize.width-6,
		height:24*3,
		init:function(){
		},
		draw:function(car_data,colors,widgetSize){
			this.width = (widgetSize.width-6)*3;
			this.batteryPath.addRoundedRect(new Rect(1*this.scale,1*this.scale,this.width,this.height),8*this.scale,8*this.scale);
			this.batteryPathInset.addRoundedRect(new Rect(2*this.scale,2*this.scale,this.width-2*this.scale,this.height-2*this.scale),5*this.scale,5*this.scale);

			let myDrawContext = new DrawContext();
			myDrawContext.opaque = false;
			myDrawContext.size = new Size(this.width+2*this.scale,this.height+2*this.scale);
		
			this.drawStart(car_data,colors,widgetSize,myDrawContext);

			this.drawMaxCharge(car_data,colors,widgetSize,myDrawContext);
			this.drawUsableBattery(car_data,colors,widgetSize,myDrawContext);
			this.drawText(car_data,colors,widgetSize,myDrawContext);
			
			this.drawEnd(car_data,colors,widgetSize,myDrawContext);

		
			return myDrawContext.getImage(); // return our final image

		
		},
		drawStart:function(car_data,colors,widgetSize,myDrawContext){
			// draw the background
			myDrawContext.addPath(this.batteryPath);
			myDrawContext.setFillColor(new Color(colors.battery.background));
			myDrawContext.fillPath();		
		},
		drawMaxCharge:function(car_data,colors,widgetSize,myDrawContext){
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
		},
		drawUsableBattery:function(car_data,colors,widgetSize,myDrawContext){
		
			let usable_battery_level = Number(car_data.usable_battery_level);
		
			// draw the cold battery (if needed)
			if (usable_battery_level+1 < car_data.battery_level && car_data.battery_level > 1){ // draw the cold battery if it's cold enough.
				let unavailableCharge = new DrawContext()  ;
				unavailableCharge.opaque = false;
				unavailableCharge.size = new Size(this.width*car_data.battery_level/100,this.height);

				unavailableCharge.setFillColor(new Color(colors.battery.cold_charge));
				unavailableCharge.addPath(this.batteryPath);
				unavailableCharge.fillPath();

				myDrawContext.drawImageAtPoint(unavailableCharge.getImage(),new Point(0,0));
			
				usable_battery_level -= 1; // shave a little off so the cold battery display isn't just a sliver of blue.
			}
		
			// draw the available charge
			if (usable_battery_level>1){
				// if there's at least some battery, build the current charge state bar
				let availableCharge = new DrawContext()  ;
				availableCharge.opaque = false;
				availableCharge.size = new Size(this.width*usable_battery_level/100,this.height);

				if (usable_battery_level < 21 && car_data.car_state != "Charging"){ // draw the available battery in yellow if it's under 20%
					availableCharge.setFillColor(new Color(colors.battery.low_charge));			
				} else {
					availableCharge.setFillColor(new Color(colors.battery.usable_charge));				
				}
				availableCharge.addPath(this.batteryPath);
				availableCharge.fillPath();
							
				myDrawContext.drawImageAtPoint(availableCharge.getImage(),new Point(0,0));
			
			
			}
		},
		drawText:function(car_data,colors,widgetSize,myDrawContext){
		
			let usable_battery_level = Number(car_data.usable_battery_level);

			let text_to_draw = "";

			if (show_battery_percentage){
				text_to_draw = usable_battery_level+"%";
			} else {
				text_to_draw = ""+Math.floor(car_data.battery_range)+car_data.distance_label;
				if (show_range_est && car_data.est_battery_range > -1) { 
					text_to_draw = ""+Math.floor(car_data.est_battery_range)+car_data.distance_label;
				} 			

			}
			// draw battery percentage
			myDrawContext.setTextColor(new Color(colors.text.primary));
			myDrawContext.setFont(Font.systemFont(14*this.scale));
			myDrawContext.setFontSize(14*this.scale);
			if (usable_battery_level>35){
				// draw inside the battery
				myDrawContext.setTextAlignedRight();
				myDrawContext.drawTextInRect(text_to_draw,new Rect(0,4.25*this.scale,this.width*usable_battery_level/100-(4*this.scale),this.height-8*this.scale));
			} else {
				if (car_data.car_state != "Charging") {myDrawContext.setTextColor(new Color(colors.text.inverted));} // invert the color if we're not charging.
				myDrawContext.setTextAlignedLeft();
				myDrawContext.drawTextInRect(text_to_draw,new Rect(this.width*usable_battery_level/100+(4.25*this.scale),4*this.scale,this.width-(this.width*usable_battery_level/100),this.height-8*this.scale));		
			}


		},
		drawEnd:function(car_data,colors,widgetSize,myDrawContext){
			// add a final stroke to the whole thing
			let usable_battery_level = Number(car_data.usable_battery_level);

			if (Number(car_data.battery_level)<99){
				myDrawContext.setFillColor(new Color(colors.battery.separator));
				myDrawContext.fillRect(new Rect(this.width*car_data.battery_level/100,1,1,this.height-1));
				if (usable_battery_level < car_data.battery_level){
					myDrawContext.fillRect(new Rect(this.width*usable_battery_level/100,1,1,this.height-1))
				}
			}


			myDrawContext.addPath(this.batteryPath);// have to add the path again for some reason
			myDrawContext.setStrokeColor(new Color(colors.battery.border));
			myDrawContext.setLineWidth(1.5*this.scale);
			myDrawContext.strokePath();
		
		}
	
	}
	battery_bar.init();
}



if (APItype == "" || APItype == "TeslaFi"){
	// Add some backward compatibility to TeslaFi (if the APIurl is just a token, then assume it's a TeslaFi API key, otherwise, just use the URL
	if (APIurl != null && APIurl != "" && !(APIurl.match(/\./g) || []).length){
		APIkey = APIurl;
		APIurl = "https://www.teslafi.com/feed.php?token="+APIurl+"&command=lastGood&encode=1";
	}

	if (APIurl != null && APIurl != "" && (APIurl.match(/teslafi/gi) || []).length){
		car_data.source = "TeslaFi"
	}
}


if (config.runsInWidget || args.queryParameters.widget != null){
	// Start processing our code (load the car data, then render)
		
	if (typeof APIurl === 'undefined'){APIurl = "";}
	let response = await loadCarData(APIurl)	

	addMapArea(); // after loading car data we can decide if we can display the map


	if (response == "ok"){
		let widget = await createWidget(car_data,colors);
		Script.setWidget(widget);
		presentWidget(widget);
		Script.complete();
	} else {
		let widget = errorWidget(response);
		Script.setWidget(widget);
		presentWidget(widget);
		Script.complete();
	}
} else {
	await showConfig();
	Script.complete();
}

function presentWidget(widget){
	switch (debug_size){
		case "medium":
			widget.presentMedium();
			break;
		case "large":
			widget.presentLarge();
			break;
		case "small":
		default:
			widget.presentSmall();		
			break;
	}	
}

async function createWidget(car_data,colors) {
	themeDebugArea();
	
	let td_theme = FileManager.iCloud()
	
	// create the themes directory if needed (so the user doesn't have to do this)
	theme_file = td_theme.joinPath(td_theme.documentsDirectory(),"tesla_data");
	if (!td_theme.isDirectory(theme_file)){
		// create the directory
		td_theme.createDirectory(theme_file);
	}
	
	if ((custom_theme != "" && custom_theme != "none") || custom_theme != null){
		// load a custom theme
		theme_file = td_theme.joinPath(td_theme.documentsDirectory(),"tesla_data/themes/"+custom_theme+".js");

		if (td_theme.fileExists(theme_file)){
			td_theme.downloadFileFromiCloud(theme_file);
			eval(td_theme.readString(theme_file));
		}
	}
	
	let w = new ListWidget()
	theme.init();
	await theme.draw(w,car_data,colors);
	
	
	return w
}

function errorWidget(reason){
	let w = new ListWidget()
	
	drawErrorWidget(w,reason);

  return w
}
 
 function drawErrorWidget(w,reason){
	w.setPadding(5,5,5,5)
	let myGradient = new LinearGradient()

	w.backgroundColor = new Color("#933")
	myGradient.colors = [new Color("#44444466"), new Color("#88888855"), new Color("#66666655")]
	myGradient.locations = [0,0.8,1]
	w.backgroundGradient = myGradient
	
	
	let title = w.addText("Error")
	title.textColor = Color.white()
	title.font = Font.semiboldSystemFont(30)
	title.minimumScaleFactor = 0.5

	let reasonText = w.addText(reason)
	reasonText.textColor = Color.white()
	reasonText.minimumScaleFactor = 0.5
 
 }
 
async function loadCarData(url) {
 
	if (url != null && url != ""){
 
		// get the data from APIurl, then build our internal car_data object
		var req = await new Request(url);
		var backupManager = FileManager.local();
		var backupLocation = backupManager.joinPath(backupManager.libraryDirectory(), "tesla_data.txt")


		if (debug_data==""){
			try{
				var json = await req.loadJSON();		
				if (json.response == null){
					var jsonExport = JSON.stringify(json);
					backupManager.writeString(backupLocation,jsonExport);
				}
							
			}catch(e){
				// offline, grab the backup copy
				var jsonImport = backupManager.readString(backupLocation);
				var json = JSON.parse(jsonImport);
			}
		} else {
			// TeslaFi only allows 3 API calls per minute, so during testing, we can just pull test data from iCloud
			
			let debugManager = FileManager.iCloud();
			debug_file = debugManager.joinPath(debugManager.documentsDirectory(),"tesla_data/debug_data/"+debug_data+".json");

			if (debugManager.fileExists(debug_file)){
				debugManager.downloadFileFromiCloud(debug_file);
				var json = await JSON.parse(debugManager.readString(debug_file));
			} else {
				var json = {"response":{"result":"That debug file doesn't exist"}};
			}
		}
	} else {
		var json = getSampleData(); // the user hasn't provided a url, so we'll show sample data
		var now = new Date();
		now.setTime(now.getTime() + 60000*5);
		json.Date = now.toISOString();
		//console.log(json);
	}
	
	
	//logError(json);
	
	//process any of the items

	if (json.response == null){

		// go through our data and normalize/clean up things so they're ready to be used.

		// required data
		if (json.usable_battery_level != null && json.usable_battery_level > 0) 
			{car_data.usable_battery_level = Math.floor(json.usable_battery_level);} 
				else 
			{car_data.usable_battery_level = Math.floor(json.battery_level);}

		if (json.charge_limit_soc  != null){car_data.battery_limit = json.charge_limit_soc ;}
		
		//optional data
		if (json.display_name  != null){car_data.car_name = json.display_name ;}
		if (json.battery_level != null){car_data.battery_level = Math.floor(json.battery_level);}
		if (json.battery_range != null){car_data.battery_range = Math.floor(json.battery_range);}
		if (json.est_battery_range != null){car_data.est_battery_range = Math.floor(json.est_battery_range);}
		if (json.measure != null){car_data.distance_label = (json.measure == "imperial")?"mi":"km";}
		if (json.carState  != null){car_data.car_state = json.carState ;}
		if (json.sentry_mode != null){car_data.sentry_mode = (json.sentry_mode == 1);}
		if (json.locked  != null){car_data.doors_locked = (json.locked == 1) ;}
		if (json.is_climate_on  != null){car_data.climate_active = (json.is_climate_on == 1) ;}
		if (json.temperature != null){car_data.temp_label = (json.temperature == "F")?"f":"c";}
		if (json.inside_temp != null){car_data.inside_temp = Math.floor((car_data.temp_label == "c")?json.inside_temp:json.inside_temp*1.8+32);}
		if (json.driver_temp_setting  != null){car_data.temp_setting = Math.floor((car_data.temp_label == "c")?json.driver_temp_setting:json.driver_temp_setting*1.8+32);}
		if (json.time_to_full_charge  != null){car_data.time_to_charge = json.time_to_full_charge ;}
		if (json.fast_charger_type  != null){car_data.charger_attached = (json.fast_charger_type != "<invalid>") ;}

		if (json.longitude != null){car_data.longitude = json.longitude;}
		if (json.latitude != null){car_data.latitude = json.latitude;}

		if (json.Date != null){
			let lastUpdate = new Date(json.Date.replace(" ","T"))
			let now = new Date()
			timeDiff = Math.round((Math.abs(now - lastUpdate))/(1000 * 60))
			if (timeDiff < 60) {
				// been less than an hour since last update
				car_data.last_contact = timeDiff+"m ago"
			} else if(timeDiff < 1440){
				car_data.last_contact = Math.floor(timeDiff/60)+"h ago"
			} else {
				car_data.last_contact = Math.floor(timeDiff/1440)+"d ago"
			}
			if (timeDiff/60 > 2){
				car_data.data_is_stale = true; // data is more than 2 hours old.
			}
		}
	
		car_data.postLoad(json);
	
		return "ok";
	} else {
		return json.response.result
	}
}


// utility functions

function scaleLines(lineArray,maxHeight,offsetX,offsetY){
		//scale an array of lines and make it an array of scaled Points
		let pointArray = [];
		let scaleFactor = 0;
		for(var i = 0;i<lineArray.length;i++){
			if (lineArray[i][1] > scaleFactor){scaleFactor = lineArray[i][1];}
			//console.log(i+" : "+scaleFactor);
		}
		scaleFactor = maxHeight/scaleFactor;
		for(var i = 0;i<lineArray.length;i++){
			pointArray[pointArray.length] = new Point(lineArray[i][0]*scaleFactor+offsetX,lineArray[i][1]*scaleFactor+offsetY);
		}
		return pointArray;	
}

function scaleImage(imageSize,height){
	scale = height/imageSize.height
	return new Size(scale*imageSize.width,height)
}

function computeWidgetSize(widgetPadding){
	deviceScreen = Device.screenSize()
	var icon_size = 110;
	let gutter_size = ((deviceScreen.width - 240) /5); // if we know the size of the screen, and the size of icons, we can estimate the gutter size
	if (Device.isPad()){
		// the ipad has 2 more icons accrss, but widgets are only 1 icon in size
		width = deviceScreen.width;
		if (deviceScreen.height > width) { width = deviceScreen.height;}
		icon_size = 55;
		gutter_size = ((deviceScreen.width - 360) /7);
	}

	var extra_size = 10 - widgetPadding;

	var widgetSize = new Size(gutter_size + icon_size+extra_size, gutter_size + icon_size+extra_size); // small widget size
	widgetSize.gutter_size = gutter_size;

	var widgetSizing = debug_size;		
	if (config.widgetFamily != null){
		widgetSizing = config.widgetFamily;
	}
	switch (widgetSizing){
		case "medium":
			widgetSize = new Size(gutter_size*3 + (icon_size*2) + extra_size, gutter_size + icon_size + extra_size); // medium widget size
			break;
		case "large":
			widgetSize = new Size(gutter_size*3 + (icon_size*2) + extra_size, gutter_size*3 + (icon_size*2) + extra_size); // large widget size
			break;	
	}



	return widgetSize
}




function getSampleData(){
	return {
	   "response":null,
	   "battery_level":27,
	   "usable_battery_level":26,
	   "charge_limit_soc":90,
	   "carState":"Idling",
	   "Date":"2020-10-28T14:57:15Z",
	   "sentry_mode":0,
	   "display_name":"No Source",
	   "locked":1,
	   "is_climate_on":0,
	   "inside_temp":14.6,
	   "driver_temp_setting":22.0,
	   "measure":"km",
	   "est_battery_range":90.605842,
	   "battery_range":125.2227454,
	   "time_to_full_charge":0.0,
	   "fast_charger_type":"<invalid>"
	}
}


async function showConfig(){
	// Show the config screen inside of Scriptable


	online_version_url = "https://raw.githubusercontent.com/DrieStone/TeslaData-Widget/main/documentation/version.js";

	req = new Request(online_version_url);
	versioning_string = await req.loadString();
	eval(versioning_string);
	
	var version_message;
	//console.error(online_version+" : "+this_version);
	
	var version_message = "";
	
	if (this_version < online_version){
		version_message = "<div class=\"nva\">There is a new version of TeslaData available.</div>"
	}


	var paramString = "";
	// if there are arguments, update our values
	//console.error(args.queryParameters); 
	if (args.queryParameters.APItypeSelect != null){
		switch (args.queryParameters.APItypeSelect){
			case "Other":
				APItype = "Other";
				APIurl = args.queryParameters.APIurl;
				paramString += "APIurl = \""+APIurl+"\";\n";
				paramString += "APItype = \""+APItype+"\";\n";
				break;
			case "Tesla":
				APItype = "Tesla";
				Tesla_Email = args.queryParameters.tesla_email;
				Tesla_Password = args.queryParameters.tesla_password;
				paramString += "Tesla_Email = \""+Tesla_Email+"\";\n";
				paramString += "Tesla_Password = \""+Tesla_Password+"\";\n";
				paramString += "APItype = \""+APItype+"\";\n";
			
				break;
			case "TeslaFi":
			default:
				APItype = "TeslaFi";
				APIkey = APIurl = args.queryParameters.APIkey;
				paramString += "APIurl = \""+APIkey+"\";\n";
				paramString += "APItype = \""+APItype+"\";\n";		
				break;
		}
	
		if (args.queryParameters.show_map == "yes"){
			hide_map = false;
			paramString += "hide_map = false;\n";
		} else {
			hide_map = true;
			paramString += "hide_map = true;\n";		
		}

		paramString += "custom_theme = \""+args.queryParameters.theme+"\";\n";
		custom_theme = args.queryParameters.theme;


		if (args.queryParameters.battery_percentage == "yes"){
			show_battery_percentage = true;
			paramString += "show_battery_percentage = true;\n";
		} else {
			show_battery_percentage = false;
			paramString += "show_battery_percentage = false;\n";		
		}

		if (args.queryParameters.show_range == "yes"){
			show_range = true;
			paramString += "show_range = true;\n";
		} else {
			show_range = false;
			paramString += "show_range = false;\n";		
		}

		if (args.queryParameters.show_range_est == "yes"){
			show_range_est = true;
			paramString += "show_range_est = true;\n";
		} else {
			show_range_est = false;
			paramString += "show_range_est = false;\n";		
		}

		if (args.queryParameters.show_data_age == "yes"){
			show_data_age = true;
			paramString += "show_data_age = true;\n";
		} else {
			show_data_age = false;
			paramString += "show_data_age = false;\n";		
		}
	
		if (args.queryParameters.MapKey != null && args.queryParameters.MapKey != ""){
			mapKey = args.queryParameters.MapKey;
			paramString += "mapKey = \""+args.queryParameters.MapKey+"\";\n";		
		}
	
		if (args.queryParameters.mapChoice == "Google"){
			useGoogleMaps = true;
			paramString += "useGoogleMaps = true;\n";
		} else {
			useGoogleMaps = false;
			paramString += "useGoogleMaps = false;\n";		
		}

		// save parameters from a file on iCloud
		let additional_manager = FileManager.iCloud()		
		api_file = additional_manager.joinPath(additional_manager.documentsDirectory(),"tesla_data/parameters.js");
		additional_manager.writeString(api_file,paramString);

	} else {

		// load parameters from a file on iCloud (shouldn't need to do this since it should have been done earlier in code
		/*let additional_manager = FileManager.iCloud()		
		api_file = additional_manager.joinPath(additional_manager.documentsDirectory(),"tesla_data/parameters.js");

		if (additional_manager.fileExists(api_file)){
			additional_manager.downloadFileFromiCloud(api_file);
			eval(additional_manager.readString(api_file));
		}*/
	}
	// Now our values should be set correctly
	
	if (typeof APIurl === 'undefined'){APIurl = "";}

	if (APIurl != null && APIurl != "" && !(APIurl.match(/\./g) || []).length){
		APIkey = APIurl;
		APIurl = "https://www.teslafi.com/feed.php?token="+APIurl+"&command=lastGood&encode=1";
	}


	// get a list of available themes from the themes directory
	let themeManager = FileManager.iCloud();
	themePath = themeManager.joinPath(themeManager.documentsDirectory(),"tesla_data/themes");
	themeList = themeManager.listContents(themePath);
	let i =0;
	let themeOptions = "";
	while (themeList[i]){
		if (custom_theme == (themeList[i].replace(/\.[^/.]+$/, ""))){
			themeOptions += '<option value="'+(themeList[i].replace(/\.[^/.]+$/, ""))+'" selected>'+(themeList[i].replace(/\.[^/.]+$/, ""))+'</option>';		
		} else {
			themeOptions += '<option value="'+(themeList[i].replace(/\.[^/.]+$/, ""))+'">'+(themeList[i].replace(/\.[^/.]+$/, ""))+'</option>';
		}
		i++;
	}


	var mapChecked = "checked";
	var batteryPercentChecked = "checked";
	var rangeChecked = "checked";
	var APIrangeChecked = "checked";
	var ageChecked = "checked";
	var mapGoogleSelected = mapAppleSelected = "";

	if (hide_map){
		mapChecked = "";
	}
	if (!show_battery_percentage){
		batteryPercentChecked = "";
	}
	if (!show_range){
		rangeChecked = "";
	}
	if (!show_range_est){
		APIrangeChecked = "";
	}
	if (!show_data_age){
		ageChecked = "";
	}
	if (useGoogleMaps){
		mapGoogleSelected = " selected"
	} else {
		mapAppleSelected = " selected"
	}
	var teslaFiSelected = otherSelected = teslaSelected = showType = "";
	switch (APItype){
		case "TeslaFi":
			teslaFiSelected = " selected";
			showType="showteslaFi";
			break;
		case "Other":
			otherSelected = " selected";
			showType="showother";
			break;	
		case "Tesla":
			teslaSelected = " selected";
			showType="showtesla";
			break;
	
	}

	// HTML
	var html=`

	<html>
	<head>
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<style>
		body{
			font-family:sans-serif;
			font-size:12pt;
		}
 
	
	
		select option, select{
			font-size:12pt;
			flex:1;
			padidng:5px;
			margin-left:5px;
		}

		label{
			display:block;
			padding:5px;
			display:flex;
		}
	
		input[type=text]{
			padding:3px;
			font-size:12pt;
			flex:1;
			margin-left:5px;
			margin-top:-5px;
		}
	
		fieldset{
			border-color:#ccc;
			padding:5px;
			margin:5px;
			border-width:1px;
			border-style:solid;
			display:block;
		}
	
		.updated_options{
			background-color:green;
			color:white;
			text-align:center;
			font-weight:bold;
			padding:10px;
			margin:5px;
			display:none;
		}
	
		.APItype{
			display:none;
		}
	
		.showteslaFi fieldset#teslaFi,
		.showother fieldset#other,
		.showtesla fieldset#tesla{
			display:block;
		}
	
		.submit, .debug {
			-webkit-appearance: none;
			background-color:#007AFF;
			color:#fff;
			font-weight:bold;
			border: solid #666 1px;
			font-size: 14px;
			display:block;
			width:100%;
			padding:10px;
			text-align:center;
		}
	
		.debug{
			width:25%;
			text-decoration: none;
			display:inline-block;
			margin:2px;
			background-color:#ddd; 
			color:#000;

		}
	
		.debug_title{
			font-weigh:bold;
			text-align:center;
			background-color:#777;
			color:white;
			padding:3px;;
		}
	

	
		.nva {
			padding:20px;
			border:1px solid #ccc;
			margin:5px;
			text-align:center;
			background-color:#ff4;
		}
	
	</style>

	</head>
	<body class="">
	${version_message}
	<div class="updated_options">Options Updated</div>
	<form action="scriptable:///run/${scriptName}" method="get" >
	<fieldset>
		<legend>API (required)</legend>
		<label for="API">API
		<select name="APItypeSelect" onchange="changeAPI(this);">
			<option value="TeslaFi" ${teslaFiSelected}>TeslaFi</option>
			<option value="Other" ${otherSelected}>Generic JSON</option>
			<option value="Tesla" ${teslaSelected}>Direct Car Connection*</option>
		</select></label>
	</fieldset>
	<span id="APItype" class="${showType}">
		<fieldset class="APItype" id="teslaFi">
			<label>API Key
			<input name="APIkey" type="text" placeholder="TeslaFi API Key" value="`+APIkey+`"/></label>
		</fieldset>
		<fieldset class="APItype"  id="other">
			<label>API Url
			<input name="APIurl" type="text" placeholder="API Key" value="`+APIurl+`"/></label>
		</fieldset>
		<fieldset class="APItype"  id="tesla">
			<label>Email
			<input type="text" name="tesla_email" placeholder="Email" value="`+Tesla_Email+`"/></label>
			<label>Password
			<input type="text" name="tesla_password" placeholder="Password" value="`+Tesla_Password+`"/></label>
		</fieldset>
	</span>
	<hr/>

		<label for="Theme">Theme
		<select name="theme">
			<option value="none">Default</option>
			`+themeOptions+`
		</select></label>


	<fieldset>
		<legend>Map Options</legend>
		<label><input name="show_map" value="yes" type="checkbox" ${mapChecked}/>Show Map where available</label>
		<label>Map API Key <input name="MapKey" type="text" placeholder="Map API Key" value="${mapKey}" /></label>
		<label>Map to Open on tap <select name="mapChoice"><option value="Google" ${mapGoogleSelected}>Google Maps</option><option value="Apple" ${mapAppleSelected}>Apple Maps</option></select></label>
	</fieldset>

	<fieldset>
		<legend>Other Options</legend>
		<label><input name="battery_percentage" value="yes" type="checkbox" ${batteryPercentChecked}/>Percentage in bar</label>
		<label><input name="show_range_est" value="yes" type="checkbox" ${APIrangeChecked}/>Use API range instead of Car range</label>
	</fieldset>

		<input class="submit" type="submit" value="Update Options" onclick="saveData();">
	</form>
	<p>*Your Tesla account information is stored on your device and only transmitted to authenticate with your vehicle to get a key from Tesla once in a while.</p>
	<div>
	<p class="debug_title">Load Debug Widget</p>
	<a class="debug" href="scriptable:///run/${scriptName}?widget=small">Small</a>
	<a class="debug" href="scriptable:///run/${scriptName}?widget=medium">Medium</a>
	<a class="debug" href="scriptable:///run/${scriptName}?widget=large">Large</a>
	<p>TeslaData version ${this_version}</p>
	</div>
	<script type="text/javascript">
		function changeAPI(selectList){
			document.getElementById("APItype").className = 'show'+selectList.value;
		}

	</script>

	</body>
	</html>

	`

	// WebView
	WebView.loadHTML(html, null, new Size(0, 100));
	
}




function themeDebugArea(){
	// This is a working area for theme development (so errors will give you correct line numbers
	// Once you've finished, move your code to a JS file in the tesla_data folder








}

