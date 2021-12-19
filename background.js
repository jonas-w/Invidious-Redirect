// Code from: https://github.com/jdfreder/pingjs/blob/master/ping.js
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ping = factory();
  }
})(this, function () {
  /**
   * Creates and loads an image element by url.
   * @param  {String} url
   * @return {Promise} promise that resolves to an image element or
   *                   fails to an Error.
   */
  function request_image(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(url);
      };
      img.src =
        url +
        "?random-no-cache=" +
        Math.floor((1 + Math.random()) * 0x10000).toString(16);
    });
  }

  /**
   * Pings a url.
   * @param  {String} url
   * @param  {Number} multiplier - optional, factor to adjust the ping by.  0.3 works well for HTTP servers.
   * @return {Promise} promise that resolves to a ping (ms, float).
   */
  function ping(url, multiplier) {
    return new Promise(function (resolve, reject) {
      var start = new Date().getTime();
      var response = function () {
        var delta = new Date().getTime() - start;
        delta *= multiplier || 1;
        resolve(delta);
      };
      request_image(url).then(response).catch(response);

      // Set a timeout for max-pings, 5s.
      setTimeout(function () {
        reject(Error("Timeout"));
      }, 5000);
    });
  }

  return ping;
});
var instances = [];
var fastest = ["redirect.invidious.io", 1500];
function getHealthiest(asyncQ = true) {
  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        fastest[1] = 1500; //reset to high ping
        instances = JSON.parse(xhr.response);
        for (var i = 0; i < 5; i++) {
          var host = instances[i][0];
          ping("https://" + host).then((t) => {
            console.log(t);
            if (fastest[1] > t) {
              fastest = [host, t];
            }
          });
        }
      }
    }
  });
  xhr.open(
    "GET",
    "https://api.invidious.io/instances.json?sort_by=type,health",
    asyncQ
  );
  xhr.send();
}
setInterval(function () {
  getHealthiest();
}, 30000);
getHealthiest();
browser.webRequest.onBeforeRequest.addListener(
  function (a) {
    if (a.documentUrl == undefined) {
      console.log(a);
      if (a.url.includes("youtube.com") || a.url.includes("youtu.be")) {
        const yUrl = new URL(a.url);
        return {
          redirectUrl: "https://" + fastest[0] + yUrl.pathname + yUrl.search,
        };
      }
    }
  },
  {
    urls: [
      "https://youtube.com/*",
      "https://youtu.be/*",
      "https://*.youtube.com/*",
      "https://*.youtu.be/*",
    ],
  },
  ["blocking"]
);
