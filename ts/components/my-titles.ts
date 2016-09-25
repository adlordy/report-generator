class MyTitles {
    static definition = <ng.IComponentOptions>{
        templateUrl: "components/my-titles.html",
        controller: MyTitles,
        controllerAs: "mt",
        bindings: {
            titles: "=",
            myTitles: "=",
            myProjects: "="
        }
    };

    titles: Title[];
    selectedTitles: Title[] = [];
    myTitles: Title[];
    myProjects: Project[];
    project:Project;
    saving:boolean;

    constructor(private dataService:DataService){
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

    isSelected(title: Title) {
        return this.selectedTitles.indexOf(title) > -1;
    }

    getUnassigned() {
        return this.titles.filter(r => angular.isUndefined(r.projectId));
    }

    assign(project: Project) {
        this.selectedTitles.forEach(t => t.projectId = project.id);
        this.myTitles = this.myTitles.concat(this.selectedTitles);
        this.selectedTitles = [];
        this.project = project;
    }

    unassign(title:Title){
        var index = this.myTitles.indexOf(title);
        if (index>-1){
            this.myTitles.splice(index,1);
        }
        title.projectId = undefined;
    }

    saveMyTitles(){
        this.saving = true;
        this.dataService.setMyTitles(this.myTitles)
            .finally(()=>this.saving=false);
    }
}