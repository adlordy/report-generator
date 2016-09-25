class MyReports{
    static definition = <ng.IComponentOptions>{
        templateUrl:"components/my-reports.html",
        controller: MyReports,
        controllerAs:"mr",
        bindings:{
            reports:'='
        }
    }

    constructor(private dataService:DataService){
    }

    reports:ReportFile[];
    report:ReportFile;

    reportItems:ReportItem[];

    select(report:ReportFile){
        this.report = report;
        this.dataService.getReport(this.report.name).then(items => this.reportItems = items);
    }
}