//check if an element is a dropdown by its id, then message back a boolean indicating whether or not it is a dropdown.
var dropdown = false;
chrome.runtime.onMessage.addListener(
	function(response, sender, sendResponse){

		$(document).ready(function(){

			if (typeof response === 'string' || response instanceof String){

				if ((document.getElementById(response)).nodeName == 'SELECT'){

					dropdown = true;

					var select_element = document.getElementById(response);

					var random_option = null;

					// cannot pick a blank/empty value (ie select options that are just "Select" placeholders)
					while (random_option === null || random_option.value === '') {
						random_option = select_element.children[Math.floor(Math.random()*(select_element.children.length))];
					}

					//update the value
					select_element.value = random_option.value;

					// dispatch a native DOM change event
					select_element.dispatchEvent(new Event('change'));
				}

				sendResponse(dropdown);

			}


		});




});

