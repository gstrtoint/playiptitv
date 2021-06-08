/**
 * Created by gilmar on 26/06/16.
 */
var getUrl = function () {
    return window.location.host
};
appplay
    .constant('AUTH_EVENTS', {
        notAuthenticated: 'auth-not-authenticated'
    })
    .constant('API_ENDPOINT', {
        //url: 'http://127.0.0.1:3000/api'
        //  For a simulator use: url: 'http://127.0.0.1:8080/api'
        url: 'http://'+getUrl()+'/api'
    })
    .constant('tipoMensagem',{
        None:0,
        Alert:1,
        Toast:2
    });
