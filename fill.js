chrome.runtime.onMessage.addListener(function(response, sender, sendResponse){

	if (typeof response === 'object'){

		//window.onload = function(){

			for (var property in response) {
		    	
		    	if (response.hasOwnProperty(property)) {

		    		var field = document.getElementById(property);


		    		field.value = response[property];
		        
			    }
			}

		//}

	
	}
});




