var http       = require('http')
  , AlexaSkill = require('./AlexaSkill')
  , APP_ID     = 'amzn1.ask.skill.29d6bbe6-b347-4873-886d-814ad8b32ba4';

var protobuf = require('protobufjs');
var request = require('request');
var gtfsrb = require('gtfs-realtime-bindings');

var url = 'https://api.transport.nsw.gov.au/v1/gtfs/realtime/buses/SMBSC006';
// Bus stops:
// 204034 - Marion St Near Flood (Inbound -  Leichhardt)
// 204081 - Marion St Near Flood (Outbound - City)
// 204040 - Marion St Near Elswick (Inbound - Leichhardt)
// 204038 - Marion St Near Elswick (Outbound - Coogee)

var requestOpenData = function(busStopId, callback) {
    request({
        url: url,
        headers: { 'authorization':'apikey l7xx8a3a4e8b896e480ab3995db597d64833' },
        method: 'GET',
        encoding: null
        }, function (error, response, body) {
        // console.log('Status', response.statusCode);
        // console.log('Headers', JSON.stringify(response.headers));
        // console.log('Reponse received', body);

        if (error) {
          return console.log('Error:', error);
        }

        if (response.statusCode !== 200) {
          return console.log('Invalid Status Code Returned:', response.statusCode);
        }

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

        callback(nextBus);
    });
};

var handleAlexaRequest = function(intent, session, response) {

  var stopNumber;

  switch (intent.slots.destination.value) {
    case 'the city':
      stopNumber = '204081';
      break;
    case 'Katies':
      stopNumber = '204038';
      break;
    case 'Sydney Uni':
      stopNumber = '204038';
      break;
    default:
      var notFound = 'That destination is not valid';
  }

  if (notFound) {
    var text = notFound;
    var cardText = "That destination is not valid";
    var heading = 'Next arrivals for destination: ' + intent.slots.destination.value;
    response.tellWithCard(text, heading, cardText);
  }
  else {
    requestOpenData(stopNumber, function(data){
        var text = data;
        var cardText = "The next bus is a " + data[0].number + " in " + data[0].time + " minutes, followed by a " + data[1].number + " in " + data[1].time + " minutes";
        var heading = 'Next arrivals for destination: ' + intent.slots.destination.value;
        response.tellWithCard(text, heading, cardText);
    });
  }
};


var BusSchedule = function(){
  AlexaSkill.call(this, APP_ID);
};

BusSchedule.prototype = Object.create(AlexaSkill.prototype);
BusSchedule.prototype.constructor = BusSchedule;

BusSchedule.prototype.eventHandlers.onSessionStarted = function(sessionStartedRequest, session){
  // What happens when the session starts? Optional
  console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
      + ", sessionId: " + session.sessionId);
};

BusSchedule.prototype.eventHandlers.onLaunch = function(launchRequest, session, response){
  // This is when they launch the skill but don't specify what they want. Prompt
  // them for their bus stop
  var output = 'Welcome to Trips. ' +
    'Say your destination to get the next arrivals.';

  var reprompt = 'Which destination do you need arrivals for?';

  response.ask(output, reprompt);

  console.log("onLaunch requestId: " + launchRequest.requestId
      + ", sessionId: " + session.sessionId);
};

BusSchedule.prototype.intentHandlers = {
  GetNextBusIntent: function(intent, session, response){
    handleAlexaRequest(intent, session, response);
  },

  HelpIntent: function(intent, session, response){
    var speechOutput = 'Get the next arrivals for your trip destination. ' +
      'Which destination would you like?';
    response.ask(speechOutput);
  }
};

exports.handler = function(event, context) {
    var skill = new BusSchedule();
    skill.execute(event, context);
};