angular.module('pybrigVisApp').service('SettingsService', [
    function() {
        // Getters / setters
        this.getBaseUrl = function () {
            return localStorage['baseUrl'];
        };

        this.setBaseUrl = function(url) {
            localStorage['baseUrl'] = url;
        };

        this.getIndexName = function() {
            return localStorage['indexName'];
        }

        this.setIndexName = function(name) {
            localStorage['indexName'] = name;
        }

        // Initialize settings ...
        if(null == localStorage['baseUrl']) {
            this.setBaseUrl('http://localhost:9200');
        }

        if(null == localStorage['indexName']) {
            this.setIndexName('benchmark');
        }
    }
]);
