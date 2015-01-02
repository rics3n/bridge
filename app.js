var express = require('express');
var basicAuth = require('basic-auth-connect');

var request = require('request');
var swig = require('swig');
var bodyParser = require('body-parser')

var fs = require('fs');
var Docker = require('dockerode');
var logger = require('morgan');

var username = 'docker'
var password = 'cont4iner'

var jsonParser = bodyParser.json();

var app = express();
//app.use(basicAuth(username, password));
app.use(express.static(__dirname + '/public'));
app.use(logger('tiny'));

app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.engine('html', swig.renderFile);


var dockerHost = process.env.DOCKER_HOST
var dockerCertPath = process.env.DOCKER_CERT_PATH

var docker = new Docker({
  host: "192.168.59.103",
  port: process.env.DOCKER_PORT || 2376,
  ca: fs.readFileSync(dockerCertPath + '/ca.pem'),
  cert: fs.readFileSync(dockerCertPath + '/cert.pem'),
  key: fs.readFileSync(dockerCertPath + '/key.pem')
});

docker.ping(function(err,pong) {
  if(err) {
    console.error("[DOCKER] ping:" + err);
    process.exit(1);
  }else{
    console.log("[DOCKER] ping:" + pong);    
  }
});

app.get('/', function(req, res) {
  res.render('index.html');
});

app.get('/containers', function(req, res) {
  docker.listContainers( {all: true}, function (err, containers) {
    if (err) {
      res.end(err);
      return;
    }
    res.end(JSON.stringify(containers));
  });
});


app.post('/webhooks', jsonParser, function(req, res) {
  if (!req.body) 
    return res.sendStatus(400);

  var jsonData = req.body;

  var callbackUrl = jsonData.callback_url;
  var callbackData = { state : 'Success' } ;

  request.post({url: callbackUrl, body: callbackData, json: true}, function(err, httpResponse, body) {
    if (err) {
      return console.error('[registry] upload failed:', err);
    }
    console.log('[registry] success callback called:' + callbackUrl);
  });

  if(process.env.SLACK_URL){
    var slackMsg = 'new image pushed in ' + jsonData.repository.repo_name;
    var slackUrl = process.env.SLACK_URL;

    request.post({url: slackUrl, body: { text : slackMsg } , json: true}, function(err, httpResponse, body) {
      if (err) {
        res.end('failed');
        return console.error('[Slack] failed:', err);
      }
      console.log('[Slack] message posted');
      res.end('OK');

    });
  }
  
  res.end("OK");
});

app.listen(8080);