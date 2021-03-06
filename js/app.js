(function(){

	var userLocation = {};
	var markers = {};
	var data = {};
	
	// DOM
	var compassPane = document.getElementById('closestVenue');
	var mapPane = document.getElementById('map-canvas');
	var showMapButton = document.getElementById('showMapButton');
	
	// Google Maps
	var mapOptions = {
			zoom: 15,
			center: new google.maps.LatLng(-25.363882,131.044922)
		};
	var map = new google.maps.Map(mapPane, mapOptions);
    var infowindow = new google.maps.InfoWindow({maxWidth: 200});
    
    // 4sq
    var CLIENT_ID = 'XI5YNNLGSGJSHXBKJLOLUCLYBKFGFXVPS2LICPVJYJB0AVQH';
    var CLIENT_SECRET = 'HYS1E2Q2HJ5NQCOH1G5OP50WDJERAF4ZLSEZVXDSM1VCACAL';
    var SEARCH_URL = 'https://api.foursquare.com/v2/venues/search?client_id=' +CLIENT_ID+ '&client_secret=' + CLIENT_SECRET;
    
    
    
    mapUserLocation();
    
    showMapButton.addEventListener('click', function(){
	    //window.scrollTo(0, compassPane.clientHeight);
	    if(showMapButton.textContent == 'COMPASS' || showMapButton.textContent == 'Compass') {
		    showMapButton.textContent = 'Map me';
		    mapPane.style.zIndex = '0';
	    } else {
		    showMapButton.textContent = 'Compass';
		    mapPane.style.zIndex = '1';
	    }
    })

	/** 
	 * Locate a user on Google Maps
     */
	function mapUserLocation() {
	
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
		} else {
		  	alert('Your browser does not support geolocation API.');
		}
		
		function successCallback(position) {
		
			var lat = position.coords.latitude;
			var lon = position.coords.longitude;
			
			console.log(lat,lon);
			
			userLocation = {lat: lat, lon: lon};
			
			var mapLoc = new google.maps.LatLng(userLocation.lat, userLocation.lon);
			
			var marker = new google.maps.Marker({
				position: mapLoc,
				map: map
			});
			
			findArea(mapLoc);
			findFood(userLocation);	
			
			map.panTo(mapLoc);
		}
		
		function errorCallback(error) {
			geoPane.innerHTML = '<em style="color:red; line-height:3em">Error: ' + error.message + '</em>';
			return;
		}
	}
	
	function findArea(latlng) {
		gc = new google.maps.Geocoder();
		gc.geocode({'latLng': latlng}, function(results, status) { 
			if (status == google.maps.GeocoderStatus.OK) { 
				document.getElementById('areaName').textContent = ' in: ' + results[0].address_components[2].short_name;
			}
		});
	}
	
	function findFood(loc) {
		var url = SEARCH_URL + '&ll=' + loc.lat + ',' + loc.lon + '&query=kaffe&limit=6&v=' + yyyymmdd();
		console.log(url);

		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.onload = function(){
			data = JSON.parse(xhr.response);
			sortPlacesByDistance(data.response.venues, function(results){
				//console.log(results);
				showCompass(results[0]);
				displayPlacesOnMap(results);
			});
		};
	    xhr.onerror = function(){
		    alert('An error occurred while uploading the file.');
			console.log(e);
	    };
	    xhr.send();
	}
	
	
	function yyyymmdd() {
		var d = new Date();
		return d.toISOString().slice(0,10).replace(/-/g, '');
	}
	
	
	function sortPlacesByDistance(venues, callback) {
		for(var i = 0; i < venues.length; i++) {
			var venue = venues[i];
			var venueLocation = {lat: venue.location.lat, lon: venue.location.lng};
			
			var dist = getDistanceFromCoords(venueLocation, userLocation);
			
			venue.distance = dist;
		}
		
		venues.sort(function(a,b){return a.distance - b.distance});

		callback(venues);
	}
	
	function showCompass(closestVenue) {
		if(typeof window.DeviceOrientationEvent !== 'function') {
			alert('Your browser does not support DeviceOrientation Event API');
			return;
		} 
		
		document.querySelector('#closestVenue .business').textContent = closestVenue.name;
		document.querySelector('#closestVenue .address').textContent = closestVenue.location.address;
		document.querySelector('#closestVenue .distance').textContent = closestVenue.distance + ' km';
		
		var compass = document.querySelector('#closestVenue img');
		
		var venueLocation = {lat: closestVenue.location.lat, lon: closestVenue.location.lng};
			
		var deg = getBearingFromCoords(venueLocation, userLocation);
		
		window.addEventListener('deviceorientation', function(e) {
			var r = deg - (e.webkitCompassHeading || e.alpha) + 180;
			compass.style.webkitTransform = 'rotate(' + r + 'deg)';
			compass.style.MozTransform = 'rotate(' + r + 'deg)';
			compass.style.transform = 'rotate(' + r + 'deg)';
		});
	}
	
	function displayPlacesOnMap(venues) {
		venues.reverse();
		
		for(var i = 0; i < venues.length; i++) {
			var venue = venues[i];
			
			var mapLoc = new google.maps.LatLng(venue.location.lat, venue.location.lng);

			var marker = new google.maps.Marker({
				position: mapLoc,
				map: map,
				icon: 'images/marker.png',
				html: '<strong>' + venue.name + '</strong><br>' + venue.location.address
			});
			
			var infowindow = new google.maps.InfoWindow({maxWidth: 150});

			google.maps.event.addListener(marker, 'click', function() {
				infowindow.setContent(this.html);
				infowindow.open(map, this);
			});
		}
	}
	
	Array.min = function( array ){
    	return Math.min.apply( Math, array );
	};
	
})();