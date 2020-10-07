// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: charging-station;

// TeslaFi Widget
// Version 0.5
// Jon Sweet (jon@driestone.com)
//
// This pulls data from the TeslaFi API to display a widget on your iPhone
// This is better than other methods because TeslaFi tries to encourage your car to sleep to reduce phantom battery drain. Using this script will not directly connect to the car to respect the sleep status.
// Notice that there is ~5 minute lag for data


let APIkey = args.widgetParameter

const show_battery_percentage = true // show the battery percentage above the battery bar
const show_range = true // show the estimated range above the battery bar
const show_range_est = true // show range estimated by TeslaFi instead of the car's range estimate
const battery_display_3D = false // show a 3D version of the battery bar

// You can imbed your TeslaFi APIkey here, or add it as a widget parameter
APIkey = "dcd06d685a379dd7d566e6be0dd45bcf" // hardcode my APIkey for testing
//APIkey = "API KEY" // hardcode the API Key

const debugMode = false


deviceScreen = Device.screenSize()
let padding = ((deviceScreen.width - 240) /5)
let widgetSize = new Size(padding + 110, padding + 110)

if (APIkey == null){
	let widget = errorWidget("TeslaFi APIkey Required")
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
			let widget = errorWidget("Invalid TeslaFi APIkey")
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


// BUILD BATTERY BAR

	const batteryPath = new Path()
	batteryPath.addRoundedRect(new Rect(1,1,widgetSize.width-2,18),7,7)

	const batteryPathInset = new Path()
	batteryPathInset.addRoundedRect(new Rect(2,2,widgetSize.width-3,17),7,7)

	batteryAmount = Number(items.usable_battery_level)*(widgetSize.width-2)/100
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
		batteryMaxCharge.setFillColor(new Color("#4455ffcc")) // show it in blue to reitterate charging
	}
	batteryMaxCharge.addPath(batteryPath)
	batteryMaxCharge.fillPath()
		
	batteryMaxChargeImage = batteryMaxCharge.getImage()
	myDrawContext.drawImageAtPoint(batteryMaxChargeImage,new Point(0,0))
	
// if there's at least some battery, build the current charge state bar
	if (batteryAmount>1){

		let batteryFull = new DrawContext()  
		batteryFull.opaque = false
		batteryFull.size = new Size(batteryAmount,20)

		batteryFull.setFillColor(new Color("#2BD82E"))
		batteryFull.addPath(batteryPath)
		batteryFull.fillPath()



		let highlightWidth = batteryAmount-10;
		if (highlightWidth>4 && battery_display_3D){

			const batteryHighlight = new Path()
			batteryHighlight.addRoundedRect(new Rect(5,5,batteryAmount-6,3),1,1)

			batteryFull.setFillColor(new Color("#ffffff",0.5))
			batteryFull.addPath(batteryHighlight)
			batteryFull.fillPath()

		}


		myFullBatteryImage = batteryFull.getImage()
		myDrawContext.drawImageAtPoint(myFullBatteryImage,new Point(0,0))
		myDrawContext.setFillColor(inactiveColor)
		myDrawContext.fillRect(new Rect(batteryAmount,1,1,18))
	}


	myDrawContext.addPath(batteryPath)// have to add the path again for some reason
	myDrawContext.setStrokeColor(textColor)
	myDrawContext.setLineWidth(1)
	myDrawContext.strokePath()

	if (battery_display_3D){
		myDrawContext.addPath(batteryPathInset)
		myDrawContext.setStrokeColor(new Color("#00000022"))
		myDrawContext.setLineWidth(4)
		myDrawContext.strokePath()
		myDrawContext.setStrokeColor(new Color("#00000044"))
		myDrawContext.setLineWidth(2)
		myDrawContext.strokePath()
	}
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
			symbolToUse = "bolt.car.fill"
			break;
		default:
			logError(items.carState)
	}
	let statusSymbol = SFSymbol.named(symbolToUse)
	statusSymbolImage = statusSymbol.image
	let carStateSpacer = wState.addSpacer(null)


	if (items.sentry_mode != 1){
	
		let carState = wState.addImage(statusSymbolImage)
		carState.imageSize = scaleImage(statusSymbol.image.size,20)
		carState.tintColor = symColor
		carState.imageOpacity = 0.8
		carState.rightAlignImage()

	
	} else { //sentry mode is on
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
		carState.imageOpacity = 0.8
		//symColor = Color.red()
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

	climateSymbol = SFSymbol.named("snow")
	let carControlIconClimate = wControls.addImage(climateSymbol.image)
	//logError(lockSymbol.image.size)
	carControlIconClimate.imageSize = scaleImage(lockSymbol.image.size,14)	
	carControlIconClimate.containerRelativeShape = true
	carControlIconClimate.tintColor = textColor
	carControlIconClimate.borderWidtrh = 1
	carControlIconClimate.imageOpacity = 0.5
	if (items.is_climate_on == 1){
		carControlIconClimate.tintColor = Color.blue();
		carControlIconClimate.imageOpacity = 0.8
	}
	//let carControlSpacer2 = wControls.addSpacer(null)

	if (items.temperature == "F"){
		let carTemp = wControls.addText(" "+items.inside_tempF+"°")
		carTemp.textColor = textColor
		carTemp.font = Font.systemFont(15)
		carTemp.textOpacity = 0.6
	} else {
		let carTemp = wControls.addText(" "+items.inside_temp+"°")		
		carTemp.textColor = textColor
		carTemp.font = Font.systemFont(15)
		carTemp.textOpacity = 0.6
	}



// build the charge state text

	let batteryCurrentCharge = ""
	if (show_battery_percentage){ 
		batteryCurrentCharge = items.usable_battery_level + "%"
		let batteryCurrentChargePercentTxt = wRangeValue.addText(batteryCurrentCharge)
		batteryCurrentChargePercentTxt.textColor = textColor
		batteryCurrentChargePercentTxt.textOpacity = 0.6
		batteryCurrentChargePercentTxt.font = Font.systemFont(12)
		batteryCurrentChargePercentTxt.centerAlignText()

	}
	if (show_range){
		if (show_battery_percentage){ 
			let carChargingSpacer1 = wRangeValue.addSpacer(null)		
		}
		if (show_range_est) { 
			batteryCurrentCharge = Math.floor(items.est_battery_range)+" mi"
		} else {
			batteryCurrentCharge = Math.floor(items.battery_range)+" mi"
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
 
	let url = "https://www.teslafi.com/feed.php?token="+APIkey+"&command=lastGood"
	let req = new Request(url)
	let json = await req.loadJSON()
	return json
}

function scaleImage(imageSize,height){
	scale = height/imageSize.height
	return new Size(scale*imageSize.width,height)
}