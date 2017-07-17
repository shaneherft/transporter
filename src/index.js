var http = require('http');
// var AlexaSkill = require('./AlexaSkill');
var gtfsrb = require('gtfs-realtime-bindings');
var protobuf = require('protobufjs');
var request = require('request');

// var APP_ID = 'amzn1.ask.skill.29d6bbe6-b347-4873-886d-814ad8b32ba4';
var busUrl = 'https://api.transport.nsw.gov.au/v1/gtfs/realtime/buses/SMBSC006';
var trainUrl = 'https://api.transport.nsw.gov.au/v1/gtfs/realtime/sydneytrains';
var trainUrlSchedule = 'https://api.transport.nsw.gov.au/v1/gtfs/schedule/sydneytrains';
var trainposUrl = 'https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/sydneytrains';

// Bus stops:

var busRequest = function(busStopId) {

    request({
        url: busUrl,
        headers: { 'authorization':'apikey l7xx8a3a4e8b896e480ab3995db597d64833' },
        method: 'GET',
        encoding: null
        }, function (error, response, body) {
        console.log('Status', response.statusCode);
        console.log('Headers', JSON.stringify(response.headers));
        console.log('Reponse received', body);

        var feed = gtfsrb.FeedMessage.decode(new Buffer(body, 'base64'));

        var stopMatch = [];
        var requestTime = Date.now();
        var requestTimeSeconds = Math.floor(requestTime / 1000);

        for (i = 0; i < feed.entity.length; i++) {

            for (j = 0; j < feed.entity[i].trip_update.stop_time_update.length; j++) {
                
                if (feed.entity[i].trip_update.stop_time_update[j].stop_id === busStopId) {

                    var bus = {}
                    var routeId = feed.entity[i].trip_update.trip.route_id;
                    var busNumber = routeId.substr(routeId.length - 3);
                    var busArrival = feed.entity[i].trip_update.stop_time_update[j].arrival.time.low - requestTimeSeconds;
                    
                    bus.number = busNumber;
                    bus.time = busArrival;
                    stopMatch.push(bus);

                }

            }

        }

        stopMatch.sort(function (a, b) {
          if (a.time > b.time) {
            return 1;
          }
          if (a.time < b.time) {
            return -1;
          }
          return 0;
        });

        var nextBus = stopMatch.slice(0,2);

        for (i = 0; i < nextBus.length; i++) {
            nextBus[i].time = Math.floor(nextBus[i].time/60);
        }

        console.log("The next bus is a " + nextBus[0].number + " in " + nextBus[0].time + " minutes, followed by a " + nextBus[1].number + " in " + nextBus[1].time + " minutes");

    });

};

// var trainRequest = function(trainStopId) {

//     request({
//         url: trainUrlSchedule,
//         headers: { 'authorization':'apikey l7xx8a3a4e8b896e480ab3995db597d64833' },
//         method: 'GET',
//         encoding: null
//         }, function (error, response, body) {
//         // console.log('Status', response.statusCode);
//         // console.log('Headers', JSON.stringify(response.headers));
//         // console.log('Reponse received', body);

//         var feed = gtfsrb.FeedMessage.decode(new Buffer(body, 'base64'));

//         var stopMatch = [];
//         var requestTime = Date.now();
//         var requestTimeSeconds = Math.floor(requestTime / 1000);

//         for (i = 0; i < feed.entity.length; i++) {

//             for (j = 0; j < feed.entity[i].trip_update.stop_time_update.length; j++) {

                               
//                 if (feed.entity[i].trip_update.stop_time_update[j].stop_id === trainStopId) {

//                     console.log(feed.entity[i].trip_update.stop_time_update);

//                     console.log('match!');
//                     var bus = {}
//                     var routeId = feed.entity[i].trip_update.trip.route_id;
//                     // var busArrival = feed.entity[i].trip_update.stop_time_update[j].arrival.time.low - requestTimeSeconds;
                    
//                     // bus.number = busNumber;
//                     // bus.time = busArrival;
//                     stopMatch.push(bus);

//                 }

//             }

//         }

//         // console.log("The next bus is a " + nextBus[0].number + " in " + nextBus[0].time + " minutes, followed by a " + nextBus[1].number + " in " + nextBus[1].time + " minutes");

//     });

// };

var trainRequestPos = function(trainStopId) {

    request({
        url: trainUrlSchedule,
        headers: { 'authorization':'apikey l7xx8a3a4e8b896e480ab3995db597d64833' },
        method: 'GET',
        encoding: null
        }, function (error, response, body) {

        console.log('Status', response.statusCode);
        console.log('Headers', JSON.stringify(response.headers));
        console.log('Reponse received', body);

        // var feed = gtfsrb.FeedMessage.decode(new Buffer(body, 'base64'));

        // for (i = 0; i < feed.entity.length; i++) {

        //     console.log(feed.entity[i].vehicle);
        //     // console.log(feed.entity[i].vehicle.vehicle.label);

        // }

    });

};


// trainRequest('204461');

trainRequestPos('204410');

