'use strict';

describe('Controller: BenchmarksCtrl', function () {

  // load the controller's module
  beforeEach(module('pybrigVisApp'));

  var BenchmarksCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BenchmarksCtrl = $controller('BenchmarksCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
