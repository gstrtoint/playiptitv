/**
 * Created by gilmar on 21/01/16.
 */
/**
 * cria ng-model para field type file, para efetuar upload de arquivos.
 */
appplay.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);
/**
 * Diretiva par comparar senhas digitadas em dois campos
 * Created by gilmar on 02/01/17.
 */
appplay.directive("compareTo", function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
});
/**
 * Seta o foco no componet que estiver com esta directiva
 */
appplay.directive('autofocus', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link : function($scope, $element) {
            $timeout(function() {
                $element[0].focus();
            },500);
        }
    }
}]);
/**
 * Executa a função ao precionar enter.
 * <input type="text" ng-enter="func()">
 */
appplay.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'event': event});
                });
                event.preventDefault();
            }
        });
    };
});
/**
 * Diretiva que converte o texto digitado para maiusculo.
 */
appplay.directive('uppercase', function() {
    return {
        restrict: "A",
        require: "?ngModel",
        link: function(scope, element, attrs, ngModel) {

            //This part of the code manipulates the model
            ngModel.$parsers.push(function(input) {
                return input ? input.toUpperCase() : "";
            });

            //This part of the code manipulates the viewvalue of the element
            element.css("text-transform","uppercase");
        }
    };
});
/**
 * On changer customizado.
 */
appplay.directive('customOnChange', function() {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeHandler = scope.$eval(attrs.customOnChange);
            element.bind('change', onChangeHandler);
        }
    };
});
