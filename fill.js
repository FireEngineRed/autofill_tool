chrome.runtime.onMessage.addListener(function(response, sender, sendResponse){
    $(document).ready(function() {
        for (var property in response) {
            if (response.hasOwnProperty(property)) {
                var field = document.getElementById(property);
                var fireChangeEvent = false;

                // deal with selects
                if (field.nodeName === 'SELECT') {
                    var $field = $('#' + property);
                    var option = null;
                    var options = [];

                    if ($field.data('parent-select-id') && $field.data('parent-select-id') !== '') {
                        var optgroup = $('#' + $field.data('parent-select-id')).find('option:selected').text();
                        options = $field.find('optgroup[label="'+optgroup+'"] option')
                    } else {
                        options = $field.find('option')
                    }

                    // cannot pick a blank/empty value (ie select options that are just "Select" placeholders)
                    while (option === null || typeof option === undefined || option.value === '') {
                        option = options.get(Math.floor(Math.random()*(options.length)));
                    }

                    //update the value
                    field.value = option.value;

                    // make sure we dispatch a native DOM change event later
                    fireChangeEvent = true;
                } else {
                    field.value = response[property];
                }

                // dispatch event(s)
                field.dispatchEvent(new Event('input', {'bubbles': true}));

                if (fireChangeEvent) {
                    field.dispatchEvent(new Event('change', {'bubbles': true}));
                }
            }
        }
    })
});
