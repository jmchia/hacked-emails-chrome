/**
 * Chrome extension to retrieve message data from gmail messages show related information
 * @author JMChia
 */
var HSH = {
    init: function () {
        var self = this;
        self.identifier = "HSH";
        self.apiUrl = "https://hacked-emails.com/api_results";
        self.img_fav = 'https://hacked-emails.com/images/ch-extension-fav.png'
        self.img_hackfound = 'https://hacked-emails.com/images/ch-extension-hackfound.png'
        self.img_hacknotfound = 'https://hacked-emails.com/images/ch-extension-hacknotfound.png'
        self.cache = {};
    },
    callApi: function (email_address, obj) { //call to hacked-emails.com api
        var self = this;

        localJQuery.getJSON(self.apiUrl, {q: email_address})
            .done(function (json) {
                if (typeof json == 'object') {
                    self.cache[email_address] = json; //Results cache
                    self.addResponseToWebpage(json, obj);
                }

            })
            .fail(function (jqxhr, textStatus, error) {
                //console.log(json);
            });

    },
    query: function (email_address, obj) { //call to gmail to get headers
        var self = this;
        if (typeof  self.cache[email_address] !== "object") {
            self.callApi(email_address, obj);
        } else {
            self.addResponseToWebpage(self.cache[email_address], obj);
        }
    },
    addResponseToWebpage: function (json, domObject) { //print response
        var self = this;

        if (json.status == "found") {
            displayText = "Email hacked: found " + json.results + " results";
            displayImg = self.img_hackfound;
            //   localJQuery(".aju img", domObject).css("border", "2px solid red");
        } else {
            displayText = "Email safe";
            displayImg = self.img_hacknotfound;
            // localJQuery(".aju img", domObject).css("border", "2px solid lime");
        }
        var imgElement = localJQuery('<img>')
            .attr('src', displayImg)
            .attr('width', 26)
            .attr('title', displayText);

        var anchorElement = localJQuery('<a></a>')
            .attr('href', 'https://hacked-emails.com/check_email?q=' + json.query)
            .attr('target', '_blank')
            .attr('title', displayText)
            .css('float', 'left')
            .css('margin', '2px 10px 0px -10px');

        localJQuery(".gE", domObject).prepend(localJQuery(anchorElement).wrapInner(imgElement));
    }
}
var gmail_hsh;

function onDocReady(f) {
    if ((/in/.test(document.readyState)) || (typeof Gmail === undefined)) {
        setTimeout('onDocReady(' + f + ')', 10);
    } else {
        f();
    }
}

var main = function () {
    HSH.init();
    gmail_hsh = new Gmail();
    console.log('Hacked Emails checker for GMail. Hello ', gmail_hsh.get.user_email())

    gmail_hsh.observe.on('view_thread', function (obj) {
        //console.log('view_thread', obj);
    });
    // now we have access to the sub observers view_email and load_email_menu
    gmail_hsh.observe.on('view_email', function (obj) {
        //console.log('view_email', obj);
        var from = obj.from();
        //console.log('Email is from', from.email); // {email: 'user@user.com', name: 'Display Name'}
        HSH.query(from.email, obj.dom());
    });
}
onDocReady(main);