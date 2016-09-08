//get all visible inputs with title, and then send back a 2d array with the inner arrays being [id, title] for each DOM result
/* ('[title][title!=]') makes sure that the title actually has something in it, not "" */
var visible_DOM_elements = ($('input[type!=checkbox], div').filter(':visible').filter('[title][title!=]'));
var number_of_elements = visible_DOM_elements.length;

var inputs = visible_DOM_elements.map(function(){
    id = $( this ).attr('id');
    if (id.includes('s2id_')){
        id = id.replace('s2id_', '');
    }

    title = $( this ).attr('title');

    return [[id, title]];
});

chrome.runtime.sendMessage(inputs);
