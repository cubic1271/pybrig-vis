angular.module('pybrigVisApp').service('BenchmarkService', ['SettingsService', '$log', '$http', function(SettingsService, $log, $http)
{
    var curr = this;
    this.buildPath = function(path) {
        return SettingsService.getBaseUrl() + '/' + path;
    };
    this.getFetchUrl = function(path) {
        return SettingsService.getBaseUrl() + '/' + SettingsService.getIndexName() + '/' + path;
    }

    this.getBenchmarkList = function() {
        $log.info("Fetching list of benchmarks from " + curr.buildPath('_mapping') + " ...");
        return $http.get(curr.buildPath('_mapping')).then(
            function(result) {
                var list = [];
                if(result.status != 200) {
                    return [];
                }
                for(var key in result.data) {
                    if(result.data.hasOwnProperty(key)) {
                        list.push(key);
                    }
                }
                $log.info('Fetched ' + list.length + ' benchmarks.');
                $log.info(list);
                return list;
            }
        );
    };

    this.getInfo = function(url) {
        $log.info("Fetching system information from " + curr.getFetchUrl('system/info'));
        return $http.get(curr.getFetchUrl(url)).then(
            function(result) {
                if(result.status != 200) {
                    $log.warn('Could not retrieve ' + url + ' ...');
                    return null;
                }
                $log.info('Successfully retrieved ' + url + ' ...');
                $log.info(result.data._source);
                return result.data._source;
            }
        );
    };

    this.getExecutionList = function() {
        $log.info("Fetching list of executions from " + curr.getFetchUrl('_mapping') + " ...");
        return $http.get(curr.getFetchUrl('_mapping')).then(
            function(result) {
                var list = [];
                if(result.status != 200) {
                    return [];
                }
                var target = result.data[SettingsService.getIndexName()].mappings;
                for(var key in target) {
                    if(key == 'capture' || key == 'system') {
                        continue;
                    }
                    if(target.hasOwnProperty(key)) {
                        list.push(key);
                    }
                }
                $log.info('Fetched ' + list.length + ' items.');
                $log.info(list);
                return list;
            }
        );
    };

    this.getSystemInfo = function() {
        return this.getInfo('system/info');
    };

    this.getCaptureInfo = function() {
        return this.getInfo('capture/info');
    };
}]);
