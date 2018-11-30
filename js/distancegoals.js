class DistanceGoals {

	constructor() {
		var dg = this;
		this.settings = {
			selectors: {
				fileselector: "#gpxfile",
				fileconfirm: "#gpxconfirm",
				gpxcontainer: "#gpxlist",
				agg: {
					distance: '#aggdist',
					elevation: '#aggele',
					time: '#aggtime',
					speed: '#aggspeed'
				}
			}
		};

		this.geojson = geojson;
		this.uploadedGPXFiles = [];
		this.distance = 0;
		this.elevation = 0;
		this.time = 0;
		this.speed = 0;
		this.counter = 1;

		this.initialised = false;
		this.finished = false;

		this.initMap();

		jQuery(this.settings.selectors.fileconfirm).on('click', function(event) {
			event.preventDefault();

			$(".welcomeText").fadeOut(1000);
			$("#toggleGraph").fadeIn(500);
			$("#chartContainer").hide();
			$(".welcomeText").promise().done(function() {
				$(".noVis").show();
				$(".hidden-t").show();
				$(".supplied-gpx").fadeIn(1000);
				$(".mapModal").hide();
				$(".mapModal").promise().done(function() {
					$("#map").css('position', 'relative');
					$("#map").css('top', 'auto');
					$("#map").css('z-index', '10');
					$("#map").animate({opacity: 1}, 1000);

				});
			});

			var gpx = new SuppliedGPX(dg.settings.selectors.fileselector, dg.settings.selectors.gpxcontainer,dg.counter++);
			dg.uploadedGPXFiles.push(gpx);

			return false;
		})
	}


	initMap() {
		this.map = L.map('map').setView([51.505, -0.09], 13);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);

		var boundsLayer = L.geoJson(JSON.parse(this.geojson));

		this.map.fitBounds(boundsLayer.getBounds());
	}

	addToDistance(amount) {
		this.distance += amount;

		jQuery(this.settings.selectors.agg.distance).text(Math.round((this.distance*100)) / 100 + " kilometers");
	}

	addToElevation(amount) {
		this.elevation += amount;

		jQuery(this.settings.selectors.agg.elevation).text(Math.round((this.elevation*100)) / 100);
	}

	addToTime(amount) {
		this.time += amount;


		var str = this.formatTime(this.time);
		jQuery(this.settings.selectors.agg.time).text(str);
	}

	addToSpeed(distance, time) {
		if(this.speed == 0) this.speed += distance/time;
		else { this.speed += (distance/time); this.speed /= 2; }

		jQuery(this.settings.selectors.agg.speed).text(Math.round((this.speed*60)*60*100)/100 + " kph");
	}

	formatTime(time) {
		var seconds = time % 60;
		var mins = Math.floor(time / 60);
		var hours = Math.floor(mins / 60);
		var days = 0;
		var str = mins + " mins " + seconds + " seconds";

		if(hours > 0) {
			mins = mins % 60;

			days = Math.floor(hours / 24);

			str = hours + " hours " + mins + " mins ";
			if(days > 0) {
				hours = hours % 24;

				str = days + " days " + hours + " hours";
			}
		}

		return str;
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

		    var currentMarker = L.marker([this.currentLatLng[1], this.currentLatLng[0]]).bindPopup(sgpx.name + "<br>" + Math.round(sgpx.distance*100)/100 + "km").addTo(this.map);
		    this.getLocation(this.currentLatLng);
		    this.finished = (data.coordinates.length == fullLength)
		    if(data.coordinates.length == fullLength) {
		    	this.finished = true;
				jQuery('#locname')
					.html('You have finished!');

		    }
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
		if(!this.finished) {
			jQuery('#locname')
				.html('You have reached '+address.display_name.replace(', United Kingdom', '').replace(', England', '')+'!');
		}
	}
}

var dg;
var isMph = false;
jQuery(document).ready(function() {
	dg = new DistanceGoals();
	// graph = new Graph();
	$("#kilometers").prop('disabled',true);
	$(".hidden-t").hide();

	$("#toggleGraph").click(function() {
		$("#map").toggle();
		$("#chartContainer").toggle();
	})

	$("#miles").click(function() {
		for(i=1;i<dg.counter;i++) {
			var speed = $(".speed#" + i).text();
			var distance = $(".distance#" + i).text();
			var split = speed.split(" ");
			var splitD = distance.split(" ");
			$("#"+i+".speed").html(Math.round(splitD[0]/1.609) + " mph");
			$("#"+i+".distance").html(Math.round(splitD[0]/1.609) + " miles");
		}
		speed = $("#aggspeed").text();
		split = speed.split(" ");
		$("#aggspeed").html(Math.round(split[0]/1.609) + " mph");
		$("#aggdist").html(Math.round(split[0]/1.609) + " miles");
		$("#miles").prop('disabled',true);
		$("#kilometers").prop('disabled',false);
	})

	$("#kilometers").click(function() {
		for(i=1;i<dg.counter;i++) {
			var speed = $("#"+i+".speed").text();
			var distance = $(".distance#"+ i).text();
			var splitD = distance.split(" ");
			var split = speed.split(" ");
			$("#"+i+".speed").html(Math.round(split[0]) + " kph");
			$("#"+i+".distance").html(Math.round(splitD[0]*1.609) + " kilometers");
		}
		speed = $("#aggspeed").text();
		var distance = $("#aggdist").text();
		split = speed.split(" ");
		var splitD = distance.split(" ");
		$("#aggspeed").html(Math.round(split[0]*1.609) + " kph");
		$("#aggdist").html(Math.round(splitD[0]*1.609) + " kilometers");
		$("#kilometers").prop('disabled',true);
		$("#miles").prop('disabled',false);
	})

});
