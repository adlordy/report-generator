class Sync{
    static definition = <ng.IComponentOptions>{
        templateUrl:"components/sync.html",
        controller: Sync,
        controllerAs:"sync"
    };

    loading:boolean;
    success:boolean;
    error:boolean;
    constructor(private dataService:DataService){
    }

    sync(){
        this.loading = true;
        this.success = false;
        this.error = false;
        this.dataService.sync()
            .then(()=>this.success = true)
            .catch(()=>this.error = true)
            .finally(()=>this.loading = false);
    }
}