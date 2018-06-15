;(function() {

	if (!window.performanceInfo || !window.performance || !document.addEventListener) {
		return false
	}

	var protocol = 'http';
	if(window.location.protocol === 'https:') {
		protocol = 'https';
	}

	var act = 'webhdperformance';
	var server = '//ylog.hiido.com/c.gif?act='+ act +'&pageview=' + window.performanceInfo.pageview + '&protocol=' + protocol +'&';
	function param(obj){
		var p = [];
		for(var k in obj){
			p.push(k + "=" + obj[k]);
		}
		return p.join("&");
	}
	function send(data){
		var d = param(data);
		var url = server + d + '&time='+parseInt(1 * new Date() / 1000);
		var img = new Image();
		img.onload = img.onerror = img.onabort = function(){
		    img.onload = img.onerror = img.onabort = null;
		    img = null;
		};
		img.src = url;
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
					firstScreenTime: performanceInfo.firstScreenTime - timing.navigationStart, //首屏时间
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