'use strict';

angular.module('pybrigVisApp')
  .controller('CaptureController', ['$scope', '$log', 'BenchmarkService', function ($scope, $log, BenchmarkService) {
    $scope.aggregate = false;
    $scope.pps = true;
    $scope.capture = {};
    $scope.titles = [];

    $scope.protocols = [];
    $scope.datasets = {};
    $scope.chart = {};
    $scope.protocol_translate = {'T':'TCP', 'U':'UDP', 'I':'ICMP', '-':'Unknown'};

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

    $scope.updateChart = function() {
        var chart = {};
        chart.width = $('#graphSizer').innerWidth();
        chart.height = 0.5 * chart.width;

//        chart.renderer = "area";
//        chart.stroke = true;
        chart.series = [];

        for(var item in $scope.datasets) {
            if($scope.datasets.hasOwnProperty(item)) {
                chart.series.push(
                    {
                        name: $scope.protocol_translate.hasOwnProperty(item) ? $scope.protocol_translate[item] : item,
                        data: $scope.datasets[item],
                        color: $scope.getColorString(item, 128)
                    }
                );
            }
        }

        // Need to explicitly clear the graph and the legend ...
        $('#graphDiv').html('');
        $('#graphLegend').html('');

        $log.info($scope.datasets);

        var graph = new Rickshaw.Graph({
            interpolation: 'linear',
            element: document.querySelector("#graphDiv"),
            width: chart.width,
            height: chart.height,
            renderer: "line",
            stroke: true,
            series: chart.series
        });
        $log.info('Graph object created ...');
//        graph.renderer.unstack = true;

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

    }

    $scope.rebuildCaptureInfo = function(result) {
        $scope.protocols = [];
        $scope.datasets = {};

        for(var item in result.counters_list) {
            for(var proto in result.counters_list[item]) {
                if(result.counters_list[item].hasOwnProperty(proto)) {
                    if($scope.protocols.indexOf(proto) == -1) {
                        $scope.protocols.push(proto);
                    }
                }
            }
        }

        $scope.protocols.push('Total');

        for(var item in $scope.protocols) {
            $scope.datasets[$scope.protocols[item]] = [];
            if(! $scope.protocol_translate.hasOwnProperty($scope.protocols[item])) {
                $scope.protocol_translate[$scope.protocols[item]] = $scope.protocols[item];
            }
        }

        $log.info('Compiling data sets ...');
        var xCount = 0;
        for(var item in result.counters_list) {
            var target = result.counters_list[item];
            var cumulative = 0;
            for(var proto in $scope.protocols) {
                proto = $scope.protocols[proto];
                // special case since we're aggregating packets ...
                if(proto == 'Total') {
                    continue;
                }
                if(target.hasOwnProperty(proto)) {
                    // If we're aggregating, build a cumulative count ...
                    if($scope.aggregate && $scope.datasets[proto].length >= 1) {
                        $scope.datasets[proto].push({
                            x: xCount * result.incr,
                            y: target[proto] + $scope.datasets[proto][$scope.datasets[proto].length - 1].y
                        });
                    }
                    else if($scope.pps) {
                        $scope.datasets[proto].push({
                            x: xCount * result.incr,
                            y: target[proto] / result.incr
                        });
                    }
                    else {
                        $scope.datasets[proto].push({
                            x: xCount * result.incr,
                            y: target[proto]
                        });
                    }
                    cumulative += target[proto];
                }
                else {
                    $scope.datasets[proto].push({
                        x: xCount * result.incr,
                        y: 0
                    });
                }
            }
            if($scope.aggregate && $scope.datasets['Total'].length >= 1) {
                $scope.datasets['Total'].push({
                    x: xCount * result.incr,
                    y: cumulative + $scope.datasets['Total'][$scope.datasets['Total'].length - 1]
                });
            }
            else if($scope.pps) {
                $scope.datasets['Total'].push({
                    x: xCount * result.incr,
                    y: cumulative / result.incr
                });
            }
            else {
                $scope.datasets['Total'].push({
                    x: xCount * result.incr,
                    y: cumulative
                });
            }

            xCount++;
        }

        for(var proto in $scope.protocols) {
            proto = $scope.protocols[proto];
            $log.info("Dataset " + proto + ": " + $scope.datasets[proto].length + " entries");
            $log.info($scope.datasets[proto]);
        }

        $log.info('Building initial chart ...');
        $scope.updateChart();
    }

    BenchmarkService.getCaptureInfo().then(function(result) {
        $scope.capture = result;
        $scope.capture.duration = Number(($scope.capture.duration / 3600.0).toFixed(3));
        $scope.rebuildCaptureInfo(result);
    });

    $scope.toggleAggregate = function() {
        $scope.aggregate = !$scope.aggregate;

        if($scope.pps && $scope.aggregate) {
            $scope.pps = false;
        }
        $log.info('Updating aggregate to "' + $scope.aggregate + '"');
        $scope.rebuildCaptureInfo($scope.capture);
        $scope.updateChart();
    };

    $scope.togglePacketsPerSecond = function() {
        $scope.pps = !$scope.pps;
        if($scope.pps && $scope.aggregate) {
            $scope.aggregate = false;
        }
        $log.info('Updating pps to "' + $scope.pps + '"');
        $scope.rebuildCaptureInfo($scope.capture);
        $scope.updateChart();
    }
  }]);
