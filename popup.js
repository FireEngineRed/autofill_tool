//'Data_to_message' will hold all the data in key:value pairs to be inputted into the browser page, with the key being the id of the input field, and the value being the value to fill the field with
var data_to_message = {};
var ids = [];
var url = '';
var nothing_to_fill = true;
$(document).ready(function() {

	$("#template_name").on("keydown", function (e) {
    	return e.which !== 32;
	});

	document.getElementById("fragment-2").style.minWidth = "171px";
	document.getElementById("fragment-1").style.minWidth = "171px";

  	make_template_checkboxes();	//populate the "use template" tab with all the existing templates

	$( "#uitab" ).tabs(); //Make UI tabs on popup.html
	$( "button" ).button();

	//if template_boxes is empty, get rid of the buttons

	there_are_no_templates();


//Through a content script, find all of the visible inputs on the browser page
	chrome.tabs.query({currentWindow: true, active: true}, function(tabs){

		url = tabs[0].url;

		//load jquery so selectors will work
   		chrome.tabs.executeScript(null, {file: "jquery-1.10.2.js"}, function(){

   			//run autofind.js, which will return an array of DOM elements
            chrome.tabs.executeScript(null, {file: "autofind.js"});

		});


   		//handle the array of DOM elements from autofind.js
		chrome.runtime.onMessage.addListener(function(response, sender, sendResponse){

			//If there are no inputs on the page, hide all the buttons and text fields.
			if (response.length == 0){

				$('#tempname').hide();
				$('#autofill').hide();
				$('#save_template').hide();
				$('#quickgo').hide();

				$('#selections').append($('<br>')).append($('<label />').html('Nothing to Autofill!'));

			}else{
				nothing_to_fill = false;
			}


			//loop through 'response' and make checkboxes
			for (var i = 0; i < response.length; i++) {

				//make checkboxes for each element in inputs
				$('#selections').append($('<label />').html(response[i][1]).prepend($('<input/>').attr({ type: 'checkbox', id: response[i][0]})).append($('<br>')));


			}



		});




	});


	$("#save_template").click(function(){

		//retrieve the template name from popup page
        	var template_name = $("#template_name").val();


		save_temp(template_name);

	});

	function save_temp(template_name){


		var selected = [];
        	//append the id of selected inputs to selected
		$('#selections input:checked').each(function() {
    		selected.push($(this).attr('id'));
		});


		//store all the template data into one object
		//template_data holds URL, Name, and selected IDs
		var template_data = {};

		template_data.url = url;
		template_data.checked_ids = selected;
		template_data.name = template_name;


		var save = {};

		//place template_data into the save array, with the template's name as the key
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

	$("#quickgo").click(function(){

		var template_name = make_random_word();
		save_temp(template_name);

		var selected = [];
		selected.push(template_name);
		go(selected);

		del(selected);

	});


	$("#go").click(function(){


		//selected is an array of the selected templates in templates tab
		var selected = [];

		//for each checked template, append their id to the 'selected' array
		$('#template_boxes input:checked').each(function() {
    		selected.push($(this).attr('id'));
		});

		go(selected);

	});
	function go(selected){



		//clear the templates tab of all checks
		$('input:checkbox').removeAttr('checked');

		//If there is nothing to autofill, the urls must not match
		if (nothing_to_fill){

			chrome.tabs.executeScript(null, {code: "alert('The url of the template must match the page url.');"});
			return;
		}

		//If only one template is selected
		if (selected.length == 1){

			//retrive template's data from local storage
			chrome.storage.local.get(selected[0], function(result){

				// if the urls match
				if (url == result[selected[0]].url){

					//everything is set to start filling in the browser page

					//run fill.js, which fills the browser page
					chrome.tabs.executeScript(null, {file : 'fill.js'});

					//get and store data from fill_data.json using XHR
					var xhr = new XMLHttpRequest();
					xhr.overrideMimeType("application/json");



					//If XHR is ready
					xhr.onreadystatechange = function() {

	        				if (xhr.readyState == 4 && xhr.status == 200) {

	        					//Store fill_data.js into 'json_object'
	        					var json_object = JSON.parse(xhr.responseText);

	        					//keys stores all the keys to the data in 'json_object'
	        					var keys = [];

	        					//append all the keys to the key:value pairs in 'json_object' to the 'keys' array
								for(var k in json_object){
									keys.push(k);
								}

	        					var matches = false;

	        					//possible email carriers
	        					var email_possibs = ['yahoo', 'gmail', 'outlook', 'hotmail'];

	        					//ids holds the IDs of fields to be filled in the browser page
	        					ids = result[selected[0]].checked_ids;



	        					fillin(function(){

	        						if (ids.length > 0){

		        						//Iterate over all the IDs to be filled on the browser page
		        						for (var i = 0; i < ids.length; i++) {

		        							//If the ID is that of an email field, then fill it without data from 'json_object'
		        							if (ids[i].toLowerCase().includes('email') && !(ids[i].toLowerCase().includes('type'))){

		        								matches = true;
		        								data_to_message[ids[i]] = (make_random_word() + '@' + email_possibs[Math.floor(Math.random()*4)] + '.com');

		        							}

		        							if (ids[i].toLowerCase().includes('phone') && !(ids[i].toLowerCase().includes('type'))){

		        								matches = true;
		        								var phone_num = '';

		        								for (var z = 0; z < 10; z++){
		        									phone_num = (phone_num + (Math.floor(Math.random()*10)));
		        								}

		        								data_to_message[ids[i]] = phone_num.toString();

		        							}

		        							if (ids[i].toLowerCase().includes('address') && !(ids[i].toLowerCase().includes('email')) && !(ids[i].toLowerCase().includes('city'))){

		        								matches = true;
		        								var rd_nm = '';

		        								var sts = ['Second','Third','First','Fourth','Park','Fifth','Main','Sixth','Oak','Seventh','Pine','Maple','Cedar','Eighth','Elm','View','Washington','Ninth','Lake','Hill'];

		        								rd_nm = (rd_nm + (Math.floor(Math.random()*1000) + 1) + ' ' + (sts[Math.floor(Math.random()*sts.length)]) + ' St');

		        								data_to_message[ids[i]] = rd_nm;

		        							}

		        							if (ids[i].toLowerCase().includes('postal')){

		        								matches = true;
		        								var postal_code = '';

		        								for (var z = 0; z < 5; z++){
		        									postal_code = (postal_code + (Math.floor(Math.random()*10)));
		        								}

		        								data_to_message[ids[i]] = postal_code.toString();

		        							}

		        							if (ids[i].toLowerCase().includes('date')){

		        								matches = true;
		        								var date = '';

		        								var fst = Math.floor(Math.random()*2);
		        								var scnd;

		        								if (fst == 0){

		        									scnd = Math.floor((Math.random()*9) +1);

		        								}else{

		        									scnd = Math.floor(Math.random()*3);

		        								}

		        								var thrd;
		        								var fth;

		        								if (fst == 0 && scnd == 2){

		        									thrd = Math.floor(Math.random()*3);

		        									if (thrd == 2){

		        										fth = Math.floor(Math.random()*9);

		        									}else{

		        										fth = Math.floor(Math.random()*10);

		        									}

		        								}else{

		        									thrd = Math.floor(Math.random()*4)
		        									if (thrd == 3){

		        										fth = 0;

		        									}else{

		        										fth = Math.floor(Math.random()*10);

		        									}

		        								}

		        								var today = new Date();
											var current_year = today.getFullYear();

											var yr = Math.floor((Math.random()*(current_year - 1980)) + 1980);

											date = (date + fst.toString() + scnd.toString() + '/' + thrd.toString() + fth.toString() + '/' + yr.toString());



		        								data_to_message[ids[i]] = date;

		        							}

		        							if (ids[i].toLowerCase().includes('social')){

		        								matches = true;
		        								var ssn = '';

		        								for (var z = 0; z < 9; z++){
		        									ssn = (ssn + (Math.floor(Math.random()*10)));
		        								}

		        								data_to_message[ids[i]] = ssn.toString();

		        							}

		        							if (ids[i].toLowerCase().includes('rank')){

		        								matches = true;
		        								var rank = Math.floor(Math.random()*500) + 1;

		        								data_to_message[ids[i]] = rank;

		        							}

		        							if (ids[i].toLowerCase().includes('size')){

		        								matches = true;
		        								data_to_message[ids[i]] = 500;

		        							}

		        							if ((ids[i].toLowerCase().includes('gpa')) || (ids[i].toLowerCase().includes('scale'))){

		        								matches = true;
		        								var gpa = (Math.random()*4.01);
		        								gpa = Math.round(gpa * 100) / 100;

		        								data_to_message[ids[i]] = gpa;

		        							}

		        							if (ids[i].toLowerCase().includes('percentile')){

		        								matches = true;
		        								data_to_message[ids[i]] = Math.floor(Math.random()* 99) + 1;

		        							}

		        							if (ids[i].toLowerCase().includes('score')){

		        								matches = true;
		        								data_to_message[ids[i]] = (100 * Math.floor(((Math.floor(Math.random()* 1500) + 100) + 50) / 100)).toString();

		        							}




	        								//Iterate over all the keys in 'json_object', which are stored in 'keys'
		        							for (var x = 0; x < keys.length; x++){

		        								//If the ID contains a string from a key, and it doesn't already match, then enter a key:value (--> ID:input_value) pair into data_to_message
		        								if ((!matches) && (ids[i].toLowerCase().includes(keys[x]))){

		        									matches = true;

		        									var corresponding_values_from_json_object = json_object[keys[x]];

		        									var random_corresponding_json_value = corresponding_values_from_json_object[Math.floor(Math.random() * json_object[keys[x]].length)];

		        									data_to_message[ids[i]] = random_corresponding_json_value;

		        								}

		        							}





		        							//If the ID does not match with any keys from 'json_object', assign the ID to a random string value
		        							if (!matches){

		        								matches = true;

		        								//make a random string 7-10 letters long
		        								var random_text = make_random_word();
											data_to_message[ids[i]] =  random_text;

		        							}

		        							matches = false;

		        						}

		        						//Send 'data_to_message' to the current tab
									chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

								  		chrome.tabs.sendMessage(tabs[0].id, data_to_message);

									});

								}


	        					});

	        				}
    					};

					xhr.open("GET", chrome.extension.getURL('/fill_data.json'), true);
					xhr.send();


				}else{

					//urls do not match
					chrome.tabs.executeScript(null, {code: "alert('The url of the template must match the page url.');"});

				}

			});


		}else{

			//only able to fill one template at a time
			chrome.tabs.executeScript(null,{code:"alert('Select 1 template');"});

		}

	}

	$('#delete').click(function(){

		//The selected templates for deletion are held in 'selected'
		var selected = [];

		//Append the IDs of each template marked for deletion to the 'selected' array
		$('#template_boxes input:checked').each(function() {

    			selected.push($(this).attr('id'));

		});

		del(selected);

	});

	function del(selected){

		//chrome.storage.local.clear();



		//remove the templates' data from local storage
		chrome.storage.local.remove(selected, function(){

			for (var i = 0; i < selected.length; i++) {
				$('#' + selected[i]).remove();
			}

		});

		//Check if any templates remain
		there_are_no_templates();


	}

	//creates corresponding checkboxes for templates in local storage
	function make_template_checkboxes(){

		//Retrieve the entire contents of local storage
		chrome.storage.local.get(null, function(result){

			for(var key in result){

				if (result.hasOwnProperty(key)){

					if (!($('#' + key).length)){

						var box_and_label = ($('<label />').html(key).prepend($('<input/>').attr({ type: 'checkbox', id: key})).append($('<br>')));

						var span = $('<span />').attr({id : key});

						span.prepend(box_and_label);


						$('#template_boxes').append(span);

					}

				}

			}

		});

	}

	function there_are_no_templates(){

		chrome.storage.local.get(null, function(result){

			if (jQuery.isEmptyObject(result)){

				var no_templates_message = $('<label />').attr({ id: 'no_templates' });
				no_templates_message.html('No available templates!');
				$('#template_boxes').append(no_templates_message);
				$('#delete').hide();
				$('#go').hide();

			}

		});

	}

	function make_random_word(){

		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		for( var k=0; k < ((Math.floor(Math.random()*6)) + 5); k++ ){
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return (text);

	}

	function fillin(callback){

		for (var i = 0; i < ids.length; i++){

			var element_id = ids[i];

			chrome.tabs.executeScript(null, {file: 'dropdowns.js'}, function(){

				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

					chrome.tabs.sendMessage(tabs[0].id, element_id, function(is_a_dropdown){

						if(is_a_dropdown){

							ids.splice($.inArray(element_id, ids), 1);

						}

						callback();

					});
				});

			});

		}

	}


});








