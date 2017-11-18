var request = require('request');
var firebase = require('firebase');
var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=28.602451,-81.200140&radius=1000&type=school&key=AIzaSyDZKJ00w4fQX-Z9xxGIY5pykptFv3V7YGI'


var config = {
  apiKey: "AIzaSyAQT1zbbtl4dGG9aUmKBUJb-ZEsldjCnHg",
  authDomain: "ucfparkingistrash.firebaseapp.com",
  databaseURL: "https://ucfparkingistrash.firebaseio.com",
  projectId: "ucfparkingistrash",
  storageBucket: "",
  messagingSenderId: "651284600614"
};

firebase.initializeApp(config);
var database = firebase.database();

var locs = []

var garages = []
garages.push({
    name: 'A',
    lat:28.599911,
    lng: -81.205646
})
garages.push({
    name: 'B',
    lat:28.596898,
    lng: -81.200417
})
garages.push({
    name: 'C',
    lat:28.602334,
    lng: -81.195893
})
garages.push({
    name: 'D',
    lat:28.604913,
    lng: -81.197167
})
garages.push({
    name: 'H',
    lat:28.604906,
    lng: -81.201062
})
garages.push({
    name: 'I',
    lat: 28.601106,
    lng: -81.204797
})
garages.push({
    name: 'Libra',
    lat:28.596008,
    lng: -81.196722
})

firebase.database().ref('/locs_of_intrest/locs_of_garages').set(garages);

function build_table(url) {

    hit_api(url, function(json_ret) {
        var nextPageToken = json_ret['next_page_token'];
        hit_api(url + '&pagetoken=' + nextPageToken, function(json_ret_next) {
            console.log(locs)
            firebase.database().ref('locs_of_intrest').set(locs);
            console.log("Done!")
        });
    });
}
function hit_api(url, callback) {
    request(url, function(err, res, body) {
        if(!err) {
            json = (JSON.parse((body)));
            for (i in json['results']) {
                loc = json['results'][i];
                name = loc['name'];
                if (name.indexOf('Garage') != -1){
                    continue;
                }
                lat = loc['geometry']['location']['lat'];
                lng = loc['geometry']['location']['lng'];
                console.log(name)
                locs.push({
                    name: name,
                    lat: lat,
                    lng: lng
                })
            }
            callback(json);
        }
    })
}


directions_url = 'https://maps.googleapis.com/maps/api/directions/json?'
api_key = '&key=AIzaSyDZKJ00w4fQX-Z9xxGIY5pykptFv3V7YGI'
dirs = []
function build_duration_table(directions_url) {
    firebase.database().ref('/locs_of_intrest').once("value", function(snapshot){
        var json = JSON.parse(JSON.stringify(snapshot.val()))
        garages_obj = json['locs_of_garages']
        garage_list = []
        console.log(json)
        for (i in garages_obj) {
            garage = garages_obj[i]
            dirs[garage['name']] = {}
            // bject.keys(json).length  - 1
            for (var j = 0; j < Object.keys(json).length  - 1; j++) {
                console.log(j)
                hit_directions_api(directions_url, garage, json[j])
            }
        }
        console.log(dirs)
    });
}

function hit_directions_api(url, garage, dest) {
    origin_lat = garage['lat'];
    origin_long = garage['lng'];
    origin_name = garage['name'];

    dest_lat = dest['lat'];
    dest_long = dest['lng'];
    dest_name = dest['name'];

    url = url + 'origin=' + origin_lat + ',' + origin_long + '&destination=' + dest_lat + ',' + dest_long + '&mode=walking' + api_key

    request(url, function(err, res, body) {
        if(!err) {
            json = (JSON.parse((body)));
            // for(i in json['routes']) {
            //     console.log(i)
            //     console.log(json['routes'][i])
            // }
            var time = json['routes'][0]['legs'][0]['duration']['text'];
            console.log(time)
            time = time.replace(/[^0-9/0-9]/g, '');
            firebase.database().ref('/walk_times/' + garage['name'] + '/' + dest['name']).set({time:time});


        }
    })
}
build_duration_table(directions_url)
