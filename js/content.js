/**
 * Chrome extension to retrieve message data from gmail messages show related information
 * @author Arman Tshitoyan
 */
var HSH = {
    init: function () {

        var self = this;

        self.inboxRows = $(".UI").find(".zA");
        self.isMessageView = false;
        self.identifier = "HSH";
        self.apiUrl = "https://hacked-emails.com/api_results";

        self.cache = {};
        self.response = {};
        self.history = {};
        self.conversationCount = 0;
        self.prevMessageId = "";


        $("script").each(function () { //Loading scripts
            jQuery.globalEval($(this).html());
        });

        if (typeof GLOBALS !== "undefined") {
            self.userId = GLOBALS[9];          // UserID for headers queries
            self.base_url = GLOBALS[31];        // GMail base url (multi-account login)
            self.headersUrl = self.base_url + '?ui=2&ik={userId}&view=om&th={messageId}';
        }

        var checkMessageView = function () { // Check current view
            // is message view
            if ($(".nH .gs").length > 0 && (!self.isMessageView || (self.prevMessageId === self.messageId && self.conversationCount < $(".gs .ii.gt.adP").length))) {
                self.initMessageView();
            } else if ($(".nH .gs").length > 0 && (!self.isMessageView || self.prevMessageId !== self.messageId)) {
                self.prevMessageId = self.messageId;
                self.initMessageView();
            } else if ($(".nH .gs").length === 0) {
                self.initInboxView();
            }
        };

        function loopingFunction() { //check view every 0,5 seconds
            checkMessageView();
            window.setTimeout(loopingFunction, 500);
        }
        loopingFunction();

    },
    initMessageView: function () { //init message variables
        var self = this;
        if ($(".gs .ii.gt.adP").length === 0) {
            self.isMessageView = false;
            self.conversationCount = 1;
            return;
        }
        var urlHash = window.location.hash;
        var questionMarkIndex = urlHash.indexOf("?");
        if (questionMarkIndex > -1) {
            urlHash = urlHash.substr(0, questionMarkIndex);
        }
        var hashParts = urlHash.replace(/#/g, '').split("/");
        var messageId = hashParts[hashParts.length - 1];
        self.messageId = messageId;
        if (messageId === "") {
            self.isMessageView = false;
            self.conversationCount = 1;
            return;
        }
        if (self.prevMessageId === self.messageId && self.conversationCount >= $(".gs .ii.gt.adP").length) {
            self.isMessageView = false;
            self.conversationCount = 1;
            return;
        }
        self.isMessageView = true;

        if (typeof self.cache[self.messageId] === "undefined") {
            self.cache[self.messageId] = {};
            self.response[self.messageId] = {};
        }
        if (typeof self.history[self.messageId] === "undefined") {
            self.history[self.messageId] = [];
        }

        $.each($(".gs .ii.gt.adP"), function (index, item) {
            var messageId = "";
            var classes = $(item).attr('class').split(" ");
            for (var i = 0; i < classes.length; i++) {
                if (classes[i].length === 17) {
                    messageId = classes[i].substr(1);
                    break;
                }
            }
            var found = false;
            for (var i in self.history) {
                for (var j in self.history[i]) {
                    if (self.history[i][j] === messageId) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
            if (!found) {
                self.history[self.messageId].push(messageId);
            }
            if (typeof self.cache[self.messageId][messageId] === "undefined") {
                self.cache[self.messageId][messageId] = "";
            }
            if (typeof self.response[self.messageId][messageId] === "undefined") {
                self.response[self.messageId][messageId] = "";
            }

        });
        var params = {};
        params['identifier'] = self.identifier;
        window.postMessage(params, "*");
        self.conversationCount = $(".gs .ii.gt.adP").length;
        return true;
    },
    initInboxView: function () { //no message
        var self = this;
        self.isMessageView = false;
        self.conversationCount = 0;
        return true;
    },
    callApi: function (conversationId) { //call to hacked-emails.com api

        var self = this;
        var email = self.cache[self.messageId][conversationId]

        $.getJSON(self.apiUrl, {q: email})
                .done(function (json) {
                    //console.log(json);
                    self.response[self.messageId][conversationId] = json; //Results cache
                    self.addResponseToWebpage(conversationId, json);
                })
                .fail(function (jqxhr, textStatus, error) {
                    //var err = textStatus + ", " + error;
                    //console.log("Request Failed: " + err);
                });
    },
    callShowOriginal: function () { //call to gmail to get headers
        var self = this;
        var conversationIndex = 0;
        $.each(self.history[self.messageId], function (index, conversationId) {
            if ($(".m" + conversationId).length > 0) {
                if (typeof self.cache[self.messageId][conversationId] === "undefined" || self.cache[self.messageId][conversationId] === null || self.cache[self.messageId][conversationId] === "" || Object.keys(self.cache[self.messageId][conversationId]).length === 0) {
                    var url = self.headersUrl.replace("{userId}", self.userId).replace("{messageId}", conversationId);
                    chrome.runtime.sendMessage({
                        method: 'POST',
                        action: 'xhttp',
                        url: url
                    }, function (response) {
                        var id = self.history[self.messageId][conversationIndex];
                        conversationIndex++;
                        var responseText = response['responseText'];
                        var messageHeaders = self.parseMessageHeaders(responseText);
                        if (messageHeaders === false) {
                            return false;
                        }
                        self.cache[self.messageId][id] = messageHeaders;
                        self.callApi(id);
                    });
                } else if (typeof self.response[self.messageId][conversationId] !== "undefined" && self.response[self.messageId][conversationId] !== null && self.response[self.messageId][conversationId] !== "" || Object.keys(self.response[self.messageId][conversationId]).length > 0) {
                    self.addResponseToWebpage(conversationId, self.response[self.messageId][conversationId]);
                } else {
                    self.callApi(conversationId);
                }
            }
        });
    },
    addResponseToWebpage: function (conversationId, json) { //print response
        var self = this;

        if (json.results > 0) {
            displayText = "Email hacked: found " + json.results + " results";
            displayImage = chrome.extension.getURL("icons/email_hacked.png");
        }
        else {
            displayText = "Email safe";
            displayImage = chrome.extension.getURL("icons/email_ok.png");
        }
        var containerClassName = "hsh_container";
        var textElementClassName = "hsh_text";
        var imgElementClassName = "hsh_img";

        var added = $("div.ha").children("." + containerClassName).length;
        if (!added) {
            var container = $('<div></div>')
                    .addClass(containerClassName);

            var imgElement = $('<img>')
                    .addClass(imgElementClassName)
                    .attr('src', displayImage)
                    .attr('title', displayText);

            var anchorElement = $('<a></a>')
                    .attr('href', 'https://hacked-emails.com/check_email?q=' + json.query)
                    .attr('target', '_blank')
                    .attr('title', displayText);
            ;

            container.append($(anchorElement).wrapInner(imgElement));

            $("div.ha").prepend(container);
        }
    },
    parseMessageHeaders: function (messageHeaders) { //parse gmail headers and get the from email
        var self = this;
        var FromIndices = self.getIndicesOf("From:", messageHeaders, true);
        var headers = [];
        for (var i = 0; i < FromIndices.length; i++) {
            var index = messageHeaders.indexOf("\n", FromIndices[i]);
            headers[FromIndices[i]] = messageHeaders.substring(FromIndices[i], index);
        }
        if (headers.length < 1) {
            return false;
        }
        var stringHeaders = "";
        for (var index in headers) {
            stringHeaders += headers[index] + "\n";
        }
        emails = self.parseEmails(stringHeaders);
        return emails[0];
    },
    getIndicesOf: function (searchStr, str, caseSensitive) { // auxiliary function
        var startIndex = 0, searchStrLen = searchStr.length;
        var index, indices = [];
        if (!caseSensitive) {
            str = str.toLowerCase();
            searchStr = searchStr.toLowerCase();
        }
        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
            indices.push(index);
            startIndex = index + searchStrLen;
        }
        return indices;
    },
    parseEmails: function (text)  // auxiliary function
    {
        return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    }


};

window.addEventListener("message", function (event) { // for each message we get the headers
    // We only accept messages from ourselves
    if (event.source != window)
        return;

    if (event.data.identifier && (event.data.identifier === HSH.identifier)) {
        HSH.callShowOriginal();
    }
}, false);

$(document).ready(function () {
    if (document.getElementsByClassName('aAU')) {
        HSH.init();
        var inboxRows = HSH.inboxRows;
        if (inboxRows.length > 0) {
            // inbox view
            HSH.initInboxView();
        } else {
            // message view
            HSH.initMessageView();
        }
    }
});
