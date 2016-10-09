/// <reference path="components/customer-list.ts"  />
/// <reference path="components/project-list.ts"  />
/// <reference path="components/my-titles.ts"  />
/// <reference path="components/my-meetings.ts"  />
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
    .component("myMeetings",MyMeetings.definition)
    .component("myReports",MyReports.definition)
    .component("sync",Sync.definition)
    .directive("datePicker",datePickerDirective)
    .config(($locationProvider:ng.ILocationProvider,$routeProvider:ng.route.IRouteProvider)=>{
        let yesterday = ()=>{ 
            let date = new Date(Date.now() - 24*3600*1000);
            return date.toISOString().substring(0,10);
        };

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
                
                return "/app/my-titles/" + yesterday();
            }
        }).when("/app/my-titles/:date",{
            template: "<my-titles titles='$resolve.titles' my-titles='$resolve.myTitles' my-projects='$resolve.data.myProjects' types='$resolve.types' />",
            resolve:{
                titles : (dataService:DataService, $route:ng.route.IRouteService)=>{
                    return dataService.getTitles($route.current.params["date"]);
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
        })
        .when("/app/my-meetings/",{
            redirectTo: ()=>{
                return "/app/my-meetings/" + yesterday();
            }
        })
        .when("/app/my-meetings/:date",{
            template: "<my-meetings meetings='$resolve.meetings' my-meetings='$resolve.myMeetings' my-projects='$resolve.data.myProjects' types='$resolve.types' />",
            resolve:{
                meetings : (dataService:DataService, $route:ng.route.IRouteService)=>{
                    return dataService.getMeetings($route.current.params["date"]);
                },
                myMeetings : (dataService:DataService)=>{
                    return dataService.getMyMeetings();
                },
                data : (dataService:DataService)=>{
                    return dataService.getData();
                },
                types:(dataService:DataService)=>{
                    return dataService.getTypes();
                }
            }
        })
        .when("/app/my-reports",{
            redirectTo: ()=>{
                return "/app/my-reports/" + yesterday();
            }
        }).when("/app/my-reports/:date",{
            template: "<my-reports reports='$resolve.reports' />",
            resolve:{
                reports:(dataService:DataService, $route:ng.route.IRouteService)=>{
                    return dataService.getReports($route.current.params["date"]);
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