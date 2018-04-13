var j = document.createElement('script');
j.src = chrome.extension.getURL('/js/lib/jquery.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('/js/lib/gmail.js');
(document.head || document.documentElement).appendChild(g);

var s = document.createElement('script');
s.src = chrome.extension.getURL('/js/main.js');
(document.head || document.documentElement).appendChild(s);

var hsh_extension_url = chrome.extension.getURL('/');
var e = document.createElement('script');
var e_code = document.createTextNode('var hsh_extension_url = "'+hsh_extension_url+'";');
e.appendChild(e_code);
(document.head || document.documentElement).appendChild(e);

var link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.media = 'all';
link.href = chrome.extension.getURL('/css/styles.css');
(document.head || document.documentElement).appendChild(link);

