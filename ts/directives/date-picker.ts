function datePickerDirective() {
    return <ng.IDirective>{
        restrict: "C",
        require: "ngModel",
        link: ($scope: ng.IScope, $element: ng.IAugmentedJQuery, attrs: ng.IAttributes, model: ng.INgModelController) => {
            model.$formatters.push((value) => {
                if (angular.isUndefined(value))
                    return value;
                return new Date(value).toLocaleDateString();
            });
            model.$parsers.unshift((value) => {
                if (model.$isEmpty(value))
                    return value;
                var date = new Date(value);
                return new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())).toISOString().substring(0,10);
            });
            var render = model.$render;
            model.$render = ()=>{
                $(".datepicker.datepicker-dropdown",document.body).hide();
                render();
            };
        }
    }
}