//NOTE: you need to add a mapKey to your parameters.js file, or do it below:

//mapKey = "[your map key from mapquest]";

const mapZoomLevel = 17;
var mapSizeQuery = '200,200@2x';
var mapType = 'light' ;
var mapIconColorPosition = '222222'
var mapIconColorUpdate = '222222'

theme.medium.available = true;

theme.medium.draw = async function(widget,car_data,colors){
	widget.setPadding(5,5,5,5);
	widget.backgroundColor = new Color(colors.background);
	let body = widget.addStack();
	
	body.layoutHorizontally();
	
	let column_left = body.addStack();
	column_left.size = new Size(widgetSize.width/2,widgetSize.height);
	column_left.layoutVertically();


	theme.drawCarStatus(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));
	theme.drawCarName(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));
	theme.drawStatusLights(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));
	theme.drawRangeInfo(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));
	theme.drawBatteryBar(column_left, car_data, colors,new Size(widgetSize.width/2,widgetSize.height));


	let column_right = body.addStack();
	column_right.size = new Size(widgetSize.width/2,widgetSize.height);

	let mapUrl = `https://www.mapquestapi.com/staticmap/v5/map?key=${mapKey}&locations=${car_data.latitude},${car_data.longitude}&zoom=${mapZoomLevel}&format=png&size=${mapSizeQuery}&type=${mapType}&defaultMarker=marker-${mapIconColorPosition}`;
	
	console.log(mapUrl);
	
	var req = new Request(mapUrl);
	//console.log(mapUrl);
	
	let mapImage = await req.loadImage();
	
	column_right.topAlignContent();
	column_right.setPadding(3,0,0,0);
	
	let mapImageObj = column_right.addImage(mapImage);
	mapImageObj.centerAlignImage()
}
