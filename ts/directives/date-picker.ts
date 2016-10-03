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
                return new Date(value).toISOString().substring(0, 10);
            });
        }
    }
}