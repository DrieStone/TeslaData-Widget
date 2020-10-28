// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: charging-station;

// TeslaData Widget
// Version 1.0
// Jon Sweet (jon@driestone.com)
// Tobias Merkl (@tabsl)
//
// This pulls data from a given API, eg. TeslaFi, Teslalogger, Tronity to display a widget on your iPhone
// 
// TelsaFi Notice:
// This is better than other methods because TeslaFi tries to encourage your car to sleep to reduce phantom battery drain. Using this script will not directly connect to the car to respect the sleep status.
// Notice that there is ~5 minute lag for data. The data may be stale because TeslaFi won't wake the car to get data. I've added a display so you can see how old the data is. The should (normally) be minutes except when the car is sleeping.

let APIurl = args.widgetParameter

const show_battery_percentage = true // show the battery percentage above the battery bar
const show_range = true // show the estimated range above the battery bar
const show_range_est = true // show range estimated instead of the car's range estimate
const battery_display_3D = false // show a 3D version of the battery bar
const show_data_age = true // show how stale the data is

// You can imbed your APIurl here, or add it as a widget parameter
//APIurl = "YOUR_API_URL" // hardcode the API url

const debugMode = false


let chargingColor = new Color("#ddbb22")

deviceScreen = Device.screenSize()
let padding = ((deviceScreen.width - 240) /5)
let widgetSize = new Size(padding + 110, padding + 110)

if (APIurl == null){
	let widget = errorWidget("TeslaData Widget API url required")
	Script.setWidget(widget)
	widget.presentSmall()
	Script.complete()

} else {
		
	let items = await loadItems()	

	if (items.response == null){
		if (config.runsInWidget || true) {
		  let widget = createWidget(items)
		  Script.setWidget(widget)
		  widget.presentSmall()
		  Script.complete()
		} else {
		  let item = items[0]
		  Safari.open(item.url)
		}
	} else {
		if (items.response.result == "unauthorized"){
			let widget = errorWidget("Invalid API url")
			Script.setWidget(widget)
			widget.presentSmall()
			Script.complete()
			
		} else {
			logError(items.response.result)
		}
	}
}

function createWidget(items) {
	let w = new ListWidget()
	w.setPadding(5,5,5,5)
	w.url = "remotes://" // this doesn't seem to work currently
	//w.url = "http://tesla.com"
	let myGradient = new LinearGradient()
	textColor = new Color("#333333cc")
	inactiveColor = new Color("#33333366")

	if (Device.isUsingDarkAppearance() && false){
		// darkmode
		w.backgroundColor = new Color("#333")
		myGradient.colors = [new Color("#bbbbbb11"), new Color("#ffffff00")]
		myGradient.locations = [0,0.3]
		textColor = new Color("#cccccccc")
		inactiveColor = new Color("#cccccc99")
	} else {
		// lightmode
		w.backgroundColor = new Color("#ccc")
		myGradient.colors = [new Color("#44444411"), new Color("#ffffff00")]
		myGradient.locations = [0,0.3]
	}
	w.backgroundGradient = myGradient

// BUILD BACKGROUND IMAGE (THIS DOESN'T WORK RIGHT NOW

/*	let backgroundContext = new DrawContext()
	backgroundContext.opaque = false
	backgroundContext.size = new Size(300,300)
	backgroundContext.setFillColor = new Color("#ff0000",0.3)
	backgroundContext.setStrokeColor = new Color("#ff0000",0.3)
	backgroundContext.setLineWidth(5)
	backgroundContext.fillEllipse(new Rect(0,0,75,100))
	backgroundContext.strokeRect(new Rect(20,20,100,100))
	w.backgroundImage = backgroundContext.getImage()
*/



//logError(items.usable_battery_level+"/"+items.battery_level)

// BUILD BATTERY BAR

	const batteryPath = new Path()
	batteryPath.addRoundedRect(new Rect(1,1,widgetSize.width-2,18),7,7)

	const batteryPathInset = new Path()
	batteryPathInset.addRoundedRect(new Rect(2,2,widgetSize.width-4,16),7,7)

	batteryAmount = Number(items.battery_level)*(widgetSize.width-2)/100
	usableBatteryAmount = Number(items.usable_battery_level)*(widgetSize.width-2)/100
	maxChargeAmount = Number(items.charge_limit_soc)*(widgetSize.width-2)/100

	let myDrawContext = new DrawContext()
	myDrawContext.opaque = false
	myDrawContext.size = new Size(widgetSize.width,20)

	myDrawContext.addPath(batteryPath)
	myDrawContext.setFillColor(new Color("#33333355"))
	myDrawContext.fillPath()

//	Build a bar for the max charge state as configured
	let batteryMaxCharge  = new DrawContext()  
	batteryMaxCharge.opaque = false
	batteryMaxCharge.size = new Size(maxChargeAmount,20)
	batteryMaxCharge.setFillColor(new Color("#00000033"))
	if (Device.isUsingDarkAppearance()){
		batteryMaxCharge.setFillColor(new Color("#ffffff33"))		
	}
	if (items.carState == "Charging"){
		batteryMaxCharge.setFillColor(chargingColor)
	}
	batteryMaxCharge.addPath(batteryPath)
	batteryMaxCharge.fillPath()
		
	batteryMaxChargeImage = batteryMaxCharge.getImage()
	myDrawContext.drawImageAtPoint(batteryMaxChargeImage,new Point(0,0))
	
	if (usableBatteryAmount < batteryAmount && usableBatteryAmount > 1){
		// if the battery is cold, then the usable amount is less than the total amount. 
		//logError("show usable")
		let batteryFullUnusable = new DrawContext()  
		batteryFullUnusable.opaque = false
		batteryFullUnusable.size = new Size(batteryAmount,20)

		batteryFullUnusable.setFillColor(new Color("#3172D4"))
		batteryFullUnusable.addPath(batteryPath)
		batteryFullUnusable.fillPath()

		myDrawContext.drawImageAtPoint(batteryFullUnusable.getImage(),new Point(0,0))
		usableBatteryAmount -= 3 // make the usable battery display a bit smaller so our blue bar isn't just a sliver
	}

	if (usableBatteryAmount>1){
		// if there's at least some battery, build the current charge state bar
		let batteryFull = new DrawContext()  
		batteryFull.opaque = false
		batteryFull.size = new Size(usableBatteryAmount,20)

		batteryFull.setFillColor(new Color("#2BD82E"))
		batteryFull.addPath(batteryPath)
		batteryFull.fillPath()



		let highlightWidth = usableBatteryAmount-10;
		if (highlightWidth>4 && battery_display_3D){

			const batteryHighlight = new Path()
			batteryHighlight.addRoundedRect(new Rect(5,6,usableBatteryAmount-8,3),1,1)

			batteryFull.setFillColor(new Color("#ffffff",0.3))
			batteryFull.addPath(batteryHighlight)
			batteryFull.fillPath()
			
			batteryFull.setFillColor(new Color("#ffffff",0.3))
			batteryFull.fillEllipse(new Rect(7,6,usableBatteryAmount/4,4))
			batteryFull.fillEllipse(new Rect(6,6,usableBatteryAmount/8,6))
			batteryFull.fillEllipse(new Rect(5,6,usableBatteryAmount/12,8))

			batteryFull.fillEllipse(new Rect(usableBatteryAmount-10,6,5,3))
	

		}


		if (battery_display_3D){
			batteryFull.addPath(batteryPathInset)
			batteryFull.setStrokeColor(new Color("#00000055"))
			batteryFull.setLineWidth(2)
			batteryFull.strokePath()
			myDrawContext.addPath(batteryPathInset)
			myDrawContext.setStrokeColor(new Color("#00000022"))
			myDrawContext.setLineWidth(4)
			myDrawContext.strokePath()
		}

		myFullBatteryImage = batteryFull.getImage()
		myDrawContext.drawImageAtPoint(myFullBatteryImage,new Point(0,0))

	if (Number(items.battery_level)<99){
			myDrawContext.setFillColor(inactiveColor)
			myDrawContext.fillRect(new Rect(batteryAmount,1,1,18))
			if (usableBatteryAmount != batteryAmount){
				myDrawContext.fillRect(new Rect(usableBatteryAmount,1,1,18))
			}
			
			if (battery_display_3D){
				myDrawContext.setFillColor(new Color("#00000022"))
				myDrawContext.fillRect(new Rect(batteryAmount+1,1,3,18))

			}

		}
	}


	myDrawContext.addPath(batteryPath)// have to add the path again for some reason
	myDrawContext.setStrokeColor(textColor)
	myDrawContext.setLineWidth(1)
	myDrawContext.strokePath()

	batteryBarData = myDrawContext.getImage()

// build that actual widget

	let wBody = w.addStack()
	wBody.layoutVertically()

// the car status (idle,charging,sleeping, sentry mode)
	let wState = w.addStack()
	wState.size = new Size(widgetSize.width,widgetSize.height*0.20)
	wState.topAlignContent()
	wState.setPadding(0,6,0,6)

// the car's name
	let wContent = w.addStack()
	wContent.size = new Size(widgetSize.width,widgetSize.height*0.25)
	wContent.centerAlignContent()
	wContent.setPadding(0,3,5,3)

// the various status lights (locked, interior temp)
	let wControls = w.addStack()
	wControls.size = new Size(widgetSize.width,widgetSize.height*0.20)
	wControls.bottomAlignContent()
	wControls.backgroundColor = new Color("#ffffff33")
	wControls.cornerRadius = 3
	wControls.centerAlignContent()
	wControls.setPadding(3,10,3,10)

// the text of any range info
	let wRangeValue = w.addStack()
	wRangeValue.size = new Size(widgetSize.width,widgetSize.height*0.15)
	wRangeValue.centerAlignContent()
	wRangeValue.setPadding(5,10,0,10)

// the battery bar display
	let wBattery = w.addStack()
	wBattery.size = new Size(widgetSize.width,widgetSize.height*0.20)
	wBattery.topAlignContent()
	wBattery.setPadding(3,0,0,0)
	
// outline the stacks so we can see the layout if we're in debug mode
	if (debugMode){
		wState.borderWidth = 1
		wContent.borderWidth = 1
		wRangeValue.borderWidth = 1
		wBattery.borderWidth = 1
	}



// Build the car state icon
	
	symbolToUse = "questionmark.circle.fill"

	let symColor = inactiveColor

	switch(items.carState){
		case "Sleeping":
			symbolToUse = "moon.zzz.fill"
			break;
		case "Idling":
			symbolToUse = "p.square.fill"
			break;
		case "Driving":
			symbolToUse = "car.fill"
			break;
		case "Charging":
			break;
		default:
			logError(items.carState)
	}
	let statusSymbol = SFSymbol.named(symbolToUse)
	statusSymbolImage = statusSymbol.image

	let timeDiff = 0
	if (show_data_age){
		let lastUpdateString = ""
		let lastUpdate = new Date(items.Date.replace(" ","T"))
		let now = new Date()
		timeDiff = Math.round((Math.abs(now - lastUpdate))/(1000 * 60))
		if (timeDiff < 60) {
			// been less than an hour since last update
			lastUpdateString = timeDiff+"m ago"
		} else if(timeDiff < 1440){
			lastUpdateString = Math.floor(timeDiff/60)+"h ago"
		} else {
			lastUpdateString = Math.floor(timeDiff/1440)+"d ago"
		}
		let lastUpdateText = wState.addText(lastUpdateString)
		lastUpdateText.textColor = textColor
		lastUpdateText.textOpacity = 0.4
		lastUpdateText.font = Font.systemFont(12)
		lastUpdateText.leftAlignText()
		
	}
	let carStateSpacer = wState.addSpacer(null)


	if (items.sentry_mode == 1){
		//sentry mode is on
		sentrySymbol = SFSymbol.named("sun.min.fill")
		sentrySymbolImage = sentrySymbol.image

		let sentryModeContext = new DrawContext()  
		sentryModeContext.opaque = false
		sentryModeContext.size = sentrySymbolImage.size
		//sentryModeContext.tintColor = symColor
		sentryModeContext.imageOpacity = 0.8
		sentryModeContext.drawImageAtPoint(sentrySymbolImage,new Point(0,0))
		
		sentryModeContext.setFillColor(Color.red())
		sentryModeContext.fillEllipse(new Rect(6,6,7,7))
		
		sentryModeImage = sentryModeContext.getImage()

		let carState = wState.addImage(sentryModeImage)
		carState.imageSize = scaleImage(sentryModeImage.size,20)
		carState.rightAlignImage()
		//carState.imageOpacity = 0.8
		//symColor = Color.red()
	} else if (items.carState == "Charging") {
		// car is charging

		let carChargingImageContext = new DrawContext()  
		carChargingImageContext.opaque = false
		carChargingImageContext.size = new Size(12,18)

		const boltIcon = new Path()
		boltIcon.addLines([new Point(8.1,1),new Point(1,10.9), new Point (5.3,10.9), new Point (3.8,18), new Point (10.9,8.1), new Point(6.7,8.1)])
		boltIcon.closeSubpath()
		
		carChargingImageContext.addPath(boltIcon)
		carChargingImageContext.setLineWidth(2)
		carChargingImageContext.setStrokeColor(new Color("#33333399"))
		carChargingImageContext.strokePath()
		carChargingImageContext.addPath(boltIcon)
		carChargingImageContext.setFillColor(chargingColor)
		carChargingImageContext.fillPath()
	

		carChargingImage = carChargingImageContext.getImage()

		let carState = wState.addImage(carChargingImage)
		carState.rightAlignImage()
		
	} else { 
		let carState = wState.addImage(statusSymbolImage)
		carState.imageSize = scaleImage(statusSymbol.image.size,20)
		carState.tintColor = symColor
		carState.rightAlignImage()

	}
	



// Build the car name
	let carName = wContent.addText(items.display_name)
	carName.textColor = textColor
	carName.centerAlignText()
	carName.font = Font.semiboldSystemFont(24)
	carName.minimumScaleFactor = 0.5


// Build the status lights
	symbolToUse = ""
	if (items.locked == 1){
		symbolToUse = "lock.fill"
	} else {
		symbolToUse = "lock.open.fill"
	}	
	lockSymbol = SFSymbol.named(symbolToUse)
	let carControlIconLock = wControls.addImage(lockSymbol.image)
	//logError(lockSymbol.image.size)
	carControlIconLock.imageSize = scaleImage(lockSymbol.image.size,12)	
	carControlIconLock.containerRelativeShape = true
	carControlIconLock.tintColor = textColor
	carControlIconLock.borderWidtrh = 1
	carControlIconLock.imageOpacity = 0.8
	let carControlSpacer = wControls.addSpacer(null)

	climateOpacity = 0.8
	if ((timeDiff/60) > 2){
		//logError (timeDiff/60)
		climateOpacity = 0.2 // make it super dim after 2 hours of data stale data
	}
	climateSymbol = SFSymbol.named("snow")
	let carControlIconClimate = wControls.addImage(climateSymbol.image)
	//logError(lockSymbol.image.size)
	carControlIconClimate.imageSize = scaleImage(lockSymbol.image.size,14)	
	carControlIconClimate.containerRelativeShape = true
	carControlIconClimate.tintColor = textColor
	carControlIconClimate.borderWidtrh = 1
	carControlIconClimate.imageOpacity = climateOpacity
	if (items.is_climate_on == 1){
		if (items.inside_temp < items.driver_temp_setting){
			carControlIconClimate.tintColor = Color.red(); // show the temp setting in red to show heating
		} else {
			carControlIconClimate.tintColor = Color.blue(); // show the temp setting in blue to show cooling
		}
		carControlIconClimate.imageOpacity = 0.8
	}
	//let carControlSpacer2 = wControls.addSpacer(null)
	let carTempText = ""

	if (items.temperature == "F"){
		if (items.is_climate_on == 1 && Math.abs(items.driver_temp_settingF - items.inside_tempF) > 0){
			carTempText = " "+items.inside_tempF+"° ➝ "+items.driver_temp_settingF+"°"
		} else {
			carTempText = " "+items.inside_tempF+"°"
		}
	} else {
		if (items.is_climate_on == 1 && Math.abs(items.driver_temp_setting - items.inside_temp) > 0){
			carTempText = " "+items.inside_temp+"° ➝ "+items.driver_temp_setting+"°"
		} else {
			carTempText = " "+items.inside_temp+"°"	
		}
	}
	let carTemp = wControls.addText(carTempText)
	carTemp.textColor = textColor
	carTemp.font = Font.systemFont(15)
	carTemp.textOpacity = climateOpacity



// build the charge state text

	let batteryCurrentCharge = ""
	if (show_battery_percentage){ 
		batteryCurrentCharge = items.usable_battery_level + "%"
		if (items.usable_battery_level < items.battery_level){
			batteryCurrentCharge = items.usable_battery_level+"/"+items.battery_level+"%"
		}
		if (items.carState == "Charging" && show_range){
			// we need to show a reduced size since there's not enough room
			batteryCurrentCharge = items.battery_level + "%"
		}
		
		let batteryCurrentChargePercentTxt = wRangeValue.addText(batteryCurrentCharge)
		batteryCurrentChargePercentTxt.textColor = textColor
		batteryCurrentChargePercentTxt.textOpacity = 0.6
		batteryCurrentChargePercentTxt.font = Font.systemFont(12)
		batteryCurrentChargePercentTxt.centerAlignText()

	}
	if (show_range){
		let units = "mi"
		let distance_multiplier = 1; // imperial = 1, metric =  1.609
		if (items.measure != "imperial") {units = "km"; distance_multiplier = 1.609;}
		if (show_battery_percentage){ 
			let carChargingSpacer1 = wRangeValue.addSpacer(null)		
		}
		if (show_range_est) { 
			batteryCurrentCharge = Math.floor(items.est_battery_range*distance_multiplier)+units
		} else {
			batteryCurrentCharge = Math.floor(items.battery_range*distance_multiplier)+units
		}
		
		let batteryCurrentRangeTxt = wRangeValue.addText(batteryCurrentCharge)
		batteryCurrentRangeTxt.textColor = textColor
		batteryCurrentRangeTxt.textOpacity = 0.6
		batteryCurrentRangeTxt.font = Font.systemFont(12)
		batteryCurrentRangeTxt.centerAlignText()
	
	}

 
	if (items.carState == "Charging"){
		if (show_battery_percentage || show_range){
			let carChargingSpacer2 = wRangeValue.addSpacer(null)
		}

		// currently charging
		minutes = Math.round((items.time_to_full_charge - Math.floor(items.time_to_full_charge)) * 12) * 5
		if (minutes < 10) {minutes = "0" + minutes}
		chargingSymbol = SFSymbol.named("bolt.circle.fill")
		let carControlIconBolt = wRangeValue.addImage(chargingSymbol.image)
		carControlIconBolt.imageSize = scaleImage(chargingSymbol.image.size,12)
		carControlIconBolt.tintColor = textColor
		carControlIconBolt.imageOpacity = 0.8
		
		let carChargeCompleteTime = wRangeValue.addText(" "+Math.floor(items.time_to_full_charge)+":"+minutes)
		carChargeCompleteTime.textColor = textColor
		carChargeCompleteTime.font = Font.systemFont(12)
		carChargeCompleteTime.textOpacity = 0.6

		wRangeValue.setPadding(5,5,0,5)
			
	} else if (items.fast_charger_type != "<invalid>"){
		// car is connected to charger, but not charging
		if (show_battery_percentage || show_range){
			let carChargingSpacer2 = wRangeValue.addSpacer(null)
		}
		chargingSymbol = SFSymbol.named("bolt.circle.fill")
		let carControlIconBolt = wRangeValue.addImage(chargingSymbol.image)
		carControlIconBolt.imageSize = scaleImage(chargingSymbol.image.size,12)
		carControlIconBolt.tintColor = textColor
		carControlIconBolt.imageOpacity = 0.4		
	}



// show the battery bar

	let batteryBarImg = wBattery.addImage(batteryBarData)
	batteryBarImg.imageSize = new Size(130,20)
	batteryBarImg.centerAlignImage()


  
  return w
}
 
 
function errorWidget(reason){
	let w = new ListWidget()
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

  return w
}
 
async function loadItems() {
 
	let url = APIurl
	let req = new Request(url)
	let json = await req.loadJSON()
	return json
}

function scaleImage(imageSize,height){
	scale = height/imageSize.height
	return new Size(scale*imageSize.width,height)
}
