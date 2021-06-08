/**
 * Created by gilmar on 26/04/16.
 */
appplay.service('$servicesComuns',function($http,$q,API_ENDPOINT,$mdDialog, $mdMedia, $mdToast,
                                        tipoMensagem,$permissao,$rootScope,$timeout){
    var LOCAL_TOKEN_KEY = 'myTokenKey@0gil';
    var isAuthenticated = false;
    var authToken;
    var emiteMensageLogin = true;
    /**
     * Dispara a pesquisa, abrindo a tela para pesquisar.
     */
    $rootScope.pesquisar = function () {
        $timeout(function() {
            angular.element(pesqHidden)[0].click();
        }, 0);
    };
    /**
     * Função que altera a empresa em usu
     * @param  Object ev - Objeto que contem os evento acionado
     */
    $rootScope.alterEmp = function (ev) {
        showDialog(ev,'#wDialogAltEmp','ControlleralterEmp',true);
    };
    /**
     * Função que altera o estabelecimento em usu
     * @param  Object ev - Objeto que contem os evento acionado
     */
    $rootScope.alterEstab = function (ev) {
        showDialog(ev,'#wDialogAltEstab','ControlleralterEstab',true);
    };
    /**
     * Checa se o usuário é um superuser
     */
    $rootScope.checSuperUser = function(){
      post('/permissao/checSuperUser',{},function(obj){
        $rootScope.superuser = obj.superuser;
      })
    }
    /**
     * Gilmar 03/07/2016 Dispara mensagens genericas no sistema!
     * @param {Object} ev - Paramentro que passa o evento que esta sendo disparado pode ser vazio
     * @param {string} title - Titulo da janela
     * @param {string} texto - Texto informativo (Mensagem direcionada ao usuario)
     * @param {string} arialL - Informação da janela, descrevendo do que se trata
     * @param {string} btntextA - Nome do botão ação.
     */
    var showAlert = function(ev,title,texto,arialL,btntextA) {
        // Appending dialog to document.body to cover sidenav in docs app
        // Modal dialogs should fully cover application
        // to prevent interaction outside of dialog
        $mdDialog.show(
            $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title(title)
                .textContent(texto)
                .ariaLabel(arialL)
                .ok(btntextA)
                .targetEvent(ev)
        );
    };
    /**
     * Gilmar 03/07/2016 Dispara mensagens solicitando confirmação ao usuário no sistema!
     * @param {Object} ev - Paramentro que passa o evento que esta sendo disparado pode ser vazio
     * @param {string} title - Titulo da janela
     * @param {string} texto - Texto informativo (Mensagem direcionada ao usuario)
     * @param {string} arialL - Informação da janela, descrevendo do que se trata
     * @param {string} ok - Nome do botão ação confirmação.
     * @param {string} cancel - Nome do botão ação cancelamento.
     * @param {string} msc - Mensagem de confirmação, se não for informado emite mensagem default.
     * @param {function} callback - Função a ser executada apos confirmação.
     */
    var showConfirm = function(ev,title,texto,arialL,ok,cancel,msc,callback) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title(title)
            .textContent(texto)
            .ariaLabel(arialL)
            .targetEvent(ev)
            .ok(ok)
            .cancel(cancel);

        $mdDialog.show(confirm).then(function() {
            callback();
            showToast(msc?msc:'Ação Confirmada!');
        }, function() {
            showToast('Ação cancelada!');
        });
    };
    /**
     * Dispara janela modal
     * @param {string} ev - Qual objeto disparou o evento
     * @param {string} control - Controle que irá manipular a janela modal
     * @param {bollean} full - Quando não informado será full scrim ou true para janel normal
     */
    var showDialog = function(ev,elem,control,full) {
        full = !full
        $mdDialog.show({
            controller: control,
            contentElement: elem,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:false,
            fullscreen: full // Only for -xs, -sm breakpoints.
        })
            .then(function(answer) {
                //$scope.status = 'You said the information was "' + answer + '".';
            }, function() {
                //$scope.status = 'You cancelled the dialog.';
            });
    };
    /**
     * Função que altera a senha no primeiro login, ou quando for obrigado.
     * @param  {ObjectId} id   - Id do usuario.
     * @param  {String} next - String da rota para a proxima pagina.
     * @return {Void}        Sem retorno.
     */
    var alterSenha = function (id,next) {
        $mdDialog.show({
            controller: 'ControllerLogin',
            templateUrl: 'views/template/alteraSenhaLogin.html',
            parent: angular.element(document.body),
            clickOutsideToClose:false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        })
            .then(function(senha) {
                var dados={};
                dados.senha = senha;
                dados._id = id;
                dados.altSen = true;
                dados.alterSenha = false;
                post('/usuario/salvar',dados,function () {
                    //$state.go(next)
                });
            }, function() {
                showAlert('','Informação','Desculpe, não será possível acessar o sistama sem informar uma nova senha!',
                'Informação','OK');
            });
    };

    function loadUserCredentials() {
        var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
        if (token && token != "undefined") {
            useCredentials(token);
        }else{
            isAuthenticated = false;
        }
    }
    /**
     * Armazena o teken de acesso localmente e verifica a validade do token.
     * @param  {string} token - Toquem de acesso.
     * @return {bollean}       Se o toke estive ok retorna true se não false.
     */
    function storeUserCredentials(token) {
        if(token && token.length) {
            window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
            useCredentials(token);
            return true;
        }else{
            showAlert('','Informação!','Sua sessão expirou!' +
                'Será necessário digitar seus dados de acesso novamente.',
                'Mensagem ao usuário!','OK');
            //$state.go('login');
            isAuthenticated = false;
            return false;
        }
    }
    /**
     * Seta o tokem para uso.
     * @param  {string} token - Token a ser utilizando para validar sessão.
     * @return {Void}       Sem retorno.
     */
    function useCredentials(token) {
        isAuthenticated = true;
        authToken = token;

        // Set the token as header for your requests!
        $http.defaults.headers.common.Authorization = authToken;
    }
    /**
     * Destroi a sessão.
     * @return {Void} Sem retorno.
     */
    function destroyUserCredentials() {
        authToken = undefined;
        isAuthenticated = false;
        $http.defaults.headers.common.Authorization = undefined;
        window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    }

    /**
     * Função que converte um tipo data em uma data no formato string (dd/mm/yyyy)
     * @param {Date} data - Parametro do tipo data
     * @returns {string} - Retorna a data no formato String
     * - Gilmar 22/09/2016
     */
    var f_dateToString = function(data){
        var d = new Date(data);
        if (d.getDate() < 10){
            dia = "0" + d.getDate();
        }else{
            dia = d.getDate();
        }
        if ((d.getMonth() +1) < 10){
            mes = "0" + (d.getMonth() +1);
        }else{
            mes = (d.getMonth() +1);
        }
        return dia + "/" + mes + "/" + d.getFullYear();
    };
    /**
     * Funçao que recebe dada em diferentes formatos no tipo string e retorna um tipo Date
     * @param {string} _date - Data no formato string
     * @param {string} _format - Formato que a data esta (dd/mm/yyyy ou yyyy-dd-mm etc.)
     * @param {string} _delimiter - Caracter delimitador que separa dia mes e ano.
     * @returns {Date} - retorna tipo date
     * - Gilmar 22/09/2016
     */
    var f_stringToDate = function(_date,_format,_delimiter){
        if(_date.length && _format.length) {
            var formatLowerCase = _format.toLowerCase();
            var formatItems = formatLowerCase.split(_delimiter);
            var dateItems = _date.split(_delimiter);
            var monthIndex = formatItems.indexOf("mm");
            var dayIndex = formatItems.indexOf("dd");
            var yearIndex = formatItems.indexOf("yyyy");
            var month = parseInt(dateItems[monthIndex]);
            month -= 1;
            var formatedDate = new Date(dateItems[yearIndex], month, dateItems[dayIndex]);
            return formatedDate;
        }else{return''}
    };
    /**
     * Função para emissão de mensgens rapidas ou usuário
     * @param {string} msg - Texto a ser emitido
     * - Gilmar 23/09/2016
     */
    var showToast = function(msg) {
        var last = {
            bottom: true,
            top: false,
            left: false,
            right: true
        };
        toastPosition = angular.extend({},last);

        getToastPosition = function() {

            sanitizePosition();

            return Object.keys(toastPosition)
                .filter(function(pos) { return toastPosition[pos]; })
                .join(' ');
        };

        function sanitizePosition() {
            current = toastPosition;

            if ( current.bottom && last.top ) current.top = false;
            if ( current.top && last.bottom ) current.bottom = false;
            if ( current.right && last.left ) current.left = false;
            if ( current.left && last.right ) current.right = false;

            last = angular.extend({},current);
        }

        var pinTo = getToastPosition();

        $mdToast.show(
            $mdToast.simple()
                .textContent(msg)
                .position(pinTo)
                .hideDelay(3000)
        );
    };
    /**
     * Valida login de usuário
     * @param {Object} user - Dados do usuário que esta logando.
     * @returns {*}
     */
    var login = function(user) {
        $rootScope.empresaAtu = user.dominio.nome;
        return $q(function(resolve, reject) {
            $http.post(API_ENDPOINT.url + '/usuario/authenticate', user).then(function(result) {
              if (result.data.success) {
                  if(result.data.estabs && result.data.estabs.length >= 1){
                    $rootScope.estabAtu = result.data.estabs[0].nomefantasia
                    if(result.data.estabs.length>1)
                        $rootScope.alterEstab({})
                  }
                  storeUserCredentials(result.data.token);
                  post('/permissao/checSuperUser',{},function(obj){
                    $rootScope.superuser = obj.superuser;
                    var next = 'home';//result.data.leitor?'arquivo':'home';
                    if(result.data.alterSenha){
                        showConfirm('','Informação','Você deve informa uma nova senha para poder utilizar o sistema.',
                        'Mensagem para alterar senha','OK','Cancelar','Alterar senha!', function () {
                                alterSenha(result.data.id,next);
                            });
                    }else{
                        resolve(next);
                    }
                  })
                } else {
                    reject(result.data.msg);
                }
            });
        });
    };
    /**
     * Função que executa todos os posts da aplicação
     * @param {string} url - Url que esta sendo enviado os dados ou requisitado.
     * @param {Object} data - Dados que que serão enviados.
     * @param {function} callback - Função que será executada após receber o ok da execução em backend
     * Gilmar 04/01/2017
     */
    var post = function (url,data,callback) {
        $rootScope.activeProgres = true;
        $http({
            method: 'POST',
            url: API_ENDPOINT.url+url,
            data: data,
            headers: {'Content-Type': 'application/json'},
        }).then(function sucesscbk(retorno) {
            $rootScope.activeProgres = false;
            //if(storeUserCredentials(data.token)){
                callback(retorno.data.dados,retorno.status);
            //};
        },function errorcbk(retorno) {
            $rootScope.activeProgres = false;
            callback(retorno.data,retorno.status);
            console.log(data);
        });
    };
    /**
     * Função que executa todos os gets da aplicação
     * @param {string} url - Url que esta sendo enviado os dados.
     * @param {Object} data - Dados que que serão enviados.
     * @param {function} callback - Função que será executada após receber o ok da execução em backend
     * Gilmar 04/01/2017
     */
    var get = function (url,data,callback) {
        $rootScope.activeProgres = true;
        $http({
            method: 'GET',
            url: API_ENDPOINT.url+url,
            params: data,
            headers: {'Content-Type': 'application/json'},
        }).then(
          function (retorno) {
            $rootScope.activeProgres = false;
            //if(storeUserCredentials(retorno.data.token)){
                callback(retorno.data.dados,retorno.status);
            //};
          },
          function (retorno) {
            $rootScope.activeProgres = false;
            callback(retorno.data,retorno.status);
            console.log(data);
          }
        );
    };
    /**
     * Opens window screen centered.
     * @param windowWidth the window width in pixels (integer)
     * @param windowHeight the window height in pixels (integer)
     * @param windowOuterHeight the window outer height in pixels (integer)
     * @param url the url to open
     * @param wname the name of the window
     * @param features the features except width and height (status, toolbar, location, menubar, directories, resizable, scrollbars)
     */
    function CenterWindow(windowWidth, windowHeight, windowOuterHeight, url, wname, features) {
        var centerLeft = parseInt((window.screen.availWidth - windowWidth) / 2);
        var centerTop = parseInt(((window.screen.availHeight - windowHeight) / 2) - windowOuterHeight);
        var misc_features;
        if (features) {
            misc_features = ', ' + features;
        }
        else {
            misc_features = ', status=no, location=no, scrollbars=yes, resizable=yes';
        }
        var windowFeatures = 'width=' + windowWidth + ',height=' + windowHeight + ',left=' + centerLeft + ',top=' + centerTop + misc_features;
        var win = window.open(url, wname, windowFeatures);
        win.focus();
        return win;
    }
    /**
     * Chama os relatórios do servidor de relatório usando jsrport client.
     * @param data - Id de relatório e dados para gera-lo. Devem ser passados convertido
     * com JSON.stringify ex.:
     *  var dado={
     *       template:{shortid:"HyVe0H7mZ"},
     *       data:{data:JSON.stringify({dados:dados})}
     *   };
     *   e no relatório tem que fazer a conversão de volta.
     *   ex.: <% dados = JSON.parse(data).dados  %>
     */
    var relatorioJsreport = function (data) {
        $rootScope.activeProgres = true;

        jsreport.serverUrl = '/relatorio';
        jsreport.render('_blank', data);
        $rootScope.activeProgres = false;

    };
    /**
     * Obtem o relatório do servidor confome parametros, sem utilizar jsreport client.
     * @param {strign} data - Identificador do relatório e os dados para gera-lo
     * @param {function} callback - Funçao a ser executada com o retorno
     */
    var relatorio = function (data,callback) {
        $rootScope.activeProgres = true;
        $http({
            method: 'POST',
            url: '/relatorio/api/reports',
            data: data,
            headers: {'Content-Type': 'application/json'},
        }).success(function (data, status, headers, config) {
            $rootScope.activeProgres = false;
            var dataURI = "data:application/pdf;base64, " + data;
            CenterWindow(1024, 768, 50, dataURI, 'Exibição de Relatório');
            //callback(data,status);
        }).error(function (data, status, headers, config) {
            $rootScope.activeProgres = false;
            callback(data,status);
            console.log(data);
        });
    };
    /**
     * Função que valida o retorno de uma comunicação com o servidor
     * @param {Object} ev - Item da view que disparou evento
     * @param {string} status - Status do retorno http (ex. 403, 404, 400)
     * @param {string} mensagem - Mensagem para o usuário
     * @param {integer} tipo - Qual tipo será disparado a mensagem Toach ou Alert.
     * Gilmar 31/12/2016
     */
    var validaRetorno = function (ev,status,mensagem,tipo) {
        if(status === 404 || status === 400){
            showAlert('','Informação!','Não foi possível estabelecer comunicação com servidor. ' +
                'Por favor verifique sua conexão! Se o problema persistir entre em contato com suporte',
                'Mensagem ao usuário!','OK');
        }else if(status===403){
            showAlert(ev, 'Informação!','Usuário não tem permissão para efetuar esta ação.'+
            'Informe ao adiministrador do sistema!','Mensagem ao usuário!','OK')
        }else if(status===401){
            if(emiteMensageLogin) {
                emiteMensageLogin =false;
                showAlert(ev, 'Informação!',
                    'Falha ao validar suas credenciais, elas podem ter expirado! Será necessário efetuar login novamente.',
                    'Mensagem ao usuário!', 'OK');
                //$state.go('login');
            }
        }else if(status===500){
            showAlert(ev, 'Informação!',
                'Ocorreu uma exceção não tradada! Por favor entre em contato com suporte e informe ocorrido.',
                'Mensagem ao usuário!','OK');
        }else if(tipoMensagem.Alert==tipo){
            showAlert(ev, 'Informação!',mensagem,'Mensagem ao usuário!','OK')
            return true;
        }else if(tipoMensagem.Toast==tipo){
            showToast(mensagem)
            return true;
        }else if(tipoMensagem.None==tipo){
            emiteMensageLogin = true;
            return true;
        }
    };
    /**
     * Retorna as permissões do usuário que esta logado!
     * @param {function} callback - Funçao a ser executada com o retorno
     */
    var getPermissao = function (callback) {
        var perms = $permissao.get();
        if(!Object.keys(perms).length){
            get('/permissao/getPermissao',{},function (perms,status) {
                if (validaRetorno('',status,'',tipoMensagem.None)) {
                    $rootScope.perms=perms;
                    $permissao.set(perms);
                    callback(perms);
                }
            })
        }else{
            callback(perms);
        }
    };
    /**
     * Recebe permisão que esta vindo do servidor e seta permissão local da controler
     * @param {Object} perml - Dados permissão da controle local
     * @param {Object} perms - Dados permissão recebidos do servidor
     * @returns {Object}  - Retorna a permisão local com as novas configurações
     * Gilmar 19/01/2017
     */
    var setPermLocal = function (perml,perms) {
        if (perms.incluir) {
            perml.incluir = true;
        }
        if (perms.excluir) {
            perml.excluir = true;
        }
        if (perms.alterar) {
            perml.alterar = true;
        }
        if (perms.consultar) {
            perml.consultar = true;
        }
        return perml;
    };
    /**
     * Efetua logout
     * @return {Void} - Sem retorno.
     */
    var logout = function() {
        destroyUserCredentials();
        $permissao.set({});
        //$state.go('login');
    };
    loadUserCredentials();

    /**
     * Gilmar 08/10/2016 Checa a existencia de token para validar se o usário já efetuou login
     * @param {string} next - Parametro que contem a view a ser acessada.
     */
    var authGo = function (next) {
        loadUserCredentials();
        if (isAuthenticated == false){
            //$state.go('login');
            showAlert('', 'Informação!', 'Sua sessão expirou!' +
                'Será necessário digitar seus dados de acesso novamente.',
                'Mensagem ao usuário!', 'OK');
        }else{
            this.getPermissao(function () {
                emiteMensageLogin = true;
                //$state.go(next);
            });
        }
    };
    /**
     * Coloca a primeira letra maiuscula
     * @param  {string} text - Texto a ser convertido.
     * @return {string} - Teste já tratado.
     */
    var titleize = function (text) {
        var words = text.toLowerCase().split(" ");
        for (var a = 0; a < words.length; a++) {
            var w = words[a];
            words[a] = w[0].toUpperCase() + w.slice(1);
        }
        return words.join(" ");
    };
    /**
     * Recebe uma data e retorna o dia por extenso
     * @param {Date} data - Data para obter o dia
     * @param {integer} dias - Dias a ser somados ou subtraidos
     * @returns {string} - Retorna o dia por extenso
     */
    var nameDia = function (data,dias) {
        if(!dias){dias=0}
        data = new Date(data);
        data.setDate(data.getDate() + dias);
        var dia = data.getDay();
        var semana = new Array(6);
        semana[0]='Domingo';
        semana[1]='Segunda-Feira';
        semana[2]='Terça-Feira';
        semana[3]='Quarta-Feira';
        semana[4]='Quinta-Feira';
        semana[5]='Sexta-Feira';
        semana[6]='Sábado';
        return semana[dia];
    };

    /**
     * Gilmar 04/04/2017 Função que carrega os dados da imagem pela url
     * @param {string} url - url da imagem a ser carregada
     * @param {Object} obj - objeto que receberá a imagem
     */
    var getBase64FromImageUrlc = function (url,obj) {
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width =this.width;
            canvas.height =this.height;

            var ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);

            var dataURL = canvas.toDataURL("image/png");
            obj.src=dataURL;
        };
        img.src = url;
    };
    /**
     * Formata um numero com zeros a esquerda.
     * @param {string} n - numero a ser formatado
     * @param {string} len - tamanho de do muro
     * @returns {string} - retorna o numero formatado
     */
    var numberFixedLen = function (n, len) {
        var num = parseInt(n, 10);
        len = parseInt(len, 10);
        if (isNaN(num) || isNaN(len)) {
            return n;
        }
        num = ''+num;
        while (num.length < len) {
            num = '0'+num;
        }
        return num;
    };
    return {
        login: login,
        logout: logout,
        showAlert:showAlert,
        showToast:showToast,
        f_dateToString:f_dateToString,
        f_stringToDate:f_stringToDate,
        showConfirm:showConfirm,
        authGo:authGo,
        post:post,
        get:get,
        validaRetorno:validaRetorno,
        titleize:titleize,
        showDialog:showDialog,
        getPermissao:getPermissao,
        setPermLocal:setPermLocal,
        nameDia:nameDia,
        getBase64FromImageUrlc:getBase64FromImageUrlc,
        numberFixedLen:numberFixedLen,
        relatorioJsreport:relatorioJsreport,
        relatorio:relatorio
    }
});
