angular.module('pybrigVisApp').service('BenchmarkService', ['SettingsService', '$log', '$http', function(SettingsService, $log, $http)
{
    var self = this;
    this.buildPath = function(path) {
        return SettingsService.getBaseUrl() + '/' + path;
    };
    this.getFetchUrl = function(path) {
        return SettingsService.getBaseUrl() + '/' + SettingsService.getIndexName() + '/' + path;
    }

    this.getBenchmarkList = function() {
        $log.info("Fetching list of benchmarks from " + self.buildPath('_mapping') + " ...");
        return $http.get(self.buildPath('_mapping')).then(
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
        $log.info("Fetching system information from " + self.getFetchUrl('system/info'));
        return $http.get(self.getFetchUrl(url)).then(
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
        $log.info("Fetching list of executions from " + self.getFetchUrl('_mapping') + " ...");
        return $http.get(self.getFetchUrl('_mapping')).then(
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

    this.getFieldList = function(item) {
        return [
            "benchmark.pcpu.system",
            "benchmark.pcpu.user",
            "benchmark.ctx.voluntary",
            "profile.timers.current",
            "profile.timers.mem",
            "profile.triggers.pending",
            "profile.triggers.total"
        ];
    };
    
    this.getFieldValues = function(trial, field) {
        var fields = field.split('.');
        if(fields.length <= 1) {
            $log.error("Invalid field target: " + field);
            return [];
        }
        var target = fields[0];
        return $http.get(self.getFetchUrl(trial + '/' + target)).then(function(result) {
            var list = [];
            for(var entry in result.data._source.data) {
                entry = result.data._source.data[entry];
                list.push(self.retrieveField(entry, field));
            }
            return list;
        });
    };

    this.getSystemInfo = function() {
        return this.getInfo('system/info');
    };

    this.getCaptureInfo = function() {
        return this.getInfo('capture/info');
    };

    this.retrieveField = function(data, field) {
        var fields = field.split('.');
        // First part before the '.' identifies the source of the data, so that can be ignored.
        for(var index = 1; index < fields.length; ++index) {
            data = data[fields[index]];
        }
        return data;
    };
}])
