/**
 * Created by Gilmar N. Lima on 01/05/17.
 */
var appplay = angular.module('appplay',['ngMaterial','ngMessages','md.data.table']);

appplay.config(function($mdThemingProvider,$mdIconProvider,$mdDateLocaleProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('green', {
            'default': '800', // by default use shade 400 from the pink palette for primary intentions
            'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
            'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
            'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
        })
        // If you specify less than all of the keys, it will inherit from the
        // default shades
        .accentPalette('green', {
            'default': '500' // use shade 200 for default, and keep all other shades the same
        });
    $mdIconProvider
        .defaultIconSet('icon/mdi.svg');

    $mdIconProvider.fontSet('md', 'material-icons');

    //$httpProvider.interceptors.push('AuthInterceptor');

    //-- Format data
    $mdDateLocaleProvider.formatDate = function (date) {
        if (date) {
            var day = date.getDate();
            var monthIndex = date.getMonth();
            var year = date.getFullYear();
            if (day < 10) {
                day = '0' + (day).toString();
            }
            monthIndex = parseInt(monthIndex) + 1;
            if (monthIndex < 10) {
                monthIndex = '0' + (monthIndex).toString();
            }

            return day + '/' + monthIndex + '/' + year;
        }
    };
})
