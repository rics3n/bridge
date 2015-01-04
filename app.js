var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var basicAuth = require('basic-auth');
var request = require('request');
var swig = require('swig');
var bodyParser = require('body-parser')
var fs = require('fs');
var Docker = require('dockerode');
var logger = require('morgan');

var jsonParser = bodyParser.json();

app.use(express.static(__dirname + '/public'));
app.use(logger('tiny'));

app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.engine('html', swig.renderFile);

var adminUsername = process.env.ADMIN_NAME;
var adminPassword = process.env.ADMIN_PASSWORD;

if(!adminUsername || !adminPassword){
  console.error("no ADMIN_NAME or ADMIN_PASSWORD env variable given.")
  process.exit(1);
}

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === adminUsername && user.pass === adminPassword) {
    return next();
  } else {
    return unauthorized(res);
  };
};

var getDocker = function() {
  if(process.env.DOCKER_CERT_PATH){ 

    var dockerHost = process.env.DOCKER_HOST
    var dockerCertPath = process.env.DOCKER_CERT_PATH

    return new Docker({
      host: "192.168.59.103",
      port: process.env.DOCKER_PORT || 2376,
      ca: fs.readFileSync(dockerCertPath + '/ca.pem'),
      cert: fs.readFileSync(dockerCertPath + '/cert.pem'),
      key: fs.readFileSync(dockerCertPath + '/key.pem')
    });

  }else if(process.env.DOCKER_UNIX_SOCKET_PATH){
    return new Docker({socketPath: process.env.DOCKER_UNIX_SOCKET_PATH});
  }else{
    console.error("no docker connection settings found. please see the docs for available options.")
    process.exit(1);
  }
}

var docker = getDocker();

docker.ping(function(err,pong) {
  if(err) {
    console.error("[DOCKER] ping:" + err);
    process.exit(1);
  }else{
    console.log("[DOCKER] ping:" + pong);    
  }
});

// interface: index

app.get('/', auth, function(req, res) {
  res.render('index.html');
});

// IMAGES

app.get('/images', auth, function(req, res) {
  docker.listImages( {all: true}, function (err, images) {
    if (err) {
      res.status(400).end(JSON.stringify(err));
      return;
    }
    res.end(JSON.stringify(images));
  });
});

app.get('/images/pull', jsonParser, function(req, res) {
  var imageName = req.query.imageName;

  console.log("pull image: ", imageName);

  docker.pull(imageName, function (err, stream, test) {
    if (err) {
      res.status(400).end(JSON.stringify(err));
      return;
    }

    stream.on('data', function(chunk){
      res.write(chunk);
    });

    stream.on('end', function(chunk){
      res.end(JSON.stringify({}));
    });

  });
});

app.delete('/images/:id', auth, function(req, res) {
  docker.getImage(req.params.id).remove(function(err, c) {
    if (err) {
      res.status(400).end(JSON.stringify(err));
      return;
    }
    res.status(204).end("removed");
  });
});

// CONTAINERS

app.get('/containers', auth, function(req, res) {
  docker.listContainers( {all: true}, function (err, containers) {
    if (err) {
      res.status(400).end(JSON.stringify(err));
      return;
    }
    res.end(JSON.stringify(containers));
  });
});


app.post('/containers', jsonParser, function(req, res) {
  docker.listContainers( {all: true}, function (err, containers) {
    if (err) {
      res.status(400).end(JSON.stringify(err));
      return;
    }
    
    var data = req.body
    
    var createOptions = {};
    var startOptions = {};

    docker.run(data.image_name, null , process.stdout, createOptions, startOptions, function(err, container){
      if (err) {
        res.status(400).end(JSON.stringify(err));
        return;
      }
      res.status(200).end(JSON.stringify(container));
    });

  });
});

app.delete('/containers/:id', auth, function(req, res) {
  docker.getContainer(req.params.id).remove(function(err, c) {
    if (err) {
      res.end(JSON.stringify(err));
      return;
    }

    res.sendStatus(204);
    res.end("removed");
  });
});

app.get('/containers/:id/start', auth, function(req, res) {
  var c = docker.getContainer(req.params.id)
  c.start(function (err, c) {
    if (err) {
      res.end(JSON.stringify(err));
      return;
    }
    res.sendStatus(204);
    res.end("started");
  });
});


app.get('/containers/:id/stop', auth, function(req, res) {
  var c = docker.getContainer(req.params.id)
  c.stop(function (err, c) {
    if (err) {
      res.end(JSON.stringify(err));
      return;
    }
    res.sendStatus(204);
    res.end(JSON.stringify(c));
  });
});


app.get('/containers/:id/inspect', auth, function(req, res) {
  var c = docker.getContainer(req.params.id)
  c.inspect(function (err, c) {
    if (err) {
      res.end(JSON.stringify(err));
      return;
    }
    res.end(JSON.stringify(c));
  });
});

app.get('/containers/:id/logs', auth, function(req, res) {
  var c = docker.getContainer(req.params.id)
  var opts = {
    stderr: 1,
    stdout: 1,
    timestamps: 1,
    follow: 1, 
    tail: 10 
  };

  c.logs(opts, function (err, stream) {
    if (err) {
      res.status(400).end(JSON.stringify(err));
      return;
    }
    
    stream.setEncoding('utf8');
    stream.on('data', function(chunk){

      //console.log(chunk.length);

      if(chunk.length > 8){
        var log = "["+req.params.id+"]" + chunk;
        io.sockets.emit('news', log);        
      }

    });

    stream.on('end', function(chunk){
      console.log("steam ended");
    });
  
    res.end("");
  });
});



app.get('/containers/:id/pull', auth, function(req, res) {

  var c = docker.getContainer(req.params.id)
  c.inspect(function (err, c) {
    if (err) {
      res.end(JSON.stringify(err));
      return;
    }

    var image = c.Image

    docker.pull(image, function(err, stream) {
      if (err) {
        res.end(JSON.stringify(err));
        return;
      }

      if(stream) {
        stream.on('data', function(chunk) {
          console.log('got %d bytes of data', chunk.length);
          res.write(chunk);
        });

        stream.on('end', function() {
          res.end("found");
        });            
      }

    });

  });

});

// websockets

io.on('connection', function (socket) {
  console.log("[Websockets] user connected");

  socket.emit('news', { hello: 'world' });

  socket.on('news', function (msg) { 
    console.log("[WEBSOCKETS]", message);
  });

 socket.on('message', function (msg) { 
    console.log("[WEBSOCKETS]", message);
  });

  socket.on('disconnect', function () {
    io.sockets.emit('user disconnected');
  });
});

// RECEIVE WEBHOOKS 

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

  console.log(jsonData);

  console.log("[autopull] starting");

  var tag = "latest"
  var repo = jsonData.repository.repo_name
  docker.pull( repo + ":" + tag, function (err, stream) {  

    if (err) {
      res.end(JSON.stringify(err));
      return;
    }

    if(stream) {
      stream.on('data', function(chunk) {
        console.log('[autopull]['+repo+'] got %d bytes of data', chunk.length);
      });

      stream.on('end', function() {
        console.log('[autopull]['+repo+'] image pulled')
      });            
    }

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

server.listen(8080);