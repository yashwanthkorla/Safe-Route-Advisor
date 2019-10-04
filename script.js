  // This example requires the Places library. Include the libraries=places
    // parameter when you first load the API. For example:
    // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
    function initMap() {
        var map = new google.maps.Map(document.getElementById('map'), {
          mapTypeControl: false,
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 4
        });
  
        new MainHandler(map);
      }
  
      /**
       * @constructor
      */
      function MainHandler(map) {
        this.map = map;
        this.originPlaceId = null;
        this.destinationPlaceId = null;
        this.travelMode = 'DRIVING';
        this.provideRouteAlternatives = true;
        var originInput = document.getElementById('origin-input');
        var destinationInput = document.getElementById('destination-input');
        var modeSelector = document.getElementById('mode-selector');
        this.directionsService = new google.maps.DirectionsService;
        this.directionsDisplay = new google.maps.DirectionsRenderer;
        this.directionsDisplay.setMap(map);
  
        var originAutocomplete = new google.maps.places.Autocomplete(
          originInput, { placeIdOnly: true });
        var destinationAutocomplete = new google.maps.places.Autocomplete(
          destinationInput, { placeIdOnly: true });
  
        this.setupClickListener('changemode-walking', 'WALKING');
        this.setupClickListener('changemode-transit', 'TRANSIT');
        this.setupClickListener('changemode-driving', 'DRIVING');
  
        this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
        this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');
      }
  
      // Sets a listener on a radio button to change the filter type on Places
      // Autocomplete.
      MainHandler.prototype.setupClickListener = function (id, mode) {
        var radioButton = document.getElementById(id);
        var me = this;
        radioButton.addEventListener('click', function () {
          me.travelMode = mode;
          me.route();
        });
      };
  
      MainHandler.prototype.setupPlaceChangedListener = function (autocomplete, mode) {
        var me = this;
        autocomplete.bindTo('bounds', this.map);
        autocomplete.addListener('place_changed', function () {
          var place = autocomplete.getPlace();
          if (!place.place_id) {
            window.alert("Please select an option from the dropdown list.");
            return;
          }
          if (mode === 'ORIG') {
            me.originPlaceId = place.place_id;
          } else {
            me.destinationPlaceId = place.place_id;
          }
          me.route();
        });
  
      };
  
      MainHandler.prototype.route = function () {
        if (!this.originPlaceId || !this.destinationPlaceId) {
          return;
        }
        var me = this;
        var map_new = new google.maps.Map(document.getElementById('map'), {
          mapTypeControl: false,
          center: { lat: 12.77, lng: 77.66 },
          zoom: 4
        });
        this.directionsService.route({
          origin: { 'placeId': this.originPlaceId },
          destination: { 'placeId': this.destinationPlaceId },
          travelMode: this.travelMode,
          provideRouteAlternatives: true
        }, function (response, status) {
          if (status === 'OK') {
            //  me.directionsDisplay.setDirections(response); 
            // console.log(response);
            // var polylineoptions = ['red', 'blue', 'green'];
            var len = response.routes.length;
            var average_aqi_array = [];
            for (var i = 0; i < len; i++) {
              // console.log(response.routes[i].legs[0].distance['value']);
              var total_distance_per_route = response.routes[i].legs[0].distance['value'];
              var travel_steps = total_distance_per_route / 6;
              var step_length = response.routes[i].legs[0].steps.length;
              var travel_steps_array = []
              var initial = 0;
              while (initial < total_distance_per_route) {
                initial = initial + travel_steps
                travel_steps_array.push(initial);
              }
            //   console.log(total_distance_per_route, JSON.stringify(travel_steps_array), response.routes[i].legs[0].end_location.lat(), response.routes[i].legs[0].end_location.lng())
              var travel_steps_array_length = travel_steps_array.length;
              var travel_steps_count = 0;
              var aqi_value = []
  
              for (var k = 0; k < travel_steps_array_length; k++) {
                travel_steps_count = travel_steps_array[k];
                var initial_value = 0;
                var temp = 0;
                for (var j = 0; j < step_length; j++) {
                  initial_value = response.routes[i].legs[0].steps[j].distance['value'];
                  if (temp < travel_steps_count) {
                    temp = temp + initial_value;
                  }
                  else {
                    var lat = response.routes[i].legs[0].steps[j].start_location.lat()
                    var long = response.routes[i].legs[0].steps[j].start_location.lng()
                    console.log(travel_steps_count, temp, j, "Lat : " + lat, "long : " + long);
                    var xhttp = new XMLHttpRequest();
                    xhttp.onreadystatechange = function () {
                      if (this.readyState == 4 && this.status == 200) {
                        var data = JSON.parse(this.responseText);
                        if (data['data'] != null) {
                          aqi_value.push(data['data']['aqi']);
                          console.log(data)
  
                        }
                        else {
                          aqi_value.push(0);
                        }
                      }
                    };
                    xhttp.open("GET", `https://api.waqi.info/feed/geo:${lat};${long}/?token=70e671205c1e41c84e7b1f9dfac1c870d837f1f5`, false);
                    xhttp.send();
                    break;
                  }
                }
              }
              var total_aqi = aqi_value.reduce((a, b) => a + b, 0);
              var aqi_value_length = aqi_value.length;
              var average_aqi = total_aqi / aqi_value_length;
              console.log("AQI Value", aqi_value)
              console.log("Average API", average_aqi)
  
              average_aqi_array.push(average_aqi);
  
  
              // var infoWindow = new google.maps.InfoWindow({
              //   content: `<b>AQI : ${average_aqi}<b>`
              // });
              //   infoWindow.open(map_new, marker);
  
            }
            console.log(average_aqi_array, Math.min.apply(null, average_aqi_array))
            var minimum = Math.min.apply(null, average_aqi_array);
            for (var len_route = 0; len_route < len; len_route++) {
              if (average_aqi_array[len_route] == minimum) {
                var color = 'green', opacity = 0.8;
              }
              else {
                var color = 'grey', opacity = 0.5;
              }
              new google.maps.DirectionsRenderer({
                map: map_new,
                directions: response,
                routeIndex: len_route,
                polylineOptions: {
                  strokeColor: color,
                  strokeOpacity: opacity
                }
              });
              // console.log(response)
              var number = Math.floor(response.routes[len_route].legs[0].steps.length / 2);
              var latti = response.routes[len_route].legs[0].steps[number].start_location.lat();
              var longi = response.routes[len_route].legs[0].steps[number].start_location.lng();
              let latlong = new google.maps.LatLng(latti, longi);
              var marker = new google.maps.Marker({
                map: map_new,
                animation: google.maps.Animation.DROP,
                label: { text: `${Math.round(average_aqi_array[len_route])}`, color: 'white', fontSize: '10px' },
                title: `${average_aqi}`,
                position: latlong
              });
  
            }
  
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
      };
  