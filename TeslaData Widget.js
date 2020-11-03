// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: charging-station;

// TeslaData Widget
// Version 1.5
// Jon Sweet (jon@driestone.com)
// Tobias Merkl (@tabsl)
//
// This pulls data from a given API, eg. TeslaFi, Teslalogger, Tronity to display a widget on your iPhone
// 
// TelsaFi Notice:
// This is better than other methods because TeslaFi tries to encourage your car to sleep to reduce phantom battery drain. Using this script will not directly connect to the car to respect the sleep status.
// Notice that there is ~5 minute lag for data. The data may be stale because TeslaFi won't wake the car to get data. I've added a display so you can see how old the data is. The should (normally) be minutes except when the car is sleeping.

let APIurl = args.widgetParameter;

/* Although you can change these options here, it's recommended that you make changes in the parameters.js file instead. */
{
	var show_battery_percentage = true; // show the battery percentage above the battery bar
	var show_range = true; // show the estimated range above the battery bar
	var show_range_est = true; // show range estimated instead of the car's range estimate
	var show_data_age = false; // show how stale the data is
	var custom_theme = ""; // if you want to load a theme (some available themes are "3d")

	var debug_data = ""; // this will force the widget to pull data from iCloud json files (put sample JSON in the themes directory)

	var debug_size = "small"; // which size should the widget try to run as when run through Scriptable. (small, medium, large)

	// You can embed your APIurl here, or add it as a widget parameter
	//APIurl = "YOUR_API_URL" // hardcode the API url
}

// set up all the colors we want to use
var colors = {
	background:"#dddddd",
	background_status:"#ffffff33",
	text:{		
		primary:"#333333cc",
		disabled:"#33333344"
	},
	battery:{
		background:"#33333355",
		max_charge:"#00000033",
		charging:"#ddbb22",
		cold_charge:"#3172D4",//"#3172D4",
		usable_charge:"#2BD82E",
		highlight:"#ffffff",
		border:"#333333cc",
		separator:"#333333cc"
	},
	icons:{
		default:"#33333399",
		disabled:"#33333344",
		charging_bolt:"#ddbb22",
		charging_bolt_outline:"#33333388",
		sentry_dot:"#ff0000",
		climate_hot:"#ff0000",
		climate_cold:"#0000ff"
	}
}

if (Device.isUsingDarkAppearance() && false){ 
	// Dark mode is not supported (this always returns true). 
	// This is in here in the hope that Scriptable will support dark mode at some point in the future.
	
	// override colors for darkmode
	
	colors.background = "#333333";

	colors.text.primary = "#ffffffaa";
	colors.text.disabled = "#ffffff33";

	colors.battery.background = "#cccccc22";
	colors.battery.max_charge = "#ffffff11";
	colors.battery.border = "#cccccc55";
	colors.battery.usable_charge = "#2B972D";
	//colors.battery.cold_charge = "#557BB4";
	colors.battery.highlight = "#ffffff44";

	colors.icons.default = "#ffffff99";
	colors.icons.disabled = "#ffffff44";
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

// load parameters from a file on iCloud
let additional_manager = FileManager.iCloud()		
api_file = additional_manager.joinPath(additional_manager.documentsDirectory(),"tesla_data/parameters.js");

if (additional_manager.fileExists(api_file)){
	additional_manager.downloadFileFromiCloud(api_file);
	eval(additional_manager.readString(api_file));
}

// a little helper to try to estimate the size of the widget in pixels
var widgetSize = computeWidgetSize();

var theme = {
	small:{
		available:true,
		init:function(){
		
		},
		draw:async function(widget,car_data,colors){
			widget.setPadding(5,5,5,5)
			
			widget.backgroundColor = new Color(colors.background)
			
			theme.drawCarStatus(widget, car_data, colors,widgetSize);
			theme.drawCarName(widget, car_data, colors,widgetSize);
			theme.drawStatusLights(widget, car_data, colors,widgetSize);
			theme.drawRangeInfo(widget, car_data, colors,widgetSize);
			theme.drawBatteryBar(widget, car_data, colors,widgetSize);

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

theme.drawCarStatus = function(widget,car_data,colors,widgetSize){
	let stack = widget.addStack();
	stack.size = new Size(widgetSize.width,widgetSize.height*0.20);
	stack.topAlignContent();
	stack.setPadding(0,6,0,6);

	let timeDiff = 0
	if (car_data.last_contact.length > 0){
		let lastUpdateText = stack.addText(car_data.last_contact)
		lastUpdateText.textColor = new Color(colors.text.primary);
		lastUpdateText.textOpacity = 0.4
		lastUpdateText.font = Font.systemFont(12)
		lastUpdateText.leftAlignText()
	
	}
	let carStateSpacer = stack.addSpacer(null)
	if (car_data.sentry_mode){
		sentryModeIcon = this.getSentryModeIcon(colors);
		var carState = stack.addImage(sentryModeIcon);
		carState.imageSize = scaleImage(sentryModeIcon.size,20)
		carState.rightAlignImage()
	} switch (car_data.car_state){
		case "Sleeping":{
			sleepingIcon = this.getSleepingIcon(colors);
			var carState = stack.addImage(sleepingIcon);
			carState.tintColor = new Color(colors.icons.default);
			carState.imageSize = scaleImage(sleepingIcon.size,20);
			carState.rightAlignImage();
			break;
		}
		case "Idling":{
			idlingIcon = this.getIdlingIcon(colors);
			var carState = stack.addImage(idlingIcon);
			carState.tintColor = new Color(colors.icons.default);
			carState.imageSize = scaleImage(idlingIcon.size,20);
			carState.rightAlignImage();
			break;
		}
		case "Driving":{
			drivingIcon = this.getDrivingIcon(colors);
			var carState = stack.addImage(drivingIcon);
			carState.tintColor = new Color(colors.icons.default);
			carState.imageSize = scaleImage(drivingIcon.size,20);
			carState.rightAlignImage();
			break;
		}
		case "Charging":{	
			chargingIcon = this.getChargingIcon(colors);
			var carState = stack.addImage(chargingIcon);
			carState.imageSize = scaleImage(chargingIcon.size,20);
			carState.rightAlignImage();
			break;
		}
		default:{
			
		}
		
	}

}

{ // helper functions to draw things for car status

	theme.getSleepingIcon = function(colors){
		symbolToUse = "moon.zzz.fill";
		let statusSymbol = SFSymbol.named(symbolToUse);
		return statusSymbol.image;
	}

	theme.getIdlingIcon = function(colors){
		symbolToUse = "p.square.fill";
		let statusSymbol = SFSymbol.named(symbolToUse);
		return statusSymbol.image;
	}

	theme.getDrivingIcon = function(colors){
		symbolToUse = "car.fill";
		let statusSymbol = SFSymbol.named(symbolToUse);
		return statusSymbol.image;
	}

	theme.getChargingIcon = function(colors){
		let iconHeight = 17;
		
		let carChargingImageContext = new DrawContext()  
		carChargingImageContext.opaque = false
		carChargingImageContext.size = new Size(12,iconHeight)

		let boltLines = [[5,0],[0,7],[3,7],[2,12],[7,5],[4,5]];
		const boltIcon = new Path()
		boltIcon.addLines(scaleLines(boltLines,iconHeight-2,1,1));
		boltIcon.closeSubpath()
		
		carChargingImageContext.addPath(boltIcon)
		carChargingImageContext.setLineWidth(2)
		carChargingImageContext.setStrokeColor(new Color(colors.icons.charging_bolt_outline))
		carChargingImageContext.strokePath()
		carChargingImageContext.addPath(boltIcon)
		carChargingImageContext.setFillColor(new Color(colors.icons.charging_bolt))
		carChargingImageContext.fillPath()

		return carChargingImageContext.getImage();

	}

	theme.getSentryModeIcon = function(colors){

		sentrySymbol = SFSymbol.named("sun.min.fill")
		sentrySymbolImage = sentrySymbol.image

		let sentryModeContext = new DrawContext()  
		sentryModeContext.opaque = false
		sentryModeContext.size = sentrySymbolImage.size
		sentryModeContext.imageOpacity = 0.8
		sentryModeContext.drawImageAtPoint(sentrySymbolImage,new Point(0,0))
		
		sentryModeContext.setFillColor(new Color(colors.icons.sentry_dot))
		sentryModeContext.fillEllipse(new Rect(6,6,7,7))		

		return sentryModeContext.getImage();
	}
}

theme.drawCarName = function(widget,car_data,colors,widgetSize){
	let stack = widget.addStack();
	stack.size = new Size(widgetSize.width,widgetSize.height*0.25);
	stack.centerAlignContent();
	stack.setPadding(0,3,5,3);
		
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
	stack.backgroundColor = new Color(colors.background_status);;
	stack.cornerRadius = 3;
	stack.centerAlignContent();
	
	if (car_data.doors_locked){
		var carControlLockIconImage = this.getLockedIcon();
	} else {
		var carControlLockIconImage = this.getUnlockedIcon();
	}
	let carControlLockIcon = stack.addImage(carControlLockIconImage);
	carControlLockIcon.imageSize = scaleImage(carControlLockIconImage.size,12)	
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
			if (car_data.inside_temp < car_data.temp_setting){
				// the car is heating
				carClimateControlIcon.tintColor = new Color(colors.icons.climate_hot);
			} else {
				carClimateControlIcon.tintColor = new Color(colors.icons.climate_cold);			
			}
			climateText += " ➝ "+car_data.temp_setting+"°";
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
	stack.setPadding(5,10,0,10);
	
	let batteryCurrentCharge = ""
	if (show_battery_percentage && car_data.usable_battery_level > -1){ 
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
	if (show_range && car_data.battery_range > -1){
		if (show_battery_percentage){ 
			let carChargingSpacer1 = stack.addSpacer(null)		
		}
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
		lockSymbol = SFSymbol.named("bolt.circle.fill");
		return lockSymbol.image;
	}
}

theme.drawBatteryBar = function(widget,car_data,colors,widgetSize){
	let stack = widget.addStack();
	stack.size = new Size(widgetSize.width,widgetSize.height*0.20);
	stack.topAlignContent();
	stack.setPadding(3,0,0,0);
	
	let batteryBarImg = stack.addImage(battery_bar.draw(car_data,colors,widgetSize));
	//batteryBarImg.imageSize = new Size(130,20)
	batteryBarImg.centerAlignImage()
	
		
}


var battery_bar = { // battery bar draw functions
	batteryPath:new Path(),
	batteryPathInset:new Path(),
	width:widgetSize.width-6,
	height:18,
	init:function(){
	},
	draw:function(car_data,colors,widgetSize){
		this.width = widgetSize.width-6;
		this.batteryPath.addRoundedRect(new Rect(1,1,this.width,this.height),7,7);
		this.batteryPathInset.addRoundedRect(new Rect(2,2,this.width-2,this.height-2),7,7);

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
			
			usable_battery_level -= 1; // shave a little off so the cold battery display isn't just a sliver of blue.
		}
		
		// draw the available charge
		if (usable_battery_level>1){
			// if there's at least some battery, build the current charge state bar
			let availableCharge = new DrawContext()  ;
			availableCharge.opaque = false;
			availableCharge.size = new Size(this.width*usable_battery_level/100,this.height);

			availableCharge.setFillColor(new Color(colors.battery.usable_charge));
			availableCharge.addPath(this.batteryPath);
			availableCharge.fillPath();
							
			myDrawContext.drawImageAtPoint(availableCharge.getImage(),new Point(0,0));
		}

		if (Number(car_data.battery_level)<99){
			myDrawContext.setFillColor(new Color(colors.battery.separator));
			myDrawContext.fillRect(new Rect(this.width*car_data.battery_level/100,1,1,this.height-1));
			if (usable_battery_level < car_data.battery_level){
				myDrawContext.fillRect(new Rect(this.width*usable_battery_level/100,1,1,this.height-1))
			}
		}


		// add a final stroke to the whole thing
		myDrawContext.addPath(this.batteryPath);// have to add the path again for some reason
		myDrawContext.setStrokeColor(new Color(colors.battery.border));
		myDrawContext.setLineWidth(1);
		myDrawContext.strokePath();
		
		return myDrawContext.getImage(); // return our final image
		
	}
	
}
battery_bar.init();




// Add some backward compatibility to TeslaFi (if the APIurl is just a token, then assume it's a TeslaFi API key, otherwise, just use the URL
if (APIurl != null && APIurl != "" && !(APIurl.match(/\./g) || []).length){
	APIurl = "https://www.teslafi.com/feed.php?token="+APIurl+"&command=lastGood&encode=1";
}

if (APIurl != null && APIurl != "" && (APIurl.match(/teslafi/gi) || []).length){
	car_data.source = "TeslaFi"
}



// Start processing our code (load the car data, then render)
	
let response = await loadCarData(APIurl)	

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
	
	if (custom_theme != "" || custom_theme != null){
		// load a custom theme
		theme_file = td_theme.joinPath(td_theme.documentsDirectory(),"tesla_data/"+custom_theme+".js");

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
			
			let debugManager = FileManager.iCloud()
			debug_file = debugManager.joinPath(debugManager.documentsDirectory(),"tesla_data/"+debug_data+".json");

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
		if (json.usable_battery_level != null){car_data.usable_battery_level = json.usable_battery_level;}
		if (json.charge_limit_soc  != null){car_data.battery_limit = json.charge_limit_soc ;}
		
		//optional data
		if (json.display_name  != null){car_data.car_name = json.display_name ;}
		if (json.battery_level != null){car_data.battery_level = json.battery_level;}
		if (json.battery_range != null){car_data.battery_range = json.battery_range;}
		if (json.est_battery_range != null){car_data.est_battery_range = json.est_battery_range;}
		if (json.measure != null){car_data.distance_label = (json.measure == "imperial")?"mi":"km";}
		if (json.carState  != null){car_data.car_state = json.carState ;}
		if (json.sentry_mode != null){car_data.sentry_mode = (json.sentry_mode == 1);}
		if (json.locked  != null){car_data.doors_locked = (json.locked == 1) ;}
		if (json.is_climate_on  != null){car_data.climate_active = (json.is_climate_on == 1) ;}
		if (json.temperature != null){car_data.temp_label = (json.temperature == "F")?"f":"c";}
		if (json.inside_temp != null){car_data.inside_temp = (car_data.temp_label == "c")?json.inside_temp:json.inside_tempF;}
		if (json.driver_temp_setting  != null){car_data.temp_setting = (car_data.temp_label == "c")?json.driver_temp_setting:json.driver_temp_settingF ;}
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

function computeWidgetSize(){
	deviceScreen = Device.screenSize()
	let gutter_size = ((deviceScreen.width - 240) /5) // if we know the size of the screen, and the size of icons, we can estimate the gutter size
	var widgetSize = new Size(gutter_size + 110, gutter_size + 110) // small widget size
	widgetSize.gutter_size = gutter_size;

	var widgetSizing = debug_size;		
	if (config.widgetFamily != null){
		widgetSizing = config.widgetFamily;
	}
	switch (widgetSizing){
		case "medium":
			widgetSize = new Size(gutter_size*3 + 220, gutter_size + 110) // medium widget size
			break;
		case "large":
			widgetSize = new Size(gutter_size*3 + 220, gutter_size*3 + 220) // large widget size
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
	   "display_name":"No API Set",
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

function themeDebugArea(){
	// This is a working area for theme development (so errors will give you correct line numbers
	// Once you've finished, move your code to a JS file in the tesla_data folder
	
}
