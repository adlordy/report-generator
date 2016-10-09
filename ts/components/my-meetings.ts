class MyMeetings{
    static definition = <ng.IComponentOptions>{
        templateUrl:"components/my-meetings.html",
        controller: MyMeetings,
        controllerAs:"mm",
        bindings:{
            meetings:"=",
            myMeetings:"=",
            myProjects:"=",
            types: "="
        }
    };

    date:string;
    meetings:Meeting[];
    selectedMeetings:Meeting[] = [];
    myMeetings:Meeting[];
    myProjects:Project[];
    project:Project;
    types:WorkType[];
    type:WorkType;
    saving:boolean;

    constructor(private dataService: DataService, private $location:ng.ILocationService,private $routeParams:ng.route.IRouteParamsService){
        this.date = this.$routeParams["date"];
    }

    duration(meeting:Meeting){
        return ((new Date(meeting.end).getTime() - new Date(meeting.start).getTime()) / 3600000).toFixed(2);
    }

    $onInit() {
        var map: { [name: string]: Meeting } = {};
        this.myMeetings.forEach(m => map[m.subject] = m);
        this.meetings.forEach((m, i) => {
            var my = map[m.subject];
            if (my) {
                this.meetings[i] = angular.extend(my,m);
            }
        });
    }

    select(meeting: Meeting) {
        var index = this.selectedMeetings.indexOf(meeting);
        if (index > -1) {
            this.selectedMeetings.splice(index, 1);
        } else {
            this.selectedMeetings.push(meeting);
        }
    }

    selectType(type: WorkType) {
        this.type = type;
    }

    isSelected(title: Meeting) {
        return this.selectedMeetings.indexOf(title) > -1;
    }

    getUnassigned() {
        return this.meetings
            .filter(r => angular.isUndefined(r.projectId));
    }

    assign(project: Project) {
        this.project = project;
        if (this.project && (this.type || this.isPersonal(this.project))) {
            this.selectedMeetings.forEach(m => {
                m.projectId = project.id;
                m.typeId = this.isPersonal(project)?-1:this.type.id;
            });
            this.myMeetings = this.myMeetings.concat(this.selectedMeetings);
            this.selectedMeetings = [];
        }
    }

    unassign(meeting: Meeting) {
        var index = this.myMeetings.indexOf(meeting);
        if (index > -1) {
            this.myMeetings.splice(index, 1);
        }
        meeting.projectId = undefined;
    }

    dateChange() {
        if (this.date != "" && this.date != this.$routeParams["date"])
            this.$location.path("/app/my-meetings/" + this.date);
    }
    
    saveMyMeetings(){
        this.saving = true;
        this.dataService.setMyMeetings(this.myMeetings).finally(()=>this.saving = false);
    }

    isPersonal(project:Project){
        return project.id === -1;
    }
}