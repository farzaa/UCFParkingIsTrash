var request = require('request');
var cheerio = require('cheerio');
var firebase = require("firebase");
var CronJob = require('cron').CronJob;

ucf_parking_url = 'http://secure.parking.ucf.edu/GarageCount/iframe.aspx'

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

var interval = 5
new CronJob ('*/5 * * * *', function() {
    var date = new Date()
    console.log("Updatig firebase..., time ", date.getMinutes());
    // lets call this once every five minutes
    call_ucf_parking()
    }, function() {
        console.log("Done!")
    },
    true,
    'America/New_York'
);

function call_ucf_parking() {
    request(ucf_parking_url, function(err, res, html) {
        if(!err) {
            scrape_website(html, function(document_to_write) {
                console.log(document_to_write)
                // hardcoded for 7 garages for now
                if (document_to_write.length >= 7) {
                    update_firebase(document_to_write)
                }

            });
        }
    })
}

function scrape_website(html, callback) {
    var list_of_garages = []
    var document_to_write = []
    var $ = cheerio.load(html);

    // TO DO: do i make this for loop async?
    $('#gvCounts_DXMainTable tbody tr').each(function(i, elem) {
        var avail = $(this).text().replace(/\n/g, '').replace(/\s/g,'');
        var garage_name_and_capacity = avail.substring(avail.indexOf('Garage') + 6, avail.length);
        var cleaned = clean_string(garage_name_and_capacity);
        if (cleaned != undefined && cleaned.length == 3) {
            document_to_write.push({
                garage_name: cleaned[0],
                avail_spots: cleaned[1],
                total_capacity: cleaned[2]
            })
        }
    })

    callback(document_to_write)
}

function clean_string(garage_name_and_capacity) {
    // replace things that aren't letters
    var garage_name = garage_name_and_capacity.replace(/[^a-zA-Z]/g, '');
    // replace things that are letters
    var fractional_string_cap = garage_name_and_capacity.replace(/[^0-9/0-9]/g, '');
    if (fractional_string_cap.indexOf('/') !== -1) {
        var avail_spots = fractional_string_cap.substring(0, fractional_string_cap.indexOf('/'));
        var capacity = fractional_string_cap.substring(fractional_string_cap.indexOf('/') + 1, fractional_string_cap.length);
        return [garage_name, avail_spots, capacity]
    } else {
        return undefined
    }
}

function update_firebase(document_to_write) {
    var date = new Date()
    // var day = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ';
    // var time = date.getHours() + ":" + date.getMinutes()
    var key = date.getTime()
    firebase.database().ref(key).set(document_to_write);
}
