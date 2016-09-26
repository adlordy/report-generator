
/// <reference path="../models/project.ts" />
/// <reference path="../models/customer.ts" />
/// <reference path="../models/title.ts" />

class DataService {
    constructor(private $http: ng.IHttpService, private $q: ng.IQService) {

    }

    getProjects() {
        return this.$http.get<Project[]>("api/data/projects").then(r => r.data);
    }

    getCustomers() {
        return this.$http.get<Customer[]>("api/data/customers").then(r => r.data);
    }

    getMyProjects() {
        return this.$http.get<number[]>("api/data/my-projects").then(r => r.data);
    }

    setMyProjects(projects: Project[]) {
        return this.$http.put("api/data/my-projects", projects.map(p => p.id))
            .then(r => r.data);
    }

    getTitles(){
        return this.$http.get<string[]>("api/data/titles").then(r=>r.data);
    }

    getMyTitles(){
        return this.$http.get<Title[]>("api/data/my-titles").then(r=>r.data);
    }

    setMyTitles(titles:Title[]){
        return this.$http.put("api/data/my-titles",titles).then(r=>r.data);
    }

    getReports(){
        return this.$http.get<ReportFile[]>("api/data/reports").then(r=>r.data);
    }

    getReport(file:string){
        return this.$http.get<ReportItem[]>("api/data/report/"+file).then(r=>r.data);
    }

    sync(){
        return this.$http.post("api/data/sync",{}).then(r=>r.data);
    }

    getData() {
        return this.$q.all([this.getProjects(), this.getCustomers(),this.getMyProjects()])
            .then(data => {
                var projects = data[0];
                var customers = data[1];
                var myProjectIds = data[2];
                var customerMap : { [id: number]: Customer } = {};
                var projectMap : {[id:number]:Project} = {};
                customers.forEach(c => customerMap[c.id] = c);
                projects.forEach(p => {
                    p.customer = customerMap[p.customerId];
                    p.customer.projects = p.customer.projects || [];
                    p.customer.projects.push(p);
                    projectMap[p.id] = p;
                });
                var myProjects = myProjectIds.map(id=>projectMap[id]);
                return {customers: customers, myProjects:myProjects};
            });
    }



    
}