class ProjectList{
    static definition = <ng.IComponentOptions>{
        templateUrl:"components/project-list.html",
        controller:ProjectList,
        controllerAs:"pl",
        bindings:{
            projects:"=",
            selectedProjects:"="
        }
    };

    projects:Project[];
    selectedProjects:Project[];
    
    constructor(){

    }

    select(project:Project){
        var index = this.selectedProjects.indexOf(project);
        if (index>-1){
            this.selectedProjects.splice(index,1);
        } else {
            this.selectedProjects.push(project);
        }
    }

    isSelected(project:Project){
        return this.selectedProjects.indexOf(project)>-1;
    }

    $onInit(){
        if (!this.selectedProjects)
            this.selectedProjects = []; 
    }
}