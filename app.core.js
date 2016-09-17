'use strict';
var React = require('react-native');

var {
  AsyncStorage,
  AlertIOS,
} = React;


var currentRequest = {};
var App = {

    config: {

      api: 'your hosst',
      // app 版本号
      version: 1.1,

      debug: 1,
    },

    serialize: function (obj) {
      var str = [];
      for (var p in obj)
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      return str.join("&");
    },

    // build random number
    random: function () {
      return ((new Date()).getTime() + Math.floor(Math.random() * 9999));
    },


    getGUID: function () {
      var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      };
      return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },


    async isLogin() {
      var key = 'gloabl_login_token';

      // {token: '',expire_time: '',user: {userid:1,username:'',head_url}}
      var token = await AsyncStorage.getItem(key);
      if (token === false) {
        return false;
      }

      return typeof (token) === 'string' ? token : '';

    },

    async getAccessToken() {
      //return '483a757f-0ba2-4b6f-93e8-32c2e975d4a8';
      return await this.isLogin();
    },
    // 获取授权的web url地址  
    async getAuthWebUrl(targetUrl,cb) {
      let token = await App.isLogin();
      let url = 'http://your host/redirect?access_token=' + token + '&url=' + encodeURIComponent(targetUrl + '?HIDE_HEADER=1&ios_ref=1'); 
                                                                                                              typeof cb == 'function' && cb(url); 
      this.config.debug && console.info(url);
    },

    // 清除用户的缓存数据            
    clearUserCache() {
      return this.setASCache('gloabl_login_token', '');
    },


    async checkLogin(func) {
      var key = 'gloabl_login_token';
      var value = await AsyncStorage.getItem(key);
      if (value !== null) {
        func(value);
      } else {
        func(false);
      }

    },

    async getUser(func) {
      var user = await AsyncStorage.getItem('user');
      if (user != null) {
        user = JSON.parse(user);
        func(user);
      }
    },

    async queryASVal(key) {
      var value = await AsyncStorage.getItem(key);
      if (value === null) {

        return false;
      }
      return value;
    },

    setASCache(key, value) {
      if (typeof value == 'object') {
        value = JSON.stringify(value);
      }

      AsyncStorage.setItem(key, value)
    },

    setCurrentRequest: function (url, errcode) {
      // to do remote alarm platform

      return currentRequest = {
        url: url,
        errcode: errcode
      };
    },

    // core ajax handler
    async send(url, options) {
      var self = this;
      var token = await this.getAccessToken();
      var defaultOptions = {
        method: 'GET',
        error: function () {
          options.success({
            'errcode': 501,
            'errstr': '系统繁忙,请稍候尝试'
          });
        },
        headers: {
          'Authorization': token,
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded charset=UTF-8',
        },
        data: {
          // prevent ajax cache if not set 
          '_regq': self.random()
        },
        dataType: 'json',
        success: function (result) {}
      };

      var options = Object.assign({}, defaultOptions, options);
      var httpMethod = options['method'].toLocaleUpperCase();
      var full_url = '';
      if (httpMethod === 'GET') {
        full_url = this.config.api + url + '?' + this.serialize(options.data);
      } else {
        // handle some to 'POST'
        full_url = this.config.api + url;
      }

      if (this.config.debug) {
        console.log('HTTP has finished %c' + httpMethod + ':  %chttp://' + full_url, 'color:red;', 'color:blue;');
      }
      options.url = full_url;


      var cb = options.success;

      // build body data 
      if (options['method'] != 'GET') {
        let formData = new FormData();
        for (let k in options.data) {
          formData.append(k, options.data[k]);
        }
        options.body = formData;
      }

      // todo support for https
      return fetch('http://' + options.url, options)
        .then((response) => response.json())
        .then((res) => {
          self.config.debug && console.log(res);
          if (res.errcode == 101) {
            return self.doLogin();
          }

          if (res.errcode != 0) {

            self.handeErrcode(res);
          }
          return cb(res, res.errcode == 0);
        })
        .catch((error) => {
          console.warn(error);
        });
    },


    handeErrcode: function (result) {
      //
      if (result.errcode == 123) {


        return false;
      }

      this.config.debug&&console.log(result);
      return this.sendMessage(result.errstr);
    },
    
    // 提示类

    sendMessage(msg, title) {
      if (!msg) {
        return false;
      }
      var title = title || '提示';

      AlertIOS.alert(title, msg);
    },

    confirm: function (title, msg, func) {
      if (!msg) {
        return false;
      }
      var title = title || '提示';

      AlertIOS.alert(title, msg, [
        {
          text: '好',
          onPress: function () {
            let okClick = typeof func == 'function' && func();
          }
  },
        {
          text: '取消',
          onPress: function () {
            // TODO cancel
          },

        }
    ]);
    },

    };

    module.exports = App;
