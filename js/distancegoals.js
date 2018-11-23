class DistanceGoals {

	constructor() {
		var dg = this;
		this.settings = {
			selectors: {
				fileselector: "#gpxfile",
				fileconfirm: "#gpxconfirm",
				gpxcontainer: "#gpxlist"
			}
		};

		this.geojson = geojson;
		this.uploadedGPXFiles = [];
		this.distance = 0;
		this.elevation = 0;
		this.avgSpeed = 0;

		this.initialised = false;
		this.finished = false;

		this.initMap();

		jQuery(this.settings.selectors.fileconfirm).on('click', function(event) {
			event.preventDefault();

			var gpx = new SuppliedGPX(dg.settings.selectors.fileselector, dg.settings.selectors.gpxcontainer);
			dg.uploadedGPXFiles.push(gpx);

			return false;
		});
	}

	initMap() {
		this.map = L.map('map').setView([51.505, -0.09], 13);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);
	}

	addToDistance(amount) {
		this.distance += amount;
	}

	addToElevation(amount) {
		this.elevation += amount;
	}

	recalculateSpeed() {
		var total = 0;
		this.uploadedGPXFiles.forEach(function(ele) {
			total += ele.avgSpeed;
		});

		this.avgSpeed = total / this.uploadedGPXFiles.length;
	}

	//Based on http://stackoverflow.com/a/27943
	getDistanceFromLatLng(lat1,lng1,lat2,lng2) {
	  var R = 6371; // Radius of the earth in km
	  R = R*1000; //Convert to metres
	  var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
	  var dLng = this.deg2rad(lng2-lng1); 
	  var a = 
	    Math.sin(dLat/2) * Math.sin(dLat/2) +
	    Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
	    Math.sin(dLng/2) * Math.sin(dLng/2)
	    ; 
	  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	  var d = R * c; // Distance in m
	  return d;
	}

	deg2rad(deg) {
	  return deg * (Math.PI/180)
	}

	geoJsonToDistance(data, distance)
	{
		var dist = 0;
		var prevLatLng = null;
		var newLatLng = null;

		for (var i = 0; i < data.coordinates.length; i++) {
			if(!prevLatLng){
				prevLatLng = data.coordinates[i];
				this.firstLatLng = prevLatLng;
				continue;
			}else{
				newLatLng = data.coordinates[i];
				var temp = dist + this.getDistanceFromLatLng(prevLatLng[0], prevLatLng[1], newLatLng[0], newLatLng[1]);
				if(temp >= distance)
				{
					if(Math.abs(temp - distance) < Math.abs(dist - distance))
					{
						//current pass is more accurate
						data.coordinates = data.coordinates.slice(0, i+1);
						this.currentLatLng = newLatLng;
					}
					else
					{
						//last pass is more accurate
						data.coordinates = data.coordinates.slice(0, i);
						this.currentLatLng = prevLatLng;
					}
					break;
				}
				else
				{
					prevLatLng = newLatLng;
					dist = temp;
				}
			}
		}

		if(!this.currentLatLng.length)
		{
			this.currentLatLng = newLatLng;
		}
		return data;
	}

	displayGoalMap(sgpx)
	{
		var routeLayer = new L.geoJson(null, { snakingSpeed: 300 });
		var fullGeojson = JSON.parse(this.geojson);
		var fullLength = fullGeojson.coordinates.length;
		var data = this.geoJsonToDistance(fullGeojson, this.distance*1000);

		var boundsLayer = L.geoJson(data);

	    this.map.fitBounds(boundsLayer.getBounds());


		if(data.coordinates.length > 1 && !this.finished) {
		    routeLayer.addData(data);
		    routeLayer.addTo(this.map).snakeIn();

		    var that = this;
		    routeLayer.on('snakeend', function () {
			    that.map.fitBounds(routeLayer.getBounds());
		    });

		    var currentMarker = L.marker([this.currentLatLng[1], this.currentLatLng[0]]).bindPopup(sgpx.name).addTo(this.map);
		    this.getLocation(this.currentLatLng);
		    this.finished = (data.coordinates.length == fullLength)
		}

	    if(!this.initialised){
		    var startMarker = L.marker([this.firstLatLng[1], this.firstLatLng[0]]).bindPopup("Start").addTo(this.map);
		    this.initialised = true;
	    }
	}

	getLocation(LatLng)
	{
		var that = this;
		jQuery.get('http://nominatim.openstreetmap.org/reverse?format=json&zoom=9&lat='+this.currentLatLng[1]+'&lon='+this.currentLatLng[0], function (data) {
			return that.displayProgressLocation(data);
		});
		return;
	}

	displayProgressLocation(address)
	{
		console.log(address.display_name);
		jQuery('#address-display')
			.html('You have reached '+address.display_name+'!');
	}
}

var dg;
jQuery(document).ready(function() {
	dg = new DistanceGoals();
});