var container = {
    run () {
        $(function () {
           var app = {
               init() {
                   console.log("我是主页的container组件");
               },
               param: {},
               bindEvent() {}
           }
            
          app.init();
        });
    }
};


return container;