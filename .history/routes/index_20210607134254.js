/**
 * Created by Gilmar N. Lima on 01/05/17.
 */
module.exports = function(app){
  var i = app.controllers.index;
  app.get('/',i.index);
  app.post('/api/index/convert',i.convert);
  app.post('/api/index/novocanal',i.novocanal);
  app.post('/api/index/removeCanal',i.removeCanal);
  app.get('/api/index/lista',i.lista);
  app.get('/api/index/listrec',i.listrec);
  app.get('/getvideo/:canal',i.getvideo);
  app.get('/getvideorec/:canal',i.getvideorec);
};
