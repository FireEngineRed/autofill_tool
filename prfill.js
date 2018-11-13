/*
 * Handler for messages from the background script
*/
chrome.runtime.onMessage.addListener((msg, sender, callback) => {
    if (msg.action === 'forceFillTemplate') {
      fillPRTemplate(msg.value);
    }
  });
  
  /*
   * Gets reference to the description text area on the page, pulls the template 
   * from the current repo and fills the text area with the templated text
   */
  let fillPRTemplate = (overwriteDescription) => {
    // create element with current url
    const parser = document.createElement('a');
    parser.href = location;
  
    //get pr description text area
    const descriptionArea = document.querySelector('#pull-request-description');
    if (!descriptionArea) return;
  
    // overwrite description happens when clicking the extension icon
    if (!overwriteDescription
      || confirm('This will overwrite everything in the description, are you sure you wish to continue?')) {
  
      // determine repo from URL
      const repoPath = parser.pathname.substr(0, parser.pathname.indexOf('/pull-requests'));
      const templateFetchUrl = `https://stash.gotoextinguisher.com:8445${repoPath}/raw/docs/pr-template.md?at=refs%2Fheads%2Fmaster`;
  
      // pull template from repo
      fetch(templateFetchUrl)
        .then((res) => {
          return res.status === 200 ? res.text() : '_No PR template found_';
        })
        .then((text) => {
          // add the text of the template to the description area, preserving what was there
          descriptionArea.value = `${text}\n\n${overwriteDescription ? '' : descriptionArea.value}`;
        })
        .catch((err) => {
          return console.error(err);
        });
    }
  };
  
  /* Execute as soon as the create button is clicked. 
   * Note that BitBucket dynamically creates the PR fields rather
   * than taking you to a new page.
   */
  (() => {
    const createPRButton = document.querySelector('#show-create-pr-button');
    if (createPRButton) {
      createPRButton.addEventListener('click', () => fillPRTemplate(false));
    }
  })();