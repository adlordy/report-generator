class MyReports {
    static definition = <ng.IComponentOptions>{
        templateUrl: "components/my-reports.html",
        controller: MyReports,
        controllerAs: "mr",
        bindings: {
            reports: '='
        }
    }

    constructor(private dataService: DataService,
        private $routeParams: ng.route.IRouteParamsService,
        private $location: ng.ILocationService) {
        this.date = this.$routeParams["date"];
    }

    reports: ReportFile[];
    report: ReportFile;

    reportItems: ReportItem[];
    personal: ReportItem;

    date: string;

    select(report: ReportFile) {
        this.report = report;
        this.dataService.getReport(this.report.name).then(items => {
            this.reportItems = items.filter(r => r.project.id !== -1);
            this.personal = items.filter(r => r.project.id === -1)[0];
        });
    }

    dateChange() {
        if (this.date != "" && this.date != this.$routeParams["date"])
            this.$location.path("/app/my-reports/" + this.date);
    }
}