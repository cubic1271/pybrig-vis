'use strict';

angular.module('pybrigVisApp')
  .controller('DataController', ['$scope', '$log', 'SettingsService', 'BenchmarkService', function ($scope, $log, SettingsService, BenchmarkService) {
        $scope.availableData = [];

        BenchmarkService.getExecutionList().then(function(result) {
            $scope.availableData = result;
        });

        $scope.setShownData = function(updated) {
            localStorage['data.show'] = updated;
        }

        $scope.getShownData = function() {
            return localStorage['data.show'];
        }

        $scope.setShownFields = function(updated) {
            localStorage['fields.show'] = updated;
        }

        $scope.getShownFields = function() {
            return localStorage['fields.show'];
        }

        if(null == $scope.getShownData()) {
            $scope.setShownData([]);
        }
        if(null == $scope.getShownFields()) {
            $scope.setShownFields([]);
        }

        $scope.shownData = $scope.getShownData();
        $scope.shownFields = $scope.getShownFields();
  }]);
