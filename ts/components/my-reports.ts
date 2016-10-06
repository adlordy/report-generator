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
    target = 28800;
    step = 900;

    uploading = false;
    success = false;
    error = false;

    select(report: ReportFile) {
        this.report = report;
        this.dataService.getReport(this.report.name).then(items => {
            this.reportItems = this.process(items.filter(r => r.project.id !== -1));
            this.personal = items.filter(r => r.project.id === -1)[0];
        });
    }

    dateChange() {
        if (this.date != "" && this.date != this.$routeParams["date"])
            this.$location.path("/app/my-reports/" + this.date);
    }

    process(items: ReportItem[]) {
        if (items.length > 0) {
            var total = items.reduce((s, item) => item.seconds + s, 0);
            var factor = total / this.target;

            var values = items.map(item => {
                var value = (item.seconds / factor) / this.step;
                return { value: value, decimal: value - Math.floor(value), item: item };
            });
            values.sort((a, b) => a.value - b.value);
            var targetSum = this.target / this.step;
            var index = 0;
            while (values[index].value < 1 && index < values.length) {
                values[index].value = 1;
                index++;
            }
            var lowSum = values.reduce((s, item, i) => {
                return s + Math.floor(item.value);
            }, 0);
            var count = targetSum - lowSum;
            values.sort((a, b) => a.value == 1 ? (b.value == 1 ? 0 : -1) : b.decimal - a.decimal);
            values.forEach((item, i) => {
                var value = (i < index + count) ?
                    Math.ceil(item.value) : Math.floor(item.value);
                item.item.adjustedSeconds = value * this.step;
            });
        }
        return items;
    }

    upload(){
        if (this.reportItems&&this.reportItems.length>0){
            this.uploading = true;
            this.success = false;
            this.error = false;
            this.dataService.upload(this.reportItems)
                .then(()=>this.success = true)
                .catch(()=>this.error = true)
                .finally(()=>this.uploading = false);
        }
    }
}