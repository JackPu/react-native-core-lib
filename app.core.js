/**
** a module you often use
**/

'use strict';
var React = require('react-native');

var {
  AsyncStorage,
  AlertIOS,
} = React;


var currentRequest = {};
var App = {

    config: {

        api: 'your host',
        // app 版本号
        version: 1.1,

        debug: 1,
    },

    serialize : function (obj) {
        var str = [];
        for (var p in obj)
            if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    },

    // build random number
    random: function() {
        return ((new Date()).getTime() + Math.floor(Math.random() * 9999));
    },


    getGUID : function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },


    isLogin() {
        var key = 'gloabl_login_key';

        // {token: '',expire_time: '',user: {userid:1,username:'',head_url}}

        var user = this.queryASVal(key);

        if(user === false) {
            return this.doLogin();
        }

        return true;

    },



    async queryASVal(key) {
        var value = await AsyncStorage.getItem(key);
        if(value === null) {

            return false;
        }
        return value;
    },

    setASCache(key,value) {
        if(typeof value == 'object') {
            value = JSON.stringify(value);
        }

        AsyncStorage.setItem(key, value)
    },



    // core ajax handler
    send(url,options) {
        var isLogin = this.isLogin();
        var self = this;


        var defaultOptions = {
            method: 'GET',
            error: function() {
                options.success({'errcode':501,'errstr':'系统繁忙,请稍候尝试'});
            },
            headers:{
                'Authorization': 'your token',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'App': 'your app name'
            },
            data:{
                // prevent ajax cache if not set
                '_regq' : self.random()
            },
            dataType:'json',
            success: function(result) {}
        };

        var options = Object.assign({},defaultOptions,options);
        var httpMethod = options['method'].toLocaleUpperCase();
        var full_url = '';
        if(httpMethod === 'GET') {
            full_url = this.config.api +  url + '?' + this.serialize(options.data);
        }else{
            // handle some to 'POST'
            full_url = this.config.api +  url;
        }

        if(this.config.debug) {
            console.log('HTTP has finished %c' + httpMethod +  ':  %chttp://' + full_url,'color:red;','color:blue;');
        }
        options.url = full_url;


        var cb = options.success;

        // build body data
        if(options['method'] != 'GET') {
            options.body = JSON.stringify(options.data);
        }

        // todo support for https
        return fetch('http://' + options.url,options)
               .then((response) =>  response.json())
               .then((res) => {
                    self.config.debug && console.log(res);
                    if(res.errcode == 101) {
                        return self.doLogin();
                    }

                    if(res.errcode != 0) {

                        self.handeErrcode(res);
                    }
                    return cb(res,res.errcode==0);
                })
                .catch((error) => {
                  console.warn(error);
                });
    },


    handeErrcode: function(result) {
        //
        if(result.errcode == 123){


            return false;
        }

        console.log(result);
        return this.sendMessage(result.errstr);
    },


    // 提示类

    sendMessage: function(msg,title) {
        if(!msg) {
            return false;
        }
        var title = title || '提示';

        AlertIOS.alert(title,msg);
    }

};

module.exports = App;
