var healthiest = "";
function getHealthiest(asyncQ = true) {
  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        healthiest = JSON.parse(xhr.response)[0][0];
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
getHealthiest(false);
console.log("hi");
browser.webRequest.onBeforeRequest.addListener(
  function (a) {
    if (a.documentUrl == undefined) {
      console.log(a);
      if (a.url.includes("youtube.com") || a.url.includes("youtu.be")) {
        const yUrl = new URL(a.url);
        return {
          redirectUrl: "https://" + healthiest + yUrl.pathname + yUrl.search,
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
