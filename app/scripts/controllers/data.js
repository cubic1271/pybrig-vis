'use strict';

angular.module('pybrigVisApp')
  .controller('DataController', ['$scope', '$log', 'SettingsService', 'BenchmarkService', function ($scope, $log, SettingsService, BenchmarkService) {

        $scope.datasets = {};
        $scope.pending = 0;
        $scope.total = 0;

        $scope.setShownData = function(updated) {
            localStorage['data.show'] = JSON.stringify(updated);
        }

        $scope.getShownData = function() {
            return JSON.parse(localStorage['data.show']);
        }

        $scope.setShownFields = function(updated) {
            localStorage['fields.show'] = JSON.stringify(updated);
        }

        $scope.getShownFields = function() {
            return JSON.parse(localStorage['fields.show']);
        }

        if(null == $scope.getShownData()) {
            $scope.setShownData([]);
        }
        if(null == $scope.getShownFields()) {
            $scope.setShownFields([]);
        }

        $scope.shownData = $scope.getShownData();
        $scope.shownFields = $scope.getShownFields();
        $scope.availableData = [];

        BenchmarkService.getExecutionList().then(function(result) {
            $scope.availableData = [];

            // initial pass to make sure all elements in shown data are valid with the current data set ...
            for(var item in $scope.shownData) {
                var currIndex = item;
                item = $scope.shownData[item];
                if(result.indexOf(item) == -1) {
                    $scope.shownData.splice(currIndex, 1);
                    $log.warn('Removing unknown item: ' + item);
                }
            }
            for(var item in result) {
                item = result[item];
                if($scope.shownData.indexOf(item) == -1) {
                    $scope.availableData.push(item);
                }
            }

            $scope.availableData = $scope.availableData.sort();
            $scope.shownData = $scope.shownData.sort();
            $scope.setShownData($scope.shownData);

            // NOTE: Not a promise here because this is populated manually for the moment...
            $scope.availableFields = [];
            result = BenchmarkService.getFieldList().sort();

            // initial pass to make sure all elements in shown data are valid with the current data set ...
            for(var item in $scope.shownFields) {
                var currIndex = item;
                item = $scope.shownFields[item];
                if(result.indexOf(item) == -1) {
                    $scope.shownFields.splice(currIndex, 1);
                    $log.warn('Removing unknown field: ' + item);
                }
            }
            for(var item in result) {
                item = result[item];
                if($scope.shownFields.indexOf(item) == -1) {
                    $scope.availableFields.push(item);
                }
            }
            $scope.setShownFields($scope.shownFields);
        });

        $scope.addDataItem = function(item) {
            $scope.shownData.push(item);
            $scope.shownData = $scope.shownData.sort();
            $scope.setShownData($scope.shownData);
            var index = $scope.availableData.indexOf(item);
            if(index != -1) {
                $scope.availableData.splice(index, 1);
            }
        };

        $scope.removeDataItem = function(item) {
            $scope.availableData.push(item);
            $scope.availableData = $scope.availableData.sort();
            var index = $scope.shownData.indexOf(item);
            if(index != -1) {
                $scope.shownData.splice(index, 1);
                $scope.setShownData($scope.shownData);
            }
        };
        
        $scope.addFieldItem = function(item) {
            $scope.shownFields.push(item);
            $scope.shownFields = $scope.shownFields.sort();
            $scope.setShownFields($scope.shownFields);
            var index = $scope.availableFields.indexOf(item);
            if(index != -1) {
                $scope.availableFields.splice(index, 1);
            }
        };

        $scope.removeFieldItem = function(item) {
            $scope.availableFields.push(item);
            $scope.availableFields = $scope.availableFields.sort();
            var index = $scope.shownFields.indexOf(item);
            if(index != -1) {
                $scope.shownFields.splice(index, 1);
                $scope.setShownFields($scope.shownFields);
            }
        };


        $scope.getColorString = function(str, alpha) {
            // Make sure the string is at least 2500 characters long ...
            if(str.length < 2500) {
                for(var i = str.length; i < 2500; ++i) {
                    str += str.charCodeAt(0);
                }
            }
            // Build a generic hash (http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery)
            var hash = 0, i, chr, len;
            if (str.length == 0) return hash;
            for (i = 0, len = str.length; i < len; i++) {
                chr   = str.charCodeAt(i);
                hash  = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            // Grab 24 bits to compose the color value ...
            var red = (hash & 0x00ff0000) >> 16;
            var green = (hash & 0x0000ff00) >> 8;
            var blue = (hash & 0x000000ff);
            return 'rgba(' + (red + 128) + ', ' + (green + 128) + ', ' + (blue + 128) + ', ' + alpha + ')';
        }

        $scope.updateDataSet = function() {
            if($scope.pending > 0) {
                $log.warn("Refusing to restart data set update before previous update has been completed ...");
                return;
            }
            $scope.datasets = {};
            $scope.pending = $scope.shownData.length * $scope.shownFields.length;
            $scope.total = $scope.pending;
            $scope.completed = 0;

            for(var item in $scope.shownData) {
                item = $scope.shownData[item];
                $scope.datasets[item] = {};
                for(var field in $scope.shownFields) {
                    field = $scope.shownFields[field];
                    $log.info("Fetching: " + item + " -- " + field);
                    // wrap in an anonymous function to make sure the variables are available to 'then'.
                    (function(item, field) {
                        BenchmarkService.getFieldValues(item, field).then(function(result) {
                            $log.info("Fetched: " + item + " -- " + field);
                            $scope.datasets[item][field] = result;
                            $log.info($scope.datasets[item][field]);
                            $scope.pending -= 1;
                            $scope.completed = Math.round(100 * (1 - ($scope.pending / $scope.total)));
                            $log.info("Fetch completed.  (" + $scope.pending + " remaining)");
                            $scope.updateChart();
                        });
                    })(item, field);
                }
            }
        };

        $scope.updateChart = function() {
            if($scope.pending > 0) {
                $log.warn("Refusing to update chart before fetch has been completed.");
            }
            $log.info($scope.datasets);
        };
  }]);
