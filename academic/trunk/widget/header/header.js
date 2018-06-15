var header = {
    run () {
        $(function () {
           var app = {
               init() {
                   console.log("我是公共头");
               },
               param: {},
               bindEvent() {}
           }
            
          app.init();
        });
    }
}


return header;