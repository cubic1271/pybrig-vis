'use strict';

angular.module('pybrigVisApp').controller('SettingsController', ['$scope', '$log', 'SettingsService', function ($scope, $log, SettingsService) {
    $scope.indexName = SettingsService.getIndexName();
    $scope.baseUrl = SettingsService.getBaseUrl();

    $scope.updateBaseUrl = function(url) {
        $log.info("Updating base URL: " + url);
        SettingsService.setBaseUrl(url);
    }
}]);
