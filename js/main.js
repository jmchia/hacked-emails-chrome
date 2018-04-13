/**
 * Chrome extension to retrieve message data from gmail messages show related information
 * @author JMChia
 */
var HSH = {
    init: function () {
        var self = this;
        self.identifier = "HSH";
        self.apiUrl = "https://hacked-emails.com/api_results";
        self.img_hackfound = hsh_extension_url+'images/leakfound.png';
        self.img_hacknotfound = hsh_extension_url+'images/leaknotfound.png';
        self.gmailSidebar = null;
        self.hshSidebar = null;
        self.cache = {};
    },
    init_sidebar: function () {
        var self = this;
        //Check sidebar every thread iteraction
        self.gmailSidebar = localJQuery('div[role="complementary"].nH').parent();

        if (localJQuery('#hsh_sidebar', self.gmailSidebar).length == 0)
            localJQuery('<div id="hsh_sidebar"><h5>Hacked Emails security check</h5></div>').prependTo(self.gmailSidebar);

        self.hshSidebar = localJQuery('#hsh_sidebar', self.gmailSidebar);
    },
    callApi: function (email_address, obj, resposeToDom) { //call to hacked-emails.com api
        resposeToDom = typeof resposeToDom !== 'undefined' ? resposeToDom : "email_view";
        var self = this;

        localJQuery.ajax({
            url: self.apiUrl,
            dataType: 'json',
            async: true,
            data: {q: email_address},
            success: function (json) {
                if (typeof json == 'object') {
                    self.cache[email_address] = json; //Results cache
                    if (resposeToDom == "email_view")
                        self.addResponseToEmailView(json, obj);
                    else
                        self.addResponseToSidebar(json, obj);
                }
            }
        });


    },
    query_thread: function (thread_obj) {
        var self = this;
        var unique_emails = {};
        self.init_sidebar();

        localJQuery.each(thread_obj.people_involved, function (key, value) { // Take users from involved
            unique_emails[value[1]] = value[0];
        });

        localJQuery.each(thread_obj.threads, function (key, value) { // Then complete with from vlaue
            unique_emails[value.from_email] = (value.from.length > 0 ) ? value.from : value.from_email;
        });

        localJQuery.each(unique_emails, function (key, value) {
            if (value.length == 0) //Name not present? Take the email!
                value = key;
            self.callApi(key, value, "sidebar");
        });

    },

    query: function (email_address, obj) { //call to gmail to get headers
        var self = this;
        if (typeof  self.cache[email_address] !== "object") {
            self.callApi(email_address, obj);
        } else {
            self.addResponseToEmailView(self.cache[email_address], obj);
        }
    },
    addResponseToEmailView: function (json, domObject) { //print response
        var self = this;

        if (json.status == "found") {
            displayText = "Email hacked: found " + json.results + " results";
            displayImg = self.img_hackfound;
        } else {
            displayText = "Email safe";
            displayImg = self.img_hacknotfound;
        }

        var imgElement = localJQuery('<img>')
            .attr('src', displayImg)
            .attr('width', 26)
            .attr('title', displayText);

        var anchorElement = localJQuery('<a></a>')
            .attr('href', 'https://hacked-emails.com/check_email?q=' + json.query)
            .attr('target', '_blank')
            .attr('title', displayText)
            .attr('class', 'email_view_hsh_anchor');

        localJQuery(".gE", domObject).prepend(localJQuery(anchorElement).wrapInner(imgElement));
    },
    addResponseToSidebar: function (json, name) { //print response
        var self = this;

        if (json.status == "found") {
            displayText = "Email hacked: found " + json.results + " results";
            displayImg = self.img_hackfound;
        } else {
            displayText = "Email safe";
            displayImg = self.img_hacknotfound;
        }

        var imgElement = localJQuery('<img>')
            .attr('src', displayImg)
            .attr('width', 26)
            .attr('title', displayText);

        var anchorElement = localJQuery('<a></a>')
            .attr('href', 'https://hacked-emails.com/check_email?q=' + json.query)
            .attr('target', '_blank')
            .attr('title', displayText);

        var textElement = name;

        localJQuery(self.hshSidebar).append(localJQuery(anchorElement).wrapInner(imgElement).append(textElement));
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
    console.log('Hacked Emails checker for GMail. Hello ', gmail_hsh.get.user_email());

    gmail_hsh.observe.after("open_email", function (id, url, body, xhr) {
        var currentEmail, emails;
        emails = gmail_hsh.get.email_data(id);
        HSH.query_thread(emails);
    });

    gmail_hsh.observe.on('view_thread', function (obj) {
       // console.log('view_thread', obj);
    });

    // now we have access to the sub observers view_email and load_email_menu
    gmail_hsh.observe.on('view_email', function (obj) {
        var from = obj.from();
        HSH.query(from.email, obj.dom());
    });
}
onDocReady(main);