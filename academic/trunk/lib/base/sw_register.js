if('serviceWorker' in navigator && location.protocol === 'https:') {
	window.addEventListener('load', function() {
		if (navigator.serviceWorker) {

			function loadScript(url, callback) {
		        var doc = document;
		        var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
		        var script = doc.createElement("script");
		        if ('onload' in script) {
		            script.onload = onload
		        }else {
		            script.onreadystatechange = function(){
		                if( /loaded|complete/.test(script.readyState) ){
		                    onload()
		                }
		            }
		        }
		        function onload () {
		            script.onload = script.onreadystatechange = null;
		            //head.removeChild(script);
		            script = null;

		            typeof callback === 'function' && callback()
		        }
		        
		        script.charset = 'utf-8'
		        script.type = 'text/javascript'
		        script.async = true
		        script.src = url
		        head.appendChild(script)
		    }
		    function registerSw() {
				navigator.serviceWorker.register('./sw.js',{ 
                    scope: './'
                }).then(function(registration) {
					console.log('ServiceWorker registration successful with scope: ', registration.scope);
					function isWeixn(){  
					    var ua = navigator.userAgent.toLowerCase();  
					    if(ua.match(/MicroMessenger/i)=="micromessenger") {  
					        return true;  
					    } else {  
					        return false;  
					    }  
					}  

					if (!isWeixn()) {
						navigator.serviceWorker.addEventListener('message', function(e) {
						    // service-worker.js 如果更新成功会 postMessage 给页面，内容为 'sw.update'
						    if (e.data === 'sw.update') {
						        var dom = document.createElement('div');
						        var themeColor = document.querySelector('meta[name=theme-color]');
						        themeColor && (themeColor.content = '#000');
						        dom.innerHTML = '<style>'+
						                '.app-refresh{background:#000;height:0;line-height:52px;overflow:hidden;position:fixed;top:0;left:0;right:0;z-index:10001;padding:0 18px;transition:all .3s ease;-webkit-transition:all .3s ease;-moz-transition:all .3s ease;-o-transition:all .3s ease;}'+
						                '.app-refresh-wrap{display:flex;color:#fff;font-size:15px;}'+
						                '.app-refresh-wrap label{flex:1;}'+
						                '.app-refresh-show{height:52px;}'+
						            '</style>'+
						            '<div class="app-refresh" id="app-refresh">'+
						                '<div class="app-refresh-wrap" onclick="location.reload()">'+
						                    '<label>已更新最新版本</label>'+
						                    '<span>点击刷新</span>'+
						                '</div>'+
						            '</div>';
						        document.body.appendChild(dom);
						        setTimeout(function(){
						        	document.getElementById('app-refresh').className += ' app-refresh-show'
						        }, 16);
						    }
						});
					}
				    
				}).catch(function(err) {
	                console.log('ServiceWorker registration err: ', err);
	            });
		    }
			function unregisterSw() {
				navigator.serviceWorker.getRegistrations().then(function(regs) {
					for(var registration in regs) {
						regs[registration].unregister().then(function(boolean) {
						    if(boolean){
						    	console.log('ServiceWorker 取消注册! ' + regs[registration].scope)
						    }
						});
					} 
				})
			}
			var date = new Date;
			date.setSeconds(0);
			date.setMilliseconds(0);
			date = date.getTime();
			// 一分钟更新一次
			loadScript('https://a.msstatic.com/huya/hd/h5/sw/sw_config.js?t=' + date, function() {
				if (SW_CONFIG.downgrade) {
					unregisterSw();
				} else {
					registerSw();
				}
			})
		}	
	})
}