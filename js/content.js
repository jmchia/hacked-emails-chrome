var j = document.createElement('script');
j.src = chrome.extension.getURL('/js/lib/jquery.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('/js/lib/gmail.js');
(document.head || document.documentElement).appendChild(g);

var s = document.createElement('script');
s.src = chrome.extension.getURL('/js/main.js');
(document.head || document.documentElement).appendChild(s);


var link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.extension.getURL('/css/styles.css');
link.media = 'all';
(document.head || document.documentElement).appendChild(link);

