'use strict';

angular.module('pybrigVisApp', [])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainController'
      })
      .when('/capture', {
        templateUrl: 'views/capture.html',
        controller: 'CaptureController'
      })
      .when('/help', {
        templateUrl: 'views/help.html',
        controller: 'HelpController'
      })
      .when('/system', {
        templateUrl: 'views/system.html',
        controller: 'SystemController'
      })
      .when('/data', {
        templateUrl: 'views/data.html',
        controller: 'DataController'
      })
      .when('/benchmarks', {
        templateUrl: 'views/benchmarks.html',
        controller: 'BenchmarksController'
      })
      .when('/settings', {
        templateUrl: 'views/settings.html',
        controller: 'SettingsController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
