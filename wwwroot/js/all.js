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
    DataService.prototype.getTypes = function () {
        return this.$http.get("api/data/types").then(function (r) { return r.data; });
    };
    DataService.prototype.getMyProjects = function () {
        return this.$http.get("api/data/my-projects").then(function (r) { return r.data; });
    };
    DataService.prototype.setMyProjects = function (projects) {
        return this.$http.put("api/data/my-projects", projects.map(function (p) { return p.id; }))
            .then(function (r) { return r.data; });
    };
    DataService.prototype.getTitles = function (date) {
        return this.$http.get("api/data/titles/" + date).then(function (r) { return r.data; });
    };
    DataService.prototype.getMyTitles = function () {
        return this.$http.get("api/data/my-titles").then(function (r) { return r.data; });
    };
    DataService.prototype.setMyTitles = function (titles) {
        return this.$http.put("api/data/my-titles", titles).then(function (r) { return r.data; });
    };
    DataService.prototype.getReports = function (date) {
        return this.$http.get("api/data/reports/" + date).then(function (r) { return r.data; });
    };
    DataService.prototype.getReport = function (file) {
        return this.$http.get("api/data/report/" + file).then(function (r) { return r.data; });
    };
    DataService.prototype.sync = function () {
        return this.$http.post("api/data/sync", {}).then(function (r) { return r.data; });
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
    function MyTitles(dataService, $routeParams, $location) {
        this.dataService = dataService;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.selectedTitles = [];
        this.date = this.$routeParams["date"];
        this.limit = 60;
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
    MyTitles.prototype.selectType = function (type) {
        this.type = type;
    };
    MyTitles.prototype.isSelected = function (title) {
        return this.selectedTitles.indexOf(title) > -1;
    };
    MyTitles.prototype.getUnassigned = function () {
        var _this = this;
        return this.titles
            .filter(function (r) { return angular.isUndefined(r.projectId); })
            .filter(function (r) { return r.count >= _this.limit; });
    };
    MyTitles.prototype.assign = function (project) {
        var _this = this;
        this.project = project;
        if (this.project && (this.type || this.isPersonal(this.project))) {
            this.selectedTitles.forEach(function (t) {
                t.projectId = project.id;
                t.typeId = _this.isPersonal(project) ? -1 : _this.type.id;
            });
            this.myTitles = this.myTitles.concat(this.selectedTitles);
            this.selectedTitles = [];
        }
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
    MyTitles.prototype.isPersonal = function (project) {
        return project.id === -1;
    };
    MyTitles.prototype.hasItems = function (type) {
        var _this = this;
        return this.myTitles.some(function (t) { return _this.project && t.projectId === _this.project.id && t.typeId == type.id; });
    };
    MyTitles.prototype.dateChange = function () {
        if (this.date != "" && this.date != this.$routeParams["date"])
            this.$location.path("/app/my-titles/" + this.date);
    };
    MyTitles.definition = {
        templateUrl: "components/my-titles.html",
        controller: MyTitles,
        controllerAs: "mt",
        bindings: {
            titles: "=",
            myTitles: "=",
            myProjects: "=",
            types: "="
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
    function MyReports(dataService, $routeParams, $location) {
        this.dataService = dataService;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.target = 28800;
        this.step = 900;
        this.date = this.$routeParams["date"];
    }
    MyReports.prototype.select = function (report) {
        var _this = this;
        this.report = report;
        this.dataService.getReport(this.report.name).then(function (items) {
            _this.reportItems = _this.process(items.filter(function (r) { return r.project.id !== -1; }));
            _this.personal = items.filter(function (r) { return r.project.id === -1; })[0];
        });
    };
    MyReports.prototype.dateChange = function () {
        if (this.date != "" && this.date != this.$routeParams["date"])
            this.$location.path("/app/my-reports/" + this.date);
    };
    MyReports.prototype.process = function (items) {
        var _this = this;
        if (items.length > 0) {
            var total = items.reduce(function (s, item) { return item.seconds + s; }, 0);
            var factor = total / this.target;
            var values = items.map(function (item) {
                var value = (item.seconds / factor) / _this.step;
                return { value: value, decimal: value - Math.floor(value), item: item };
            });
            values.sort(function (a, b) { return a.value - b.value; });
            var targetSum = this.target / this.step;
            var index = 0;
            while (values[index].value < 1 && index < values.length) {
                values[index].value = 1;
                index++;
            }
            var lowSum = values.reduce(function (s, item, i) {
                return s + Math.floor(item.value);
            }, 0);
            var count = targetSum - lowSum;
            values.sort(function (a, b) { return a.value == 1 ? (b.value == 1 ? 0 : -1) : b.decimal - a.decimal; });
            values.forEach(function (item, i) {
                var value = (i < index + count) ?
                    Math.ceil(item.value) : Math.floor(item.value);
                item.item.adjustedSeconds = value * _this.step;
            });
        }
        return items;
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
var Sync = (function () {
    function Sync(dataService) {
        this.dataService = dataService;
    }
    Sync.prototype.sync = function () {
        var _this = this;
        this.loading = true;
        this.success = false;
        this.error = false;
        this.dataService.sync()
            .then(function () { return _this.success = true; })
            .catch(function () { return _this.error = true; })
            .finally(function () { return _this.loading = false; });
    };
    Sync.definition = {
        templateUrl: "components/sync.html",
        controller: Sync,
        controllerAs: "sync"
    };
    return Sync;
}());
/// <reference path="components/customer-list.ts"  />
/// <reference path="components/project-list.ts"  />
/// <reference path="components/my-titles.ts"  />
/// <reference path="components/my-projects.ts"  />
/// <reference path="components/my-reports.ts"  />
/// <reference path="components/sync.ts"  />
/// <reference path="services/data.ts"  />
angular.module("app", ["ngRoute"])
    .service("dataService", DataService)
    .component("customerList", CustomerList.definition)
    .component("projectList", ProjectList.definition)
    .component("myProjects", MyProjects.definition)
    .component("myTitles", MyTitles.definition)
    .component("myReports", MyReports.definition)
    .component("sync", Sync.definition)
    .directive("datePicker", datePickerDirective)
    .config(function ($locationProvider, $routeProvider) {
    var yesterday = function () {
        var date = new Date(Date.now() - 24 * 3600 * 1000);
        return date.toISOString().substring(0, 10);
    };
    $locationProvider.html5Mode(true);
    $routeProvider.when("/app/my-projects", {
        template: "<my-projects customers='$resolve.data.customers' my-projects='$resolve.data.myProjects' />",
        resolve: {
            data: function (dataService) {
                return dataService.getData();
            }
        }
    }).when("/app/my-titles/", {
        redirectTo: function () {
            return "/app/my-titles/" + yesterday();
        }
    }).when("/app/my-titles/:date", {
        template: "<my-titles titles='$resolve.titles' my-titles='$resolve.myTitles' my-projects='$resolve.data.myProjects' types='$resolve.types' />",
        resolve: {
            titles: function (dataService, $route) {
                return dataService.getTitles($route.current.params["date"]);
            },
            myTitles: function (dataService) {
                return dataService.getMyTitles();
            },
            data: function (dataService) {
                return dataService.getData();
            },
            types: function (dataService) {
                return dataService.getTypes();
            }
        }
    })
        .when("/app/my-reports", {
        redirectTo: function () {
            return "/app/my-reports/" + yesterday();
        }
    }).when("/app/my-reports/:date", {
        template: "<my-reports reports='$resolve.reports' />",
        resolve: {
            reports: function (dataService, $route) {
                return dataService.getReports($route.current.params["date"]);
            }
        }
    })
        .when("/app/sync", {
        template: "<sync />"
    })
        .otherwise({
        redirectTo: "/app/my-projects"
    });
});
function datePickerDirective() {
    return {
        restrict: "C",
        require: "ngModel",
        link: function ($scope, $element, attrs, model) {
            model.$formatters.push(function (value) {
                if (angular.isUndefined(value))
                    return value;
                return new Date(value).toLocaleDateString();
            });
            model.$parsers.unshift(function (value) {
                if (model.$isEmpty(value))
                    return value;
                var date = new Date(value);
                return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().substring(0, 10);
            });
            var render = model.$render;
            model.$render = function () {
                $(".datepicker.datepicker-dropdown", document.body).hide();
                render();
            };
        }
    };
}
