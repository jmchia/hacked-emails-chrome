/**
 * Possible parameters for request:
 *  action: "xhttp" for a cross-origin HTTP request
 *  method: Default "GET"
 *  url   : required, but not validated
 *  data  : data to send in a POST request
 *
 * The callback function is called upon completion of the request */
chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request.action == "xhttp") {
        var xhttp = new XMLHttpRequest();
        var method = request.method ? request.method.toUpperCase() : 'GET';
        var requestType = request.requestType ? request.requestType.toLowerCase() : '';

        xhttp.onload = function () {
            callback({
                responseText: xhttp.responseText,
                cache_header: xhttp.getResponseHeader('cache-control')
            });
        };
        xhttp.onerror = function () {
            // Do whatever you want on error. Don't forget to invoke the
            // callback to clean up the communication port.
            callback();
        };
        xhttp.open(method, request.url, true);
        var data = "";
        if (method == 'POST' && requestType === "json") {
            xhttp.setRequestHeader('Content-Type', 'application/json');
            xhttp.setRequestHeader('Cache-Control', 'max-age: 3888000');

            if (typeof request.data !== "undefined") {
                xhttp.withCredentials = true;
                data = "{\"message-headers\": \"" + request.data.headers + "\"}";
            }
            var details = getEnvironmentDetails();
            xhttp.setRequestHeader('client-version', '1.0');
            xhttp.setRequestHeader('client-language', details.language);
            xhttp.setRequestHeader('device-model', details.browserVersion);
            xhttp.setRequestHeader('platform', details.os);
            xhttp.setRequestHeader('platform-version', details.osVersion);
            xhttp.setRequestHeader('device-id', request.data.id);

        } else {
            xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        if (data.length > 0) {
            xhttp.send(data);
        } else {
            xhttp.send();
        }

        return true; // prevents the callback from being called too early on return
    }
});

function getEnvironmentDetails() {
    var unknown = '-';

    // screen
    var screenSize = '';
    if (screen.width) {
        var width = (screen.width) ? screen.width : '';
        var height = (screen.height) ? screen.height : '';
        screenSize += '' + width + " x " + height;
    }

    // browser
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browser = navigator.appName;
    var version = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;

    // Opera
    if ((verOffset = nAgt.indexOf('Opera')) != -1) {
        browser = 'Opera';
        version = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf('Version')) != -1) {
            version = nAgt.substring(verOffset + 8);
        }
    }
    // Opera Next
    if ((verOffset = nAgt.indexOf('OPR')) != -1) {
        browser = 'Opera';
        version = nAgt.substring(verOffset + 4);
    }
    // MSIE
    else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
        browser = 'Microsoft Internet Explorer';
        version = nAgt.substring(verOffset + 5);
    }
    // Chrome
    else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
        browser = 'Chrome';
        version = nAgt.substring(verOffset + 7);
    }
    // Safari
    else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
        browser = 'Safari';
        version = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf('Version')) != -1) {
            version = nAgt.substring(verOffset + 8);
        }
    }
    // Firefox
    else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
        browser = 'Firefox';
        version = nAgt.substring(verOffset + 8);
    }
    // MSIE 11+
    else if (nAgt.indexOf('Trident/') != -1) {
        browser = 'Microsoft Internet Explorer';
        version = nAgt.substring(nAgt.indexOf('rv:') + 3);
    }
    // Other browsers
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
        browser = nAgt.substring(nameOffset, verOffset);
        version = nAgt.substring(verOffset + 1);
        if (browser.toLowerCase() == browser.toUpperCase()) {
            browser = navigator.appName;
        }
    }
    // trim the version string
    if ((ix = version.indexOf(';')) != -1)
        version = version.substring(0, ix);
    if ((ix = version.indexOf(' ')) != -1)
        version = version.substring(0, ix);
    if ((ix = version.indexOf(')')) != -1)
        version = version.substring(0, ix);

    majorVersion = parseInt('' + version, 10);
    if (isNaN(majorVersion)) {
        version = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    // mobile version
    var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

    // system
    var os = unknown;
    var clientStrings = [
        {s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/},
        {s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/},
        {s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/},
        {s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/},
        {s: 'Windows Vista', r: /Windows NT 6.0/},
        {s: 'Windows Server 2003', r: /Windows NT 5.2/},
        {s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/},
        {s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/},
        {s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/},
        {s: 'Windows 98', r: /(Windows 98|Win98)/},
        {s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/},
        {s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
        {s: 'Windows CE', r: /Windows CE/},
        {s: 'Windows 3.11', r: /Win16/},
        {s: 'Android', r: /Android/},
        {s: 'Open BSD', r: /OpenBSD/},
        {s: 'Sun OS', r: /SunOS/},
        {s: 'Linux', r: /(Linux|X11)/},
        {s: 'iOS', r: /(iPhone|iPad|iPod)/},
        {s: 'Mac OS X', r: /Mac OS X/},
        {s: 'Mac OS', r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
        {s: 'QNX', r: /QNX/},
        {s: 'UNIX', r: /UNIX/},
        {s: 'BeOS', r: /BeOS/},
        {s: 'OS/2', r: /OS\/2/},
        {s: 'Search Bot', r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
    ];
    for (var id in clientStrings) {
        var cs = clientStrings[id];
        if (cs.r.test(nAgt)) {
            os = cs.s;
            break;
        }
    }

    var osVersion = unknown;

    if (/Windows/.test(os)) {
        osVersion = /Windows (.*)/.exec(os)[1];
        os = 'Windows';
    }

    switch (os) {
        case 'Mac OS X':
            osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
            break;

        case 'Android':
            osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
            break;

        case 'iOS':
            osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
            osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
            break;
    }

    var language = navigator.language;

    return {
        screen: screenSize,
        browser: browser,
        browserVersion: version,
        browserMajorVersion: majorVersion,
        mobile: mobile,
        os: os,
        osVersion: osVersion,
        language: language
    };

}