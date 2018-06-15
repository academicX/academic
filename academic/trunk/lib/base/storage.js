window.storage = (function(){
    var _localStorage = function(){
        //Clear the outdated data
        var d = new Date().getTime();
        for(key in localStorage){
            var v = localStorage.getItem(key);
            //If you add storage throw localStorage.setItem("abc","abcvalue") not Storage.set("abc","abcvalue"),it will catch an error when parse the value "abcvalue" 
            try{v = JSON.parse(v)}catch(e){};
            if(Object.prototype.toString.call(v).toLowerCase().indexOf('array') > 0){
                var expires = v[0] && v[0].expires;
                if(expires && /^\d{13,}$/.test(expires) && expires <= d) localStorage.removeItem(key);
            }
        }
        return {
            get: function(name){
                var v = localStorage.getItem(name);
                if(!v) return null;
                try{v = JSON.parse(v)}catch(e){};
                if(typeof v != 'object') return v;
                //If the first element is an object with "expires" property, it may be an expiring date(number at least 13 digits) of the current data. 
                var expires = v[0] && v[0].expires;
                if(expires && /^\d{13,}$/.test(expires)){
                    var d = new Date().getTime();
                    if(expires <= d){
                        localStorage.removeItem(name);
                        return null;
                    }
                    v.shift();
                }
                return v[0];
            },
            set: function(name,value,seconds){
                var v = [];
                if(seconds){
                    var d = new Date().getTime();
                    v.push({"expires":(d + seconds*1000)});
                }
                v.push(value);

                try {
                    localStorage.setItem(name,JSON.stringify(v));
                } catch (e) {
                    //localstorage写满时,全清掉
                    if (e.name == 'QuotaExceededError' || e.name == 'NS_ERROR_DOM_QUOTA_REACHED') {
                        localStorage.clear();
                    }
                    //再重新写入一次
                    localStorage.setItem(name,JSON.stringify(v));
                }
            },
            remove: function(name){
                localStorage.removeItem(name);
            }
        }
    }
    var cookie = {
        get: function(name){
            var v = document.cookie,result;
            var start = v.indexOf(name + '='),end = v.indexOf(';',start);
            if(end == -1) end = v.length;
            if(start > -1){
                result = v.substring(start + name.length + 1,end);
                try{result = JSON.parse(result)}catch(e){};
                return result;
            }else{
                return null;
            }
        },
        set: function(name,value,seconds,path,domain){
            var path = path || '/',expires = '';
            if(seconds){
                //IE:expires,Others:max-age
                if(window.ActiveXObject){
                    var d = new Date();
                    d.setTime(d.getTime() + seconds*1000);
                    expires = 'expires=' + d.toGMTString();
                }else{
                    expires = 'max-age=' + seconds;
                }
            }
            document.cookie = name + '=' + JSON.stringify(value) + ';' + expires + ';path=' + path + ';' + (domain ? ('domain=' + domain):'');
        },
        remove: function(name,path,domain){
            this.set(name,'',-1,path,domain);
        }
    }


    var adapter = _localStorage();




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
                        var oldUrl = store.get(id);

                        if (oldUrl) {
                            store.remove(oldUrl);
                        }
                        
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

        if ((content = store.get(url))) {
            
            if (!store.get(id)) {
                store.set(id, url, timeLong);
            }

            callback(content);
        } else {
            _load(url, callback);
        }
    }


    return {
        get:adapter.get,
        set:adapter.set,
        loadByXHR : loadByXHR,
        remove:adapter.remove,
        cookie:cookie
    }
})();

    
