﻿/// <reference path="Scripts/typings/angularjs/angular.d.ts" />

var app = angular.module('myApp', ['ngRoute']);

interface Car {
    Make: string; 
    Model: string;
}

// The Model part of MVC?
interface myAppScope extends ng.IScope {
    pgm : string
    debug_console : string
    run_cars(): void
    run_foo(): void
}

app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'homeController'
        })
        .when('/about', {
            templateUrl: 'views/about.html',
            controller: 'aboutController'
        })
        .otherwise({
            redirectTo: '/'
        });
});


app.controller("mainController", ['$scope', '$http', ($scope: myAppScope, $http: ng.IHttpService) => {
    var counter = [0, 1, 2];
    $scope.pgm = "test";
    $scope.debug_console = "dbg started";
    $scope.run_cars = () => {
        $scope.debug_console = "run_cars";
        $http.get("api/api/cars")
            .error(x => {
                console.log('error');
                console.log("<=:" + x);
                $scope.debug_console = "error";
            })
            .success((c: Car) => {
                console.log('success');
                console.log("<=:" + c)
                $scope.debug_console = c.Make + c.Model;
            })
    }

    $scope.run_foo = () => {
        $scope.debug_console = "run_foo";
        $http.get("api/api/foo")
            .error(x => {
                $scope.debug_console = "error";
            })
            .success((c: Car) => {
                $scope.debug_console = c.Make + c.Model;
            })
    };

}]);
