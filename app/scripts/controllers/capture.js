'use strict';

angular.module('pybrigVisApp')
  .controller('CaptureController', ['$scope', '$log', 'BenchmarkService', function ($scope, $log, BenchmarkService) {
    $scope.aggregate = false;
    $scope.pps = true;
    $scope.capture = {};
    $scope.titles = [];

    $scope.color = {};
    $scope.enabled = {};
    $scope.protocols = [];
    $scope.datasets = {};
    $scope.chart = {};
    $scope.protocol_translate = {'T':'TCP', 'U':'UDP', 'I':'ICMP', '-':'Unknown'};

    $scope.$on('$viewContentLoaded', function() {
        $scope.updateChartSize();
    });

    $scope.updateChartSize = function() {
        // TODO: angular-ify?
        $scope.chartContext = $('#captureGraph').get(0).getContext('2d');
        var targetWidth = window.innerWidth * 0.92;
        $('#captureGraph').attr('width', targetWidth);
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
        return 'rgba(' + (red + 128) + ', ' + (green + 128) + ', ' + (blue + 128) + ', ' + alpha + ')';
    }

    $scope.updateEnabled = function(proto, value) {
        $scope.enabled[proto] = value;
        $scope.updateChart();
    }

    $scope.updateChart = function() {
        var chart = {};

        // compose labels ...
        var labels = [];
        for(var counter = 0; counter < $scope.capture.resolution; ++counter) {
            labels.push(counter);
        }
        chart.labels = labels;

        // ... and compose data sets ...
        var info = [];

        for(var proto in $scope.protocols) {
            proto = $scope.protocols[proto];
            if($scope.enabled[proto]) {
                var curr = {};
                curr.data = $scope.datasets[proto];
                curr.fillColor = $scope.getColorString(proto, 0.5);
                curr.strokeColor = $scope.getColorString(proto, 1.0);
                curr.pointColor = $scope.getColorString(proto, 1.0);
                curr.pointStrokeColor = '#fff';
                info.push(curr);
            }

        }

        chart.datasets = info;
        new Chart($scope.chartContext).Line(chart, {labelSkip: 10 });
    }

    $scope.rebuildCaptureInfo = function(result) {
        $scope.color = {};
        $scope.enabled = {};
        $scope.protocols = [];
        $scope.datasets = {};

        for(var item in result.counters_list) {
            for(var proto in result.counters_list[item]) {
                if(result.counters_list[item].hasOwnProperty(proto)) {
                    var do_insert = true;
                    for(var res in $scope.protocols) {
                        if($scope.protocols[res] == proto) {
                            do_insert = false;
                        }
                    }
                    if(do_insert) {
                        $scope.protocols.push(proto);
                    }
                }
            }
        }

        $scope.protocols.push('Total');

        for(var item in $scope.protocols) {
            $scope.datasets[$scope.protocols[item]] = [];
            $scope.enabled[$scope.protocols[item]] = true;
            $scope.color[$scope.protocols[item]] = $scope.getColorString($scope.protocols[item], 0.33);
            if(! $scope.protocol_translate.hasOwnProperty($scope.protocols[item])) {
                $scope.protocol_translate[$scope.protocols[item]] = $scope.protocols[item];
            }
        }

        $log.info('Compiling data sets ...');
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
                        $scope.datasets[proto].push(target[proto] + $scope.datasets[proto][$scope.datasets[proto].length - 1]);
                    }
                    else if($scope.pps) {
                        $scope.datasets[proto].push(target[proto] / result.incr);
                    }
                    else {
                        $scope.datasets[proto].push(target[proto]);
                    }
                    cumulative += target[proto];
                }
                else {
                    $scope.datasets[proto].push(0);
                }
            }
            if($scope.aggregate && $scope.datasets['Total'].length >= 1) {
                $scope.datasets['Total'].push(cumulative + $scope.datasets['Total'][$scope.datasets['Total'].length - 1])
            }
            else if($scope.pps) {
                $scope.datasets['Total'].push(cumulative / result.incr);
            }
            else {
                $scope.datasets['Total'].push(cumulative);
            }
        }

        for(var proto in $scope.protocols) {
            proto = $scope.protocols[proto];
            $log.info("Dataset " + proto + ": " + $scope.datasets[proto].length + " entries");
        }

        $log.info('Building initial chart ...');
        $scope.updateChart();
    }

    BenchmarkService.getCaptureInfo().then(function(result) {
        $scope.capture = result;
        $scope.capture.duration = Number(($scope.capture.duration / 3600.0).toFixed(3));
        $scope.rebuildCaptureInfo(result);
    });

    $scope.updateAggregate = function(value) {
        $scope.aggregate = value;
        if($scope.pps && $scope.aggregate) {
            $scope.pps = false;
        }
        $log.info('Updating aggregate to "' + $scope.aggregate + '"');
        $scope.rebuildCaptureInfo($scope.capture);
        $scope.updateChart();
    };

    $scope.updatePacketsPerSecond = function(value) {
        $scope.pps = value;
        if($scope.pps && $scope.aggregate) {
            $scope.aggregate = false;
        }
        $log.info('Updating pps to "' + $scope.pps + '"');
        $scope.rebuildCaptureInfo($scope.capture);
        $scope.updateChart();
    }
  }]);
