'use strict';

angular.module('pybrigVisApp')
  .controller('SystemController', ['$scope', '$log', 'BenchmarkService', function ($scope, $log, BenchmarkService) {
    $scope.system = null;
    $scope.target = [];

    BenchmarkService.getSystemInfo().then(function(data) {
        $scope.system = data;
        // Do a bit of post-processing to make the sysctl / facter values easier to work with
        $scope.sysctl = $scope.getSysctlEntries();
        $scope.facter = $scope.getFacterEntries();
    });

    $scope.updateDisplayTarget = function(target) {
        if(target == 'sysctl') {
            $scope.target = $scope.sysctl;
        }
        else if(target == 'facter') {
            $scope.target = $scope.facter;
        }
        else {
            $scope.target = [];
        }
    };

    $scope.getSysctlEntries = function()
    {
        if(null == $scope.system) {
            return [];
        }
        var list = [];
        for(var item in $scope.system.sysctl) {
            if($scope.system.sysctl.hasOwnProperty(item)) {
                list.push({
                    'key': item,
                    'value': $scope.system.sysctl[item]
                });
            }
        }
        return list;
    }

    $scope.getFacterEntries = function() {
        if(null == $scope.system) {
            return [];
        }
        var list = [];
        for(var item in $scope.system.facter) {
            if($scope.system.facter.hasOwnProperty(item)) {
                list.push({
                    'key': item,
                    'value': $scope.system.facter[item]
                });
            }
        }
        return list;
    }
  }]);
