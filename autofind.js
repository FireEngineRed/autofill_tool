var visible_DOM_elements = ($('input[type!=checkbox], div').filter(':visible').filter('[title][title!=]'));
/* ('[title][title!=]') makes sure that the title actually has something in it, not "" */
var number_of_elements = visible_DOM_elements.length;

var inputs = new Array(number_of_elements);
for (var x = 0; x < number_of_elements; x++){

	inputs[x] = new Array(2);

}


visible_DOM_elements.each(function(i){

	id = $( this ).attr('id');

	if (id.includes('s2id_')){

		id = id.replace('s2id_', '');

	}

	title = $( this ).attr('title');

	inputs[i][0] = id;

	inputs[i][1] = title;

});


chrome.runtime.sendMessage(inputs);

//get all visible inputs with title, and then send back a 2d array with the inner arrays being [id, title] for each DOM result
 