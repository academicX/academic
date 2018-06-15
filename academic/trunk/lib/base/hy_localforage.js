/*
* @Author: xiejinlong
* @Date:   2016-12-15 10:30:44
* @Last Modified by:   xiejinlong
* @Last Modified time: 2017-10-12 10:19:04
*/

(function(win){

	function supportsIndexDB(){
		return localforage.supports(localforage.INDEXEDDB);
	}

	function loadByXHR(id, url, callback) {
        var store = storage
            , content
            , item;

        var timeLong = 24*3600;     

        function _load(url, cb) {
            var xhr = new window.XMLHttpRequest;
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 ) {
                    if (xhr.status==200) {
                        content = xhr.responseText

                        store.get(id).then(function(oldUrl){

                        	if (oldUrl) {
	                            store.remove(oldUrl);
	                        }
                        });


                        store.set(url, content, timeLong);
                        store.set(id, url, timeLong);

                        cb(content);
                    } else {
                        throw new Error('A unkown error occurred.');
                    }
                }
            };
            xhr.open('get', url);
            xhr.send(null);
        }


        store.get(url).then(function(content){
        	if(content){
	            store.get(id).then(function(url){
	            	if(!url){
	            		store.set(id, url, timeLong);
	            	}
	            })
        		callback(content);
        	}else{
        		_load(url, callback);
        	}
        	
        });
    }


	if(!supportsIndexDB()){
		return false;
	}
	
	var myCustomDriver = {
	    driver : localforage.INDEXEDDB,
		name: 'hyResources'
	}

	var store = localforage.createInstance(myCustomDriver);


	window.storage = {
		_init : function(){
			var d = new Date().getTime();
	        store.iterate(function(value, key, iterationNumber) {
			    if(Object.prototype.toString.call(value).toLowerCase().indexOf('array') > 0){
			    	var expires = value[0].expires;
	                if(expires && /^\d{13,}$/.test(expires) && expires <= d) store.removeItem(key);
			    }
			})
	        
		},
		get: function(name){

			return store.getItem(name).then(function(val){
				if(!val) return null;
				
				if(typeof val != 'object') {
					return val;
				}

				var expires = val[0].expires;
                if(expires && /^\d{13,}$/.test(expires)){
                    var d = new Date().getTime();
                    if(expires <= d){
                        store.removeItem(name);
                        return null;
                    }
                    val.shift();
                }
                return val[0];
			});
		},
		set : function(name,value,seconds){
			var v = [];
            if(seconds){
                var d = new Date().getTime();
                v.push({"expires":(d + seconds*1000)});
            }
            v.push(value);


			store.setItem(name, v).then(function (value) {

			}).catch(function(err) {
			    //容量超出了
			    if (e.name == 'QuotaExceededError') {
			    	//清空
                    store.clear().then(function() {
                    	//再写入一次
                    	store.setItem(name, v);

					}).catch(function() {

					});
                }  
			});
		},
        remove: function(name){
            store.removeItem(name);
        },
        loadByXHR : loadByXHR
	}

	window.storage._init();

})(window);
