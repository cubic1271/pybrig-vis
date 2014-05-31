'use strict';

angular.module('pybrigVisApp')
  .controller('DataController', ['$scope', '$log', 'SettingsService', 'BenchmarkService', function ($scope, $log, SettingsService, BenchmarkService) {

        $scope.datasets = {};
        $scope.timedata = {};
        $scope.pending = 0;
        $scope.total = 0;

        $scope.$on('$viewContentLoaded', function() {
            $scope.updateChartSize();
        });

        $scope.updateChartSize = function() {
            $(window).off('resize.chart');
            $(window).on('resize.chart', function() {
                $scope.updateChartSize();
                $scope.updateChart();
            });
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
            if(alpha < 1) {
                alpha *= 255;
                alpha = Math.round(alpha);
            }
            return 'rgba(' + (red + 128) % 255 + ', ' + (green + 128) % 255 + ', ' + (blue + 128) % 255 + ', ' + alpha + ')';
        }

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

        if(null == localStorage['data.show']) {
            $scope.setShownData([]);
        }
        if(null == localStorage['fields.show']) {
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

        $scope.updateDataSet = function() {
            if($scope.pending > 0) {
                $log.warn("Refusing to restart data set update before previous update has been completed ...");
                return;
            }
            $scope.datasets = {};
            $scope.timedata = {};
            // TODO: The number of requests here really kind of sucks ...
            $scope.pending = ($scope.shownData.length * $scope.shownFields.length) + (3 * $scope.shownData.length);
            $scope.total = $scope.pending;
            $scope.completed = 0;

            for(var item in $scope.shownData) {
                item = $scope.shownData[item];
                $scope.timedata[item] = {};
                $scope.datasets[item] = {};

                // First, make three calls to pull down timing data:
                // benchmark.ts -- timestamp at which a timestamp was requested
                // benchmark.lag -- how long it took the request to be processed
                // profile.ts -- timestamp at which a profile was recorded
                (function(item){
                    BenchmarkService.getFieldValues(item, 'benchmark.ts').then(function(result) {
                        $scope.timedata[item]['benchmark.ts'] = result;
                        $scope.pending -= 1;
                        $scope.completed = Math.round(100 * (1 - ($scope.pending / $scope.total)));
                        $log.info("Fetch completed.  (" + $scope.pending + " remaining)");
                        $scope.updateChart();
                    });

                    BenchmarkService.getFieldValues(item, 'benchmark.lag').then(function(result) {
                        $scope.timedata[item]['benchmark.lag'] = result;
                        $scope.pending -= 1;
                        $scope.completed = Math.round(100 * (1 - ($scope.pending / $scope.total)));
                        $log.info("Fetch completed.  (" + $scope.pending + " remaining)");
                        $scope.updateChart();
                    });

                    BenchmarkService.getFieldValues(item, 'profile.ts').then(function(result) {
                        $scope.timedata[item]['profile.ts'] = result;
                        $scope.pending -= 1;
                        $scope.completed = Math.round(100 * (1 - ($scope.pending / $scope.total)));
                        $log.info("Fetch completed.  (" + $scope.pending + " remaining)");
                        $scope.updateChart();
                    });
                })(item);

                for(var field in $scope.shownFields) {
                    field = $scope.shownFields[field];
                    // wrap in an anonymous function to make sure the variables are available to 'then'.
                    (function(item, field) {
                        BenchmarkService.getFieldValues(item, field).then(function(result) {
                            $scope.datasets[item][field] = result;
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
                return;
            }

            var chart = {};
            chart.width = $('#graphSizer').innerWidth();
            chart.height = 0.5 * chart.width;

            chart.series = [];

            // trial results ...
            for(var item in $scope.datasets) {
                if(!$scope.datasets.hasOwnProperty(item)) {
                    continue;
                }
                var times = $scope.timedata[item];
                // field values ...
                for(var field in $scope.datasets[item]) {
                    if(!$scope.datasets[item].hasOwnProperty(field)) {
                        continue;
                    }
                    var currData = [];
                    var xCounter = 0;
                    var xCompute = function() { return 0; }

                    // If this is a benchmark field, X is the timestamp + the lag
                    if(field.search('benchmark.') != -1) {
                        xCompute = function(item, index) {
                            return $scope.timedata[item]['benchmark.ts'][index] + $scope.timedata[item]['benchmark.lag'][index];
                        }
                    }
                    // Otherwise, X is just the timestamp
                    else if(field.search('profile.') != -1) {
                        xCompute = function(item, index) {
                            return $scope.timedata[item]['profile.ts'][index];
                        }
                    }
                    else {
                        $log.error("Unable to load timing information for: " + item + "/" + field);
                    }
                    // iterate across all the elements in the array and build a data set...
                    for(var entry in $scope.datasets[item][field]) {
                        var result = xCompute(item, xCounter);
                        if(typeof result == "undefined") {
                            $log.warn("No data found for X: " + item + "/" + field + ":" + entry);
                            continue;
                        }
                        if(typeof $scope.datasets[item][field][entry] == "undefined") {
                            $log.warn("No data found for Y:" + item + "/" + field + ":" + entry);
                            continue;
                        }
                        currData.push({
                            x:result,
                            y:$scope.datasets[item][field][entry]
                        });
                        xCounter++;
                    }
                    chart.series.push({
                        name: item + '/' + field,
                        data: currData,
                        color: $scope.getColorString(item + '/' + field, 128)
                    });
                }
            }

            $('#graphDiv').html('');
            $('#graphLegend').html('');

            var graph = new Rickshaw.Graph({
                interpolation: 'linear',
                element: document.querySelector("#graphDiv"),
                width: chart.width,
                height: chart.height,
                renderer: "line",
                stroke: true,
                series: chart.series
            });

            new Rickshaw.Graph.Axis.Y({
                graph: graph
            });

            new Rickshaw.Graph.Axis.Time({
                graph: graph
            });

            graph.render();

            var slider = new Rickshaw.Graph.RangeSlider({
                graph: graph,
                element: document.querySelector('#graphSlider')
            });

            var legend = new Rickshaw.Graph.Legend( {
                graph: graph,
                element: document.querySelector('#graphLegend')

            } );

            var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
                graph: graph,
                legend: legend
            } );

            var order = new Rickshaw.Graph.Behavior.Series.Order( {
                graph: graph,
                legend: legend
            } );

            var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
                graph: graph,
                legend: legend
            } );
        };
  }]);
