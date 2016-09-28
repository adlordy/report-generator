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
    personal:ReportItem;

    select(report:ReportFile){
        this.report = report;
        this.dataService.getReport(this.report.name).then(items => {
            this.reportItems = items.filter(r=>r.project.id!==-1);
            this.personal = items.filter(r=>r.project.id === -1)[0];
        });
    }
}