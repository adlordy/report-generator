class MyTitles {
    static definition = <ng.IComponentOptions>{
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

    date:string;
    titles: Title[];
    selectedTitles: Title[] = [];
    myTitles: Title[];
    myProjects: Project[];
    types: WorkType[];
    type: WorkType;
    project: Project;
    saving: boolean;

    constructor(private dataService: DataService, 
        private $routeParams:ng.route.IRouteParamsService,
        private $location:ng.ILocationService) {
        this.date = this.$routeParams["date"];
    }

    $onInit() {
        var map: { [name: string]: Title } = {};
        this.myTitles.forEach(t => map[t.name] = t);
        this.titles.forEach((t, i) => {
            var my = map[t.name];
            if (my) {
                this.titles[i] = my;
            }
        });
    }

    select(title: Title) {
        var index = this.selectedTitles.indexOf(title);
        if (index > -1) {
            this.selectedTitles.splice(index, 1);
        } else {
            this.selectedTitles.push(title);
        }
    }

    selectType(type: WorkType) {
        this.type = type;
    }

    isSelected(title: Title) {
        return this.selectedTitles.indexOf(title) > -1;
    }

    getUnassigned() {
        return this.titles.filter(r => angular.isUndefined(r.projectId));
    }

    assign(project: Project) {
        this.project = project;
        if (this.project && (this.type || this.isPersonal(this.project))) {
            this.selectedTitles.forEach(t => {
                t.projectId = project.id;
                t.typeId = this.isPersonal(project)?-1:this.type.id;
            });
            this.myTitles = this.myTitles.concat(this.selectedTitles);
            this.selectedTitles = [];
        }
    }

    unassign(title: Title) {
        var index = this.myTitles.indexOf(title);
        if (index > -1) {
            this.myTitles.splice(index, 1);
        }
        title.projectId = undefined;
    }

    saveMyTitles() {
        this.saving = true;
        this.dataService.setMyTitles(this.myTitles)
            .finally(() => this.saving = false);
    }

    isPersonal(project:Project){
        return project.id === -1;
    }

    hasItems(type:WorkType){
        return this.myTitles.some(t=>this.project && t.projectId===this.project.id && t.typeId == type.id);
    }

    dateChange() {
        if (this.date != "" && this.date != this.$routeParams["date"])
            this.$location.path("/app/my-titles/" + this.date);
    }
}