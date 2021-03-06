var repository = require('repository');
var eventsFactory = require('eventsFactory');
var updateFactory = require("updateFactory");
var Q = require('q');
var Heroes = Alloy.Collections.instance('Heroes');

// PUBLIC METHODS
exports.getHeroesList = getHeroesList;
exports.getHero = getHeroById;

_.defer(function(){
  Heroes.fetch({
    success: function(model, response, options){
      Alloy.Globals.heroesListIndex = 0;
    }
  });
});

function getHeroesList() {
	return updateFactory.getLatestHeroesUpdate()
	.then(function(updateResponse){
		Ti.API.debug('[HEROES FACTORY] response: '+ JSON.stringify(updateResponse));
		if(updateResponse.shouldUpdate === true){
			return repository.queryObject({
				objClass: "Heroes",
				refDate: updateResponse.latestUpdate
			})
			.then(function(response){
				var arrowDBArray = response.Heroes;
		
				for(var i=0; i<arrowDBArray.length; i++){
					Heroes.create(arrowDBArray[i]);	
				}
				if(arrowDBArray.length > 0){
					Heroes.fetch({
						success: function(model, response, options){
							Alloy.Globals.heroesListIndex = 0;
						}
					});
				}

	      var jsonRes = processJSONRes();
	      if(jsonRes.length == 0)
          throw "error_loading_heroes_list"; 
				return jsonRes;
			});
		} else {
			return Q.Promise(function(resolve,reject){
				Heroes.fetch({
					success: function(model, response, options){
						Alloy.Globals.heroesListIndex = 0;
					}
				});
				if(Heroes.length > 0){
	        var jsonRes = processJSONRes();
	        resolve(jsonRes);
				}
				else
					reject("error_loading_heroes_list");
			});
		} //IF
	})
	.fail(function(err){
		Ti.API.debug("[HEROES FACTORY] Sem Internet");
		Ti.API.debug('[HEROES FACTORY] ' + JSON.stringify(err));
		return Q.Promise(function(resolve,reject){
			if(Heroes.length > 0){
        var jsonRes = processJSONRes();
        Ti.API.debug('[HEROES FACTORY] jsonRes: ' + jsonRes);
        resolve(jsonRes);
			}
			else {
				Ti.App.Properties.setString('last_update_check', '2000-01-01T00:00:00');
				reject("error_loading_heroes_list");
			}
		});
	});
	
}

function getHeroById(heroId) {
  Ti.API.debug("[HEROES FACTORY] getHeroById: " + heroId);
	return Q.Promise(function(resolve,reject,notify){
		var heroObj = Heroes.get(heroId);
		Ti.API.debug("[HEROES FACTORY][PROMISE OBJECT] " + JSON.stringify(heroObj));

		if(!!heroObj == true){
			resolve(heroObj);
		} else {
		  reject("error_loading_hero");
		}
	});
}

function processJSONRes(){
	return Heroes.toJSON().sort(function(a,b){
    var aName = a['name'][Ti.Locale.currentLanguage].toLowerCase();
    var bName = b['name'][Ti.Locale.currentLanguage].toLowerCase();
    if (aName < bName) //sort string ascending
      return -1;
    if (aName > bName)
      return 1;
    return 0;
  });
}