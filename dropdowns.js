//check if an element is a dropdown by its id, then message back a boolean indicating whether or not it is a dropdown.
var dropdown = false;
chrome.runtime.onMessage.addListener(
	function(response, sender, sendResponse){

		$(document).ready(function(){
			
			if (typeof response === 'string' || response instanceof String){

				if ((document.getElementById(response)).nodeName == 'SELECT'){
					
					dropdown = true;

					var id_of_random_option = select_element.children[Math.floor(Math.random()*(select_element.children.length))].id;


					/*

					-----Below sort of works...but doesn't use select2-----

					var select_element = document.getElementById(response);

					select_element.remove(0);


					if (!((document.getElementById(id_of_random_option)).selected)){

						document.getElementById(id_of_random_option).selected = true;						
					}

					*/


					//Uses select2 - should work in v. 3.5*
					$('#' + response).val(document.getElementById(id_of_random_option).text); // Change the value or make some change to the internal state
					$('#' + response).trigger('change.select2'); // Notify only Select2 of changes



				}
				
				sendResponse(dropdown);	

			}


		});

	


});

