

;(function() {

	if (!window.performanceInfo || !window.performance || !document.addEventListener) {
		return false
	}

    var schema = 'http';
    var swStatus = '0';
	if(window.location.protocol === 'https:') {
		schema = 'https';
    }

    if ('serviceWorker' in navigator && schema == 'https') {
        swStatus = '1';
    }
    
    
    var pageTimeOut =  window.performanceInfo.pageTimeOut || 5000;  // 页面超时时间  
    var apiTimeOut = window.performanceInfo.apiTimeOut || 2000;   // 接口超时时间

    var yyuid = getCookieVal('yyuid') || 0;

    /*<debug>*/
    var server = '//116.31.112.109:8080/?';
    /*</debug>*/
    
    /*<prod>*/
    var server = '//metric.huya.com/?';
    /*</prod>*/
    
    function getCookieVal(cookieName) {
        var arrstr = document.cookie.split("; ");
        for (var i = 0; i < arrstr.length; i = i + 1) {
            var kv = arrstr[i].split("=");
            if (kv[0] == cookieName) return decodeURIComponent(kv[1]);
        }
        return "";
    }


    var platform = (function(){
        var u = navigator.userAgent;
        var device = 'web';
        if (u.indexOf('Android') > -1 || u.indexOf('Adr') > -1) {
            device = 'android';
            return device;
        }
        if (!!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
            device = 'ios';
            return device;
        }
        return device;
    })();

    function toXCodeArray(str) {
        var x = [];
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c < 0x80) x.push(c);
            else if (c < 0x800) {
                x.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
            } else if (c < 0xd800 || c >= 0xe000) {
                x.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
            } else {
                i++;
                c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                x.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
            }
        }
        return x;
    };
    
    function xEncode(data, key) {
        var r = t = o = "";
        var i = m = 0;
        var mm = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var c1, c2, c3, e1, e2, e3, e4;	
        dArray = toXCodeArray(data);
        for (i = dArray.length - 1, j = 0; i >= 0; i--) {
            t = dArray[i] ^ key.charCodeAt(j) ^ m;
            r = r + String.fromCharCode(t);
            j = (++j) % key.length;
            m = t;
        }
        i = 0;	
        while (i < r.length) {
            c1 = r.charCodeAt(i++);
            c2 = r.charCodeAt(i++);
            c3 = r.charCodeAt(i++);
            e1 = c1 >> 2;
            e2 = ((c1 & 3) << 4) | (c2 >> 4);
            e3 = ((c2 & 15) << 2) | (c3 >> 6);
            e4 = c3 & 63;
            if (isNaN(c2)) {
                e3 = e4 = 64;
            } else if (isNaN(c3)) {
                e4 = 64;
            }
            o = o + mm.charAt(e1) + mm.charAt(e2) + mm.charAt(e3) + mm.charAt(e4);
        }
        return o;
    };

    /*     
    {
        "ua": "web&lsj", // lsj:老司机（页面）
        "uid": 1,
        "sguid": "",
        "m": [
               {
                   "name":"fed.page.performance",  // fed.page.index ： 前端组：页面：指标
                   "its" : 1,
                   "suc" : 1,
                   "code": 0,
                   "value":100,
                   "dim":
                   {
                       "path" : "liveui/userInfo"
                   }
               }
           ]
    } 
    */

    // 自定义上报
    var reportCustom = function(m, timestamp, sguid){
        var oAjax = null;

        if (window.XDomainRequest) {
            oAjax = new XDomainRequest();
        }else {
            oAjax=window.XMLHttpRequest? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
        }

        var oReport = {
            'ua': platform + '&' + window.performanceInfo.pageview, // lsj:老司机（页面）
            'uid': yyuid || 0,
            'sguid' : sguid || 0,
            'm' : m
        }

       

        window.console && console.log(oReport);

        // APP日志打印
        window.HUYASdk && HUYASdk.log(window.performanceInfo.pageview + ':' + JSON.stringify(oReport));

		var dataPost = JSON.stringify(oReport);
		var postData = xEncode(dataPost, timestamp+'');
		var url = server + 'ts=' + timestamp;
        oAjax.open('POST', url, true);
        //oAjax.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        oAjax.send(postData);
    }


    // -------------------- 页面性能上报 start--------------------- //
    ;(function(){
        function timerParam(obj, timestamp){
            var p = [];
            var firstVisitStatus = '';
            var pageview = 'report-' + window.performanceInfo.pageview;
            // 首次访问的状态
            try{
                firstVisitStatus = localStorage.getItem(pageview);  
                if (!firstVisitStatus) {
                    localStorage.setItem(pageview, 'no_firstvisit'); 
                    firstVisitStatus = 'yes_firstvisit';
                }
            }catch(e){
                firstVisitStatus = 'pending_firstvisit'
            }
    
             // 记录最慢的请求资源且最小要大于3s
            function recordSlowRequest(item, key, value) {
    
                if (key == 'loadTime' && value > pageTimeOut && window.performance.getEntries) {
    
                    var entries = window.performance.getEntries();
                    var exdescObj = {
                        duration: 0,
                        name: ''
                    };
                    entries.forEach(function (entry) {
                        if (entry.entryType == 'resource' && entry.duration > 3000 && entry.duration > exdescObj.duration) {
                            exdescObj = {
                                duration: Math.floor(entry.duration),
                                name: entry.name
                            }
                            
                        }
                    });
    
                    if (exdescObj.duration !=0) {
                        var exdesc = '';
                        exdescObj.name = exdescObj.name.slice(0, 150); // 怕请求太长了
                        for (var k in exdescObj) {
                            exdesc += (k +'=' + exdescObj[k] + '&')
                        }
                        item.exdesc = exdesc.slice(0, exdesc.length-1) + '&swStatus=' + swStatus;
                    }
    
                    item.exlog.a = firstVisitStatus
                }
    
                return item;
            }
    
    
            for(var k in obj){
    
                var item = {
                    'name': 'fed.page.performance',  // fed.page.index ： 前端组：页面：指标
                    'its' : timestamp,
                    'suc' : 1,
                    'code': 0,
                    'value': obj[k],
                    'dim': {
                        'path' : k,
                        'schema': schema
                    },
                    'exlog': {}
                }
    
                item = recordSlowRequest(item, k, obj[k]);
    
    
                p.push(item);
                
            }
            return p;
        }
        function send(data){
            var timestamp = +new Date();
            var m = timerParam(data, timestamp);
            reportCustom(m, timestamp);
        }
        var timeNum = 0; // 每隔200ms去查询是否存在window.performanceInfo.firstScreenTime，最多查询50次（也就是10S）;
        function performanceReport () {
    
                if (timeNum >= 50) {
                    return false;
                }
    
                if(!window.performanceInfo.firstScreenTime) {
                    timeNum++;
                    setTimeout(function(){
                        performanceReport();
                    }, 200);
                    return false;
                } 
    
                var timing = performance.timing;
                
                if (timing.navigationStart>0) {
                    send({
                        whiteScreenTime: performanceInfo.whiteScreenTime - timing.navigationStart,  // 白屏时间
                        firstScreenTime: performanceInfo.firstScreenTime - timing.navigationStart, // 首屏时间
                        readyTime: timing.domContentLoadedEventEnd - timing.navigationStart,  // 用户可操作时间
                        loadTime: performanceInfo.loadTime - timing.navigationStart  // 总下载时间
                    })
                }
                
        }

        var onLoad = function() {
            window.removeEventListener('load', onLoad);
            window.performanceInfo.loadTime = +new Date();
            performanceReport();
        }

        if (performance.timing.loadEventEnd!=0) {
            onLoad();
        } else {
            window.addEventListener('load', onLoad);
        }
    })()
    // -------------------- 页面性能上报 end--------------------- //



    // -------------------- 超时记录页面的成功率 start--------------------- //
    function loadStatus() {
        setTimeout(function() {
            var timestamp = +new Date();
            var suc = 1; // 成功
            if (!window.performanceInfo.firstScreenTime) {
                suc = 0; // 失败
            }
            var m = [
                {
                   'name': 'fed.page.loadStatus',  // fed.page.index ： 前端组：页面：加载的状态
                   'its' : timestamp,
                   'suc' : suc,
                   'code': 0,
                   'value': 1,
                   'dim':
                    {
                        'schema': schema
                    }
               }
            ]
            reportCustom(m, timestamp);
        }, pageTimeOut)
    }
    loadStatus();
    // -------------------- 超时记录页面的成功率 end--------------------- //


    // -------------------- 重置上报方法 start--------------------- //
    ;(function(){

        var apiTimeObj = {}

        var report = function(apiName, times, msg) {
			var apiNameItem = apiTimeObj[apiName];
			if (apiNameItem) {
                apiNameItem.outTimer && clearTimeout(apiNameItem.outTimer);
                
                
				var timer = times - apiNameItem.startTime;
                var timestamp = +new Date();

                var m = [{
                       'name': 'fed.page.index',  // 前端组：页面：指标, 固定值
                       'its' : timestamp,  // 时间戳
                       'suc' : timer > apiTimeOut ? 0 : 1,  // 接口成功码；没有就默认写1
                       'code': 0,  // 接口返回码；没有就默认写0
                       'value':timer,  // 接口的耗时
                       'dim':
                       {
                           'path' : apiName,  // 自定义值。就是接口的名字
                           'schema': schema
                       },
                       'exdesc': msg || ''
                }]
                
                reportCustom(m, timestamp);

                delete apiTimeObj[apiName];

			}
			
		}

        var reportApiTime = function(apiName, status, times, msg) {
			var apiNameItem = apiTimeObj[apiName];
			if (!apiNameItem && status == 'start') {
				apiTimeObj[apiName] = {
					startTime: times,
					outTimer: null
				}

				apiTimeObj[apiName].outTimer = setTimeout(function() {
					report(apiName, +new Date(), msg);
				}, apiTimeOut);

			}

			if (apiNameItem && status == 'end') {
				report(apiName, times, msg);
			}
        }
        



        var reportApiMess = function(apiName, msg, code) {
            var timestamp = +new Date();

            var m = [{
                    'name': 'fed.page.indexMess',
                    'its' : timestamp,  // 时间戳
                    'suc' : 1,  // 接口成功码；没有就默认写1
                    'code': +code || 1,  // 接口返回码；没有就默认写0
                    'value': 1,  // 接口的耗时
                    'dim':
                    {
                        'path' : apiName,  // 自定义值。就是接口的名字
                        'schema': schema
                    },
                    'exdesc': msg || ''
            }]
                
            reportCustom(m, timestamp);
        }


        
        var handle = {
            reportApiTime: reportApiTime,
            reportApiMess: reportApiMess
		}

		// 分发执行对应的函数
		function distribute(arr) {
			var fnName = arr.splice(0,1);
			handle[fnName] && handle[fnName].apply(this, arr);

		}

        function resetReport() {
			var _hmt = window.performanceInfo._hmt || [];
			if (_hmt.length) {
				for(var i=0; i<_hmt.length; i++) {
					distribute(_hmt[i]);
				}
			}


			window.performanceInfo._hmt = [];
			window.performanceInfo._hmt.push = function(arr){
				distribute(arr);
			}
		}
        resetReport();
        
    })()
    // -------------------- 重置上报方法 end--------------------- //

})()