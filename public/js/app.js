
var bridgeApp = angular.module('bridgeApp', ['ngRoute'], function ($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});

bridgeApp.controller('MainController', function ($scope, $route, $routeParams, $location) {
   $scope.$route = $route;
   $scope.$location = $location;
   $scope.$routeParams = $routeParams;
});

bridgeApp.controller('DraftsCtrl', function ($scope, $routeParams, $http) {
  $scope.draft_default = {
    container_name: null,
    cmd: null,
    rm: true,
    envs: [],
    links: [],
    ports: [],
  }

  $scope.current_draft = _.extend($scope.draft_default, {});

  $http.get('/api/drafts').success(function(data) {
    $scope.drafts = data;
  });

  //DRAFT api
  $scope.addEnv = function() {
    $scope.current_draft.envs.push({name: null, value: null});
  };

  $scope.addLink = function() {
    $scope.current_draft.links.push({name: null, name_container: null});
  };

  $scope.addPort = function() {
    $scope.current_draft.ports.push({container: null, host: null});
  };

  $scope.setDraft = function(draft) {
    $scope.current_draft = draft;
  };

  $scope.resetDraft = function(){
    $scope.current_draft = _.extend($scope.draft_default, {});
  };

  $scope.saveDraft = function(){
    var data = $scope.current_draft;

    if(data._id){

      $http.put('api/drafts/' + data._id, data).success(function(draft) {
        console.log("updated:", draft);
      }).error(function(data, status, headers, config) {
        console.error(data, status, headers, config);
      });

    }else{
      $http.post('api/drafts', data).success(function(draft) {

        $scope.current_draft = _.extend($scope.draft_default, {});
        $scope.drafts.push(draft);

      }).error(function(data, status, headers, config) {
        console.error(data, status, headers, config);
      });
    }

  };


  $scope.duplicateDraft = function(draft){
    var duplicate = _.extend(draft, {});
    delete duplicate['_id'];
    $scope.current_draft = duplicate
  };

  $scope.removeDraft = function(draft){
    $http.delete('api/drafts/'+ draft._id).success(function(data) {
      $scope.drafts = $scope.drafts.filter(function(c) {
        return c._id !== draft._id;
      });
    }).error(function(data, status, headers, config) {
      alert(data.reason + ":" + data.json);
      console.error(data, status, headers, config);
    });
  };

  $scope.runDraft = function(draft){
    $http.get('api/drafts/'+ draft._id + "/run").success(function(data) {

      alert("runned");

    }).error(function(data, status, headers, config) {
      console.error(data, status, headers, config);
      alert(data);
    });
  };

});

bridgeApp.controller('ImagesCtrl', function ($scope, $routeParams, $http) {

  $http.get('/api/images').success(function(data) {
    $scope.images = data;
  });
  // IMAGE STUFF
  $scope.pullImage = function(imageName){
    $scope.pulling = true;
    var imageName = encodeURIComponent(imageName);
    $http.get('api/images/pull?imageName='+imageName).success(function(image) {
      alert("image pulled");
      $scope.pulling = false;
    }).error(function(data, status, headers, config) {
      console.error(data, status, headers, config);
      $scope.pulling = false;
    });
  };

  $scope.removeImage = function(image){
    $http.delete('api/images/'+ image.Id).success(function(data) {
      $scope.images = $scope.images.filter(function(c) {
        return c.Id !== image.Id;
      });
    }).error(function(data, status, headers, config) {
      alert(data.reason + ":" + data.json);
      console.error(data, status, headers, config);
    });
  };

  $scope.checkImage = function(criteria){
    return function( image ) {
      return image.RepoTags[0] !== "<none>:<none>";
    };
  }


  $scope.showImage = function(image){
    $scope.selected_image = image;

    $http.get('api/images/'+image.Id+'/inspect').success(function(image) {

      $scope.selected_image = image;

    }).error(function(data, status, headers, config) {
      console.error(data, status, headers, config);
      $scope.pulling = false;
    });

  }


});

bridgeApp.controller('ContainersCtrl', function ($scope, $routeParams, $http, $window, $document, stdout) {

  //loader data
  $http.get('api/containers').success(function(data) {
    $scope.containers = data;
  });

  $scope.options = {
    following: true
  };

   // CONTAINER STUFF
  $scope.runContainer = function(imageName, containerName){
    var data = { image_name :imageName, container_name:containerName}
    $http.post('api/containers', data).success(function(container) {
      $scope.containers.push(container);
    }).error(function(data, status, headers, config) {
      console.error(data, status, headers, config);
    });
  };

  $scope.inspectContainer = function(container){
    $http.get('api/containers/'+ container.Id +'/inspect').success(function(data) {
      $scope.inspected_container = data;
    }).error(function(data, status, headers, config) {
      console.error(data, status, headers, config);
    });
  };

  $scope.requestContainerLogs = function(container){
    $scope.logOutput = '';
    stdout.subscribe('/api/containers/logs?containerId=' + container.Id, function (out) {
      // Append new output to console
      console.log(out);

      $scope.$apply(function() {
        $scope.logOutput = $scope.logOutput.concat(out);
      });

      // Scroll if following
      if ($scope.options.following) {
        $window.scrollTo(0, $document[0].body.scrollHeight);
      }
    });
  };

  $scope.startContainer = function(container){
    $http.get('api/containers/'+ container.Id + "/start").success(function(data) {
      alert("started");
    }).error(function(data, status, headers, config) {
      console.error(data, status, headers, config);
    });
  };

  $scope.stopContainer = function(container){
    $http.get('api/containers/'+ container.Id + "/stop").success(function(data) {
      alert("stopped");
    }).error(function(data, status, headers, config) {
      console.error(data, status, headers, config);
    });
  };

  $scope.removeContainer = function(container){
    $http.delete('api/containers/'+ container.Id).success(function(data) {
      $scope.containers = $scope.containers.filter(function(c) {
        return c.Id !== container.Id;
      });
    }).error(function(data, status, headers, config) {
      console.error(data, status, headers, config);
    });
  };
});


bridgeApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider.
      when('/containers', {
        templateUrl: 'partials/containers.html',
        controller: 'ContainersCtrl'
      }).
      when('/images', {
        templateUrl: 'partials/images.html',
        controller: 'ImagesCtrl'
      }).
      when('/drafts', {
        templateUrl: 'partials/drafts.html',
        controller: 'DraftsCtrl'
      }).
      otherwise({
        redirectTo: '/containers'
      });
}]);
