/// <reference path="components/customer-list.ts"  />
/// <reference path="components/project-list.ts"  />
/// <reference path="components/my-titles.ts"  />
/// <reference path="components/my-projects.ts"  />
/// <reference path="components/my-reports.ts"  />
/// <reference path="components/sync.ts"  />
/// <reference path="services/data.ts"  />

angular.module("app",["ngRoute"])
    .service("dataService",DataService)
    .component("customerList",CustomerList.definition)
    .component("projectList",ProjectList.definition)
    .component("myProjects",MyProjects.definition)
    .component("myTitles",MyTitles.definition)
    .component("myReports",MyReports.definition)
    .component("sync",Sync.definition)
    .directive("datePicker",datePickerDirective)
    .config(($locationProvider:ng.ILocationProvider,$routeProvider:ng.route.IRouteProvider)=>{
        $locationProvider.html5Mode(true);

        $routeProvider.when("/app/my-projects",{
            template: "<my-projects customers='$resolve.data.customers' my-projects='$resolve.data.myProjects' />",
            resolve:{
                data : (dataService:DataService)=>{
                    return dataService.getData();
                }
            }
        }).when("/app/my-titles/",{
            redirectTo: ()=>{
                let date = new Date(Date.now() - 24*3600*1000);
                return "/app/my-titles/" + date.toISOString().substring(0,10);
            }
        }).when("/app/my-titles/:date",{
            template: "<my-titles titles='$resolve.titles' my-titles='$resolve.myTitles' my-projects='$resolve.data.myProjects' types='$resolve.types' />",
            resolve:{
                titles : (dataService:DataService,$route:ng.route.IRouteService)=>{
                    return dataService.getTitles($route.current.params["date"]).then(titles=>titles.map(t=>{return {name:t}}));
                },
                myTitles : (dataService:DataService)=>{
                    return dataService.getMyTitles();
                },
                data : (dataService:DataService)=>{
                    return dataService.getData();
                },
                types:(dataService:DataService)=>{
                    return dataService.getTypes();
                }
            }
        }).when("/app/my-reports",{
            template: "<my-reports reports='$resolve.reports' />",
            resolve:{
                reports:(dataService:DataService)=>{
                    return dataService.getReports();
                }
            }
        })
        .when("/app/sync",{
            template: "<sync />",
        })
        .otherwise({
            redirectTo:"/app/my-projects"
        });
    });