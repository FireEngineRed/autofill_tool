//'data_to_message' will hold all the data in key:value pairs to be inputted into the browser page, with the key being the id of the input field, and the value being the value to fill the field with
var data_to_message = {};
var ids = [];
var url = '';
var nothing_to_fill = true;
$(document).ready(function () {

    // grab url and run scripts accordingly/show html accordingly    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let parser = document.createElement('a');
        parser.href = tabs[0].url;
        if (parser.pathname.indexOf('pull-requests') > 0) {
            // on pr page
            chrome.tabs.sendMessage(tabs[0].id, {"action": "forceFillTemplate", "value":true});
            window.close();
        } else {
            // on crm page(s)
            // prevent spaces from being used in template names
            $('#template_name').on('keydown', function (e) {
                return e.which !== 32;
            });

            document.getElementById('tab-2').style.minWidth = '171px';
            document.getElementById('tab-1').style.minWidth = '171px';

            $('#uitab').tabs(); //Make UI tabs on popup.html
            $('button').button();

            //Through a content script, find all of the visible inputs on the browser page
            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                url = tabs[0].url;

                //load jquery so selectors will work
                chrome.tabs.executeScript(null, { file: 'jquery-1.10.2.js' }, function () {
                    //run autofind.js, which will return an array of DOM elements
                    chrome.tabs.executeScript(null, { file: 'autofind.js' });
                });

                //handle the array of DOM elements from autofind.js
                chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {
                    //If there are no inputs on the page, hide all the buttons and text fields.
                    if (response.length === 0) {
                        $('#tempname').hide();
                        $('#autofill').hide();
                        $('#save_template').hide();
                        $('#quickgo').hide();

                        // add message saying there's nothing to autofill
                        $('#selections').append($('<br>')).append($('<label />').html('Nothing to Autofill!'));
                    }
                    else {
                        nothing_to_fill = false;
                    }

                    //loop through 'response' and make checkboxes
                    for (var i = 0; i < response.length; i++) {
                        //make checkboxes for each element in inputs
                        $('#selections').append($('<label />').html(response[i][1]).prepend($('<input/>').attr({ type: 'checkbox', id: response[i][0] })).append($('<br>')));
                    }
                });

                // make the template selections available
                make_template_checkboxes(); //populate the 'use template' tab with all the existing templates
            });

            $('#save_template').click(function () {
                //retrieve the template name from popup page
                var template_name = $('#template_name').val();

                if (template_name === '') {
                    // do something
                }
                else {
                    save_temp(template_name);
                }
            });

            $('#quickgo').click(function () {
                // create random name for template
                var template_name = random_word();
                // save template
                save_temp(template_name);

                // artificially 'select' the new template
                var selected = [template_name];

                // use the artificially selected template to run autofill
                go(selected);

                // remove temporary template by name
                del(selected);
            });

            $('#go').click(function () {
                //selected is an array of the selected templates in templates tab
                var selected = [];

                //for each checked template, append their id to the 'selected' array
                $('#template_boxes input:checked').each(function () {
                    selected.push($(this).attr('id'));
                });

                go(selected);

            });

            $('#delete').click(function () {
                //The selected templates for deletion are held in 'selected'
                var selected = [];

                //Append the IDs of each template marked for deletion to the 'selected' array
                $('#template_boxes input:checked').each(function () {
                    selected.push($(this).attr('id'));
                });

                del(selected);
            });
        }
    });


    function save_temp(template_name) {
        var selected = [];
        //append the id of selected inputs to array
        $('#selections input:checked').each(function () {
            selected.push($(this).attr('id'));
        });

        //store all the template data into one object
        var template_data = {};
        //template_data holds URL, Name, and selected IDs
        template_data.url = url;
        template_data.checked_ids = selected;
        template_data.name = template_name;


        //place template_data into the save array, with the template's name as the key
        var save = {};
        save[template_name] = template_data;

        //store the save object into local storage
        chrome.storage.local.set(save);

        //clear popup.html of all checks and texts
        $('input:checkbox').removeAttr('checked');
        $('#template_name').val('');

        $('#no_templates').remove();
        $('#delete').show();
        $('#go').show();

        //create the checkbox on templates tab for the newly saved template object
        make_template_checkboxes();
    }

    function go(selected) {
        //clear the templates tab of all checks
        $('input:checkbox').removeAttr('checked');

        // If there is nothing to autofill, the urls must not match
        if (nothing_to_fill) {
            chrome.tabs.executeScript(null, { code: 'alert("The url of the template must match the page url.");' });
            return;
        }


        //retrive template's or template's data from local storage
        chrome.storage.local.get(selected, function (result) {
            //ids will hold the IDs of fields to be filled in the browser page
            ids = [];
            selected.forEach(function (template, template_index) {
                template = result[template];

                if (template.url === url) {
                    // this templates url matches current url, add any new unique checked ids to running list
                    template.checked_ids.forEach(function (field_id) {
                        if (ids.indexOf(field_id) === -1) {
                            ids.push(field_id);
                        }
                    })
                }
                else {
                    selected = selected.splice(template_index, 1);
                }
            })

            if (!selected.length) {
                // none of templates selected worked for this url.
                chrome.tabs.executeScript(null, { code: 'alert("None of the selected templates match the current URL");' });
            } else {
                // one or more selected templates are good for this url.
                if (ids.length) {
                    //run fill.js, which sets message listener that fills the browser page
                    chrome.tabs.executeScript(null, { file: 'fill.js' });

                    // create xhr variable, override mime type to expect json data
                    var xhr = new XMLHttpRequest();
                    xhr.overrideMimeType('application/json');
                    // set xhr readyStateChange function to listen for response
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            var matches = false;

                            //Store fill_data.js into 'fill_data'
                            var fill_data = JSON.parse(xhr.responseText);

                            if (ids.length > 0) {
                                //Iterate over all the IDs to be filled on the browser page
                                for (var i = 0; i < ids.length; i++) {
                                    id = ids[i];
                                    id_lower = id.toLowerCase();

                                    // generate random email
                                    if (id_lower.includes('email') && !(id_lower.includes('type'))) {
                                        matches = true;

                                        data_to_message[id] = random_email();
                                    }

                                    // generate random phone number
                                    if (id_lower.includes('phone') && !(id_lower.includes('type'))) {
                                        matches = true;

                                        var phone_num = '';
                                        for (var z = 0; z < 10; z++) {
                                            phone_num += random_number(1, 9);
                                        }

                                        data_to_message[id] = phone_num.toString();
                                    }

                                    if (id_lower.includes('address') && !(id_lower.includes('email')) && !(id_lower.includes('city'))) {
                                        matches = true;

                                        var streets = ['Second', 'Third', 'First', 'Fourth', 'Park', 'Fifth', 'Main', 'Sixth', 'Oak', 'Seventh', 'Pine', 'Maple', 'Cedar', 'Eighth', 'Elm', 'View', 'Washington', 'Ninth', 'Lake', 'Hill'];

                                        data_to_message[id] = [random_number(1, 1000), streets[random_number(streets.length - 1)], 'St'].join(' ');;
                                    }

                                    if (id_lower.includes('postal')) {
                                        matches = true;

                                        var postal_code = '';
                                        for (var z = 0; z < 5; z++) {
                                            postal_code += random_number(1, 9);
                                        }

                                        data_to_message[id] = postal_code.toString();
                                    }

                                    if (id_lower.includes('date')) {
                                        matches = true;

                                        var minDate = new Date(1980, 0, 1);
                                        var maxDate = new Date();

                                        var date = random_date(minDate, maxDate);

                                        var month = pad(date.getMonth() + 1, 2);
                                        var day = pad(date.getDate(), 2);
                                        var year = date.getFullYear();

                                        date = [month, day, year].join('/');
                                        data_to_message[id] = date;
                                    }

                                    if (id_lower.includes('social')) {
                                        matches = true;

                                        var ssn = '';
                                        for (var z = 0; z < 9; z++) {
                                            ssn += random_number(1, 9);
                                        }

                                        data_to_message[id] = ssn.toString();
                                    }

                                    if (id_lower.includes('rank')) {
                                        matches = true;

                                        data_to_message[id] = random_number(1, 500);
                                    }

                                    if (id_lower.includes('size')) {
                                        matches = true;

                                        data_to_message[id] = 500;
                                    }

                                    if ((id_lower.includes('gpa')) || (id_lower.includes('scale'))) {
                                        matches = true;

                                        // this is kind of special so it does not use the random_number function
                                        var gpa = (Math.random() * 4.01);
                                        gpa = Math.round(gpa * 100) / 100;

                                        data_to_message[id] = gpa;
                                    }

                                    if (id_lower.includes('percentile')) {
                                        matches = true;

                                        data_to_message[id] = random_number(1, 99);
                                    }

                                    if (id_lower.includes('score')) {
                                        matches = true;

                                        data_to_message[id] = (100 * Math.floor((random_number(100, 1600) + 50) / 100)).toString();
                                    }

                                    //Iterate over all the keys in 'fill_data'
                                    for (var key in fill_data) {
                                        // there were no matches above for this field id, but we have fill_data (? not sure when this would happen)
                                        if (!matches && id_lower.includes(key)) {
                                            matches = true;

                                            data_to_message[id] = fill_data[key][random_number(fill_data[key].length - 1)]
                                        }
                                    }

                                    //If the ID does not match with any keys from 'fill_data', assign the ID to a random string value
                                    if (!matches) {
                                        matches = true;
                                        //make a random string 7-10 letters long
                                        var random_text = random_word();
                                        data_to_message[id] = random_text;
                                    }
                                    matches = false;
                                }

                                //Send 'data_to_message' to the current tab
                                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                                    chrome.tabs.sendMessage(tabs[0].id, data_to_message, {}, function () {
                                        data_to_message = {};
                                    });
                                });
                            }
                        }
                    };

                    // open xhr as GET to 'fill_data.json' send xhr
                    xhr.open('GET', chrome.extension.getURL('/fill_data.json'), true);
                    xhr.send();
                }
            }
        });
    }

    function del(selected) {
        //chrome.storage.local.clear();

        //remove the templates' data from local storage
        chrome.storage.local.remove(selected, function () {
            // on callback, remove selected templates' checkboxes as well
            for (var i = 0; i < selected.length; i++) {
                $('#' + selected[i]).remove();
            }

            // check template checkboxes
            there_are_no_templates();
        });
    }

    //creates corresponding checkboxes for templates in local storage
    function make_template_checkboxes() {
        //Retrieve the entire contents of local storage
        chrome.storage.local.get(null, function (result) {
            for (var key in result) {
                if (result.hasOwnProperty(key) && result[key].url === url) {
                    // make the checkbox for this
                    if (!($('#' + key).length)) {
                        var box_and_label = ($('<label />').html(key).prepend($('<input/>').attr({ type: 'checkbox', id: key })).append($('<br>')));
                        var span = $('<span />').attr({ id: key });
                        span.prepend(box_and_label);
                        $('#template_boxes').append(span);
                    }
                }
            }

            //if template_boxes is empty, get rid of the buttons
            there_are_no_templates();
        });
    }

    function there_are_no_templates() {
        if (!$('#template_boxes > span').length) {
            // create and append message to template selection
            var no_templates_message = $('<label />').attr({ id: 'no_templates' });
            no_templates_message.html('No available templates!');
            $('#template_boxes').append(no_templates_message);

            // hide template functionality buttons
            $('#delete').hide();
            $('#go').hide();
        }
    }

    // HELPER FUNCTIONS
    // helper function for getting random number
    // if no args: returns random number [0,1]
    // if one args: returns random number [0,max]
    // if two args: returns random number [min,max]
    function random_number() {
        var _args = Array.from(arguments);
        var min, max;
        if (_args.length === 0) {
            return Math.random();
        }
        else if (_args.length === 1) {
            min = 0;
            max = _args[0];
        }
        else if (_args.length === 2) {
            min = Math.min.apply(this, _args);
            max = Math.max.apply(this, _args);
        }

        return Math.floor(Math.random() * (max - min + 1)) + (min);
    }

    // helper function for creating random strings
    function random_word() {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        for (var k = 0; k < (random_number(6) + 5); k++) {
            text += possible.charAt(random_number(possible.length - 1));
        }
        return (text);
    }

    function random_email() {
        //possible email carriers
        var email_domains = ['yahoo', 'gmail', 'outlook', 'hotmail'];

        return random_word() + '@' + email_domains[random_number(0, 3)] + '.com';
    }

    // random date, start and end must be JS date objects
    function random_date(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    // for formatting date numbers
    function pad(num, size) {
        var prepend = (num < 0 ? '-' : '');
        var padding = '0'.repeat(size)
        num = padding + num.toString();

        var paddedNumber = (num).substr(num.length - size)

        return prepend + paddedNumber;
    }

});
