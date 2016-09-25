/// <reference path="../models/customer.ts" />
/// <reference path="../services/data.ts" />

class CustomerList{
    static definition = <ng.IComponentOptions>{
        templateUrl:"components/customer-list.html",
        controller:CustomerList,
        controllerAs:"cl",
        bindings:{
            customers:"=",
            customer:"="
        }
    };

    customers:Customer[];
    customer:Customer;
    
    constructor(){

    }

    select(customer:Customer){
        this.customer = customer;
    }

    $onInit(){
        
    }
}