appplay.controller('ControllerIndex', function($scope,$servicesComuns,$mdDialog,$rootScope){

  $scope.canais = [];
  $scope.videos = [];
  $scope.listgrav = [];
  $scope.control = false;
  $scope.gravados = false;

  $scope.filtro={};
  $scope.arquivosEnv=[];
  $scope.files=[];
  $scope.selected = [];
  $scope.limitOptions = [5, 10, 15];

  $scope.teste = function(){
    debugger;
  }

  $scope.options = {
    rowSelection: false,
    multiSelect: false,
    autoSelect: false,
    decapitate: false,
    largeEditDialog: false,
    boundaryLinks: false,
    limitSelect: true,
    pageSelect: true
  };
  $scope.query = {
    order: 'url',
    limit: 5,
    page: 1
  };
  var verstatus = function(url,listg){
    var r = false
    for(var i=0; i<listg.length; i++){
      if(listg[i].url == url){
        r = true;
        break;
      }
    }
    return r;
  }
  var tratarlista = function(list,gravando){
    var j = 0;
    for(var i=0; i < list.length; i++){
      var canal= {};
      if(list[i].indexOf('EXTINF')==-1){
        continue;
      }else {
        ln = list[i].split(',')
        canal.descricao = ln[1];
        l = ln[0].split('"');
        for(var j=0;j<l.length;j++){
          if(l[j].indexOf('tvg-logo')>-1){
            canal.urlimage = l[j+1];
          }
          if(l[j].indexOf('group-title')>-1){
            canal.nome = l[j+1];
          }
        }
        canal.url = list[i+1];
        canal.btng = verstatus(canal.url,gravando);
        $rootScope['btna'+j] = false;
        j++;
        $scope.canais.push(canal)
      }
    }
  }
  $scope.load = function(){
    $servicesComuns.get('/index/lista',{},function (data,status) {
      if($servicesComuns.validaRetorno('',status,data.message,data.tipo)){
        tratarlista(data.lista.toString().split('\n'),data.gravando);
      };
    });
  };
  $scope.load();
  $scope.loadVideo = function(url){
    document.getElementById('play').innerHTML = '<video autoplay controls id="video_ctrl" class="video-js vjs-default-skin" style="height: 268px; width: 640px;"><source src="'+url+'" type="video/mp4"></video>';
    document.getElementById('video_ctrl').play();
  }
  $scope.pesqHidden = function (ev) {
    $servicesComuns.showDialog(ev,'#wDialog','ControllerIndex');
  };
  $scope.wdplay = function (ev,url) {
    $servicesComuns.showDialog(ev,'#wdplayer','ControllerIndex');
    setTimeout(function(){
      $scope.loadVideo(window.location.origin+'/getvideorec/'+url);
    },1000)
  };
  $scope.gravar = function(ev,obj,index){
    obj.converter = obj.url.toLowerCase().indexOf('m3u8')==-1
    $servicesComuns.post('/index/convert',obj,function (data,status) {
      if($servicesComuns.validaRetorno(ev,status,data.message,data.tipo)){
        $scope.canais[index].pid = data.pid;
        $scope.canais[index].btng = data.pid>0?true:false;
      };
    });
  };
  $scope.listrec = function(){
    if(!$scope.gravados){
      $servicesComuns.get('/index/listrec',{},function(data,status){
        if($servicesComuns.validaRetorno('',status,data.message,data.tipo)){
          $scope.listgrav = data.listgrav;
          console.log($scope.listgrav);
        };
      })
    }
    $scope.gravados = !$scope.gravados;
  }
  $scope.assitir = function(ev,obj,index){
    $scope.control = false;
    if(obj.url.toLowerCase().indexOf('m3u8')==-1){
      obj.url=window.location.origin+'/getvideo/'+obj.nome+'.m3u8';
    }
    $scope.videos.push({
      url:obj.url,
      nome:obj.nome,
      index:index,
      i:$scope.videos.length
    })
    setTimeout(
      function(){
        var p = window.videojs('play'+index);
        p.play();
      },300
    );
    $scope['btna'+index] = true;
    //document.getElementById('btna'+index).disabled = true;
  }
  $scope.remove = function(canal){
    for(var i=0; i<$scope.videos.length;i++){
      if($scope.videos[i].url == canal.url){
        $scope.videos.splice(i, 1);
        window.videojs('play'+canal.index).dispose();
      }
    }
  };
  $scope.removeCanal = function(ev,canal){
    $servicesComuns.showConfirm(ev,'CINFIRMAÇÃO',
    'Você realmente deseja excluir este canal permanentemente?',
    'Remove canal','Confirmar','Cancelar',
    'Canal excluido com sucesso!',function(){
      $servicesComuns.post('/index/removeCanal',{url:canal},function(data,status){
        if($servicesComuns.validaRetorno(ev,status,data.message,data.tipo)){
          for(var i=0; i<$scope.canais.length;i++){
            if($scope.canais[i].url == canal){
              $scope.canais.splice(i, 1);
            }
          }
        }
      })
    })
  };
  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.save = function(ev,obj){
    $servicesComuns.post('/index/novocanal',obj,function(data,status){
      $servicesComuns.validaRetorno(ev,status,data.message,data.tipo);
    })
    $scope.canal = {};
    $mdDialog.hide(obj);
  }
});
