var express = require('express');
var router = express.Router();
var firebase = require("firebase");


var config = {
    apiKey: "AIzaSyAQT1zbbtl4dGG9aUmKBUJb-ZEsldjCnHg",
    authDomain: "ucfparkingistrash.firebaseapp.com",
    databaseURL: "https://ucfparkingistrash.firebaseio.com",
    projectId: "ucfparkingistrash",
    storageBucket: "",
    messagingSenderId: "651284600614"
};

firebase.initializeApp(config);

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/best', function(req, res, next) {
    console.log("YOOOO")
    console.log(req.query.loc)
    firebase.database().ref().limitToLast(3).once("value", function(snapshot) {
        var json = JSON.parse(JSON.stringify(snapshot.val()))
        console.log("hey")
        console.log(json[Object.keys(json)[0]])

        dest = 'Biology Building'
        poten = calculate_best_garage_from_cap(json[Object.keys(json)[0]])
        poten = calculate_best_garage_from_dist(json['walk_times'], poten, req.query.loc)

    })

    res.json({hello: poten})
});

function calculate_best_garage_from_cap(garage_info) {
    poten = []

    for (i in garage_info) {
        var garage = garage_info[i];
        avail_spots = parseInt(garage['avail_spots']);
        total_capacity =  parseInt(garage['total_capacity']);
        console.log(garage['garage_name']);
        var percent_full = calculate_percentage_full(avail_spots, total_capacity);
        console.log(percent_full);
        if(percent_full != 100) {
            poten.push(garage)
        }
    }

    return poten;

}

function calculate_percentage_full(avail_spots, total_capacity) {
    // sometimes, the spots avail exceeds capacity b/c ucf is bad!
    if (avail_spots >= total_capacity) {
        return 0
    }
    return Math.floor((((total_capacity - avail_spots) / (total_capacity)) * 100))
}

function calculate_best_garage_from_dist(walk_times, poten, dest) {
    new_poten = []
    for (i in poten) {
        // console.log("Hey.. ", poten[i])
        // console.log("Walk time is ", walk_times[poten[i]['garage_name']][dest]['time'])
        new_poten.push({name: poten[i]['garage_name'], time_to_dest: walk_times[poten[i]['garage_name']][dest]['time']})
    }

    for (j= 0; j < new_poten.length; j ++) {
        for (i = 0; i < new_poten.length - 1; i++) {
            if (new_poten[j]['time_to_dest'] > new_poten[i+1]['time_to_dest']) {
                temp = new_poten[j]['time_to_dest']
                new_poten[j]['time_to_dest'] = new_poten[i+1]['time_to_dest']
                new_poten[i+1]['time_to_dest'] = temp
            }
        }
    }


    new_poten.sort(function(a, b) {
    return parseFloat(a['time_to_dest']) - parseFloat(b['time_to_dest']);
    });
    // new_poten[0]['avail_spots'] = poten[i]['avail_spots']
    for (i in poten) {
        if (new_poten[0]['name'] == poten[i]['garage_name']) {
            new_poten[0]['avail_spots'] = poten[i]['avail_spots']
        }

    }
    console.log(new_poten)
    if (new_poten.length >= 1)
        return [new_poten[0]]
    else
        return undefined
}
//
// function calculate_distances_to_all(poten, dest) {
//     // we can actually hardcode a big table with the distance from the garage to every building at UCF
//     // this may seem bad, but it saves us many API calls and is faster!
//     var ucf_buildings =
// }

module.exports = router;
