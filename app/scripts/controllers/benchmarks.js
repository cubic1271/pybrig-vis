'use strict';

angular.module('pybrigVisApp')
  .controller('BenchmarksController', ['$scope', '$log', 'SettingsService', 'BenchmarkService', function ($scope, $log, SettingsService, BenchmarkService) {
    $scope.benchmarks = [ ];
    BenchmarkService.getBenchmarkList().then(function(result) {
        $scope.benchmarks = result;
    });
    $scope.getSelectedBenchmark = function() {
        return SettingsService.getIndexName();
    }

    $scope.updateSelectedBenchmark = function(benchmark) {
        $log.info('Updating selected benchmark: ' + benchmark);
        SettingsService.setIndexName(benchmark);
    }
  }]);
