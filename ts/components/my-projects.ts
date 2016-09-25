class MyProjects{
    static definition = <ng.IComponentOptions>{
        templateUrl:"components/my-projects.html",
        controller: MyProjects,
        controllerAs:"mp",
        bindings:{
            customers:"=",
            myProjects:"="
        }
    };

    customers:Customer[];
    myProjects:Project[];
    saving:boolean;

    constructor(private dataService: DataService){
    }

    deselect(project:Project){
        var index = this.myProjects.indexOf(project);
        if (index>-1){
            this.myProjects.splice(index,1);
        }
    }

    saveMyProjects(){
        this.saving = true;
        this.dataService.setMyProjects(this.myProjects).finally(()=>this.saving = false);
    }
}