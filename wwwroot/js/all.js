/// <reference path="../models/project.ts" />
/// <reference path="../models/customer.ts" />
/// <reference path="../models/title.ts" />
var DataService = (function () {
    function DataService($http, $q) {
        this.$http = $http;
        this.$q = $q;
    }
    DataService.prototype.getProjects = function () {
        return this.$http.get("api/data/projects").then(function (r) { return r.data; });
    };
    DataService.prototype.getCustomers = function () {
        return this.$http.get("api/data/customers").then(function (r) { return r.data; });
    };
    DataService.prototype.getMyProjects = function () {
        return this.$http.get("api/data/my-projects").then(function (r) { return r.data; });
    };
    DataService.prototype.setMyProjects = function (projects) {
        return this.$http.put("api/data/my-projects", projects.map(function (p) { return p.id; }))
            .then(function (r) { return r.data; });
    };
    DataService.prototype.getTitles = function () {
        return this.$http.get("api/data/titles").then(function (r) { return r.data; });
    };
    DataService.prototype.getMyTitles = function () {
        return this.$http.get("api/data/my-titles").then(function (r) { return r.data; });
    };
    DataService.prototype.setMyTitles = function (titles) {
        return this.$http.put("api/data/my-titles", titles).then(function (r) { return r.data; });
    };
    DataService.prototype.getReports = function () {
        return this.$http.get("api/data/reports").then(function (r) { return r.data; });
    };
    DataService.prototype.getReport = function (file) {
        return this.$http.get("api/data/report/" + file).then(function (r) { return r.data; });
    };
    DataService.prototype.getData = function () {
        return this.$q.all([this.getProjects(), this.getCustomers(), this.getMyProjects()])
            .then(function (data) {
            var projects = data[0];
            var customers = data[1];
            var myProjectIds = data[2];
            var customerMap = {};
            var projectMap = {};
            customers.forEach(function (c) { return customerMap[c.id] = c; });
            projects.forEach(function (p) {
                p.customer = customerMap[p.customerId];
                p.customer.projects = p.customer.projects || [];
                p.customer.projects.push(p);
                projectMap[p.id] = p;
            });
            var myProjects = myProjectIds.map(function (id) { return projectMap[id]; });
            return { customers: customers, myProjects: myProjects };
        });
    };
    return DataService;
}());
/// <reference path="../models/customer.ts" />
/// <reference path="../services/data.ts" />
var CustomerList = (function () {
    function CustomerList() {
    }
    CustomerList.prototype.select = function (customer) {
        this.customer = customer;
    };
    CustomerList.prototype.$onInit = function () {
    };
    CustomerList.definition = {
        templateUrl: "components/customer-list.html",
        controller: CustomerList,
        controllerAs: "cl",
        bindings: {
            customers: "=",
            customer: "="
        }
    };
    return CustomerList;
}());
var ProjectList = (function () {
    function ProjectList() {
    }
    ProjectList.prototype.select = function (project) {
        var index = this.selectedProjects.indexOf(project);
        if (index > -1) {
            this.selectedProjects.splice(index, 1);
        }
        else {
            this.selectedProjects.push(project);
        }
    };
    ProjectList.prototype.isSelected = function (project) {
        return this.selectedProjects.indexOf(project) > -1;
    };
    ProjectList.prototype.$onInit = function () {
        if (!this.selectedProjects)
            this.selectedProjects = [];
    };
    ProjectList.definition = {
        templateUrl: "components/project-list.html",
        controller: ProjectList,
        controllerAs: "pl",
        bindings: {
            projects: "=",
            selectedProjects: "="
        }
    };
    return ProjectList;
}());
var MyTitles = (function () {
    function MyTitles(dataService) {
        this.dataService = dataService;
        this.selectedTitles = [];
    }
    MyTitles.prototype.$onInit = function () {
        var _this = this;
        var map = {};
        this.myTitles.forEach(function (t) { return map[t.name] = t; });
        this.titles.forEach(function (t, i) {
            var my = map[t.name];
            if (my) {
                _this.titles[i] = my;
            }
        });
    };
    MyTitles.prototype.select = function (title) {
        var index = this.selectedTitles.indexOf(title);
        if (index > -1) {
            this.selectedTitles.splice(index, 1);
        }
        else {
            this.selectedTitles.push(title);
        }
    };
    MyTitles.prototype.isSelected = function (title) {
        return this.selectedTitles.indexOf(title) > -1;
    };
    MyTitles.prototype.getUnassigned = function () {
        return this.titles.filter(function (r) { return angular.isUndefined(r.projectId); });
    };
    MyTitles.prototype.assign = function (project) {
        this.selectedTitles.forEach(function (t) { return t.projectId = project.id; });
        this.myTitles = this.myTitles.concat(this.selectedTitles);
        this.selectedTitles = [];
        this.project = project;
    };
    MyTitles.prototype.unassign = function (title) {
        var index = this.myTitles.indexOf(title);
        if (index > -1) {
            this.myTitles.splice(index, 1);
        }
        title.projectId = undefined;
    };
    MyTitles.prototype.saveMyTitles = function () {
        var _this = this;
        this.saving = true;
        this.dataService.setMyTitles(this.myTitles)
            .finally(function () { return _this.saving = false; });
    };
    MyTitles.definition = {
        templateUrl: "components/my-titles.html",
        controller: MyTitles,
        controllerAs: "mt",
        bindings: {
            titles: "=",
            myTitles: "=",
            myProjects: "="
        }
    };
    return MyTitles;
}());
var MyProjects = (function () {
    function MyProjects(dataService) {
        this.dataService = dataService;
    }
    MyProjects.prototype.deselect = function (project) {
        var index = this.myProjects.indexOf(project);
        if (index > -1) {
            this.myProjects.splice(index, 1);
        }
    };
    MyProjects.prototype.saveMyProjects = function () {
        var _this = this;
        this.saving = true;
        this.dataService.setMyProjects(this.myProjects).finally(function () { return _this.saving = false; });
    };
    MyProjects.definition = {
        templateUrl: "components/my-projects.html",
        controller: MyProjects,
        controllerAs: "mp",
        bindings: {
            customers: "=",
            myProjects: "="
        }
    };
    return MyProjects;
}());
var MyReports = (function () {
    function MyReports(dataService) {
        this.dataService = dataService;
    }
    MyReports.prototype.select = function (report) {
        var _this = this;
        this.report = report;
        this.dataService.getReport(this.report.name).then(function (items) { return _this.reportItems = items; });
    };
    MyReports.definition = {
        templateUrl: "components/my-reports.html",
        controller: MyReports,
        controllerAs: "mr",
        bindings: {
            reports: '='
        }
    };
    return MyReports;
}());
/// <reference path="components/customer-list.ts"  />
/// <reference path="components/project-list.ts"  />
/// <reference path="components/my-titles.ts"  />
/// <reference path="components/my-projects.ts"  />
/// <reference path="components/my-reports.ts"  />
/// <reference path="services/data.ts"  />
angular.module("app", ["ngRoute"])
    .service("dataService", DataService)
    .component("customerList", CustomerList.definition)
    .component("projectList", ProjectList.definition)
    .component("myProjects", MyProjects.definition)
    .component("myTitles", MyTitles.definition)
    .component("myReports", MyReports.definition)
    .config(function ($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider.when("/app/my-projects", {
        template: "<my-projects customers='$resolve.data.customers' my-projects='$resolve.data.myProjects' />",
        resolve: {
            data: function (dataService) {
                return dataService.getData();
            }
        }
    }).when("/app/my-titles", {
        template: "<my-titles titles='$resolve.titles' my-titles='$resolve.myTitles' my-projects='$resolve.data.myProjects' />",
        resolve: {
            titles: function (dataService) {
                return dataService.getTitles().then(function (titles) { return titles.map(function (t) { return { name: t }; }); });
            },
            myTitles: function (dataService) {
                return dataService.getMyTitles();
            },
            data: function (dataService) {
                return dataService.getData();
            }
        }
    }).when("/app/my-reports", {
        template: "<my-reports reports='$resolve.reports' />",
        resolve: {
            reports: function (dataService) {
                return dataService.getReports();
            }
        }
    }).otherwise({
        redirectTo: "/app/my-projects"
    });
});
