// Nanoexpress is a minimalistic version of express.js, with improved performance and a smaller footprint.
const nanoexpress = require('nanoexpress');
const fs = require('fs');

const app = nanoexpress();

// Load all the user-defined links from the links.json file.
let urls = JSON.parse(fs.readFileSync('links.json'));

// Catch all requests that don't match a route
app.get('*', (req, res) => {
  return res.sendFile("./frontend/404.html");
});

// This must be first, so that it will catch all routes not defined below
app.get('/:id', (req, res) => {

  // If the id doesn't exist, send a 404
  if (!urls.hasOwnProperty(req.params.id)) {
    return res.sendFile("./frontend/404.html");
  }

  // Otherwise, redirect to the url
  return res.redirect(urls[req.params.id]);
});

// If you go to /admin/submit, show the submit page (for creating new links)
app.get('/admin', (req, res) => {
  res.sendFile('./frontend/submit.html')
})

// if the url has, say, ?long=google.com at the end, you
// access it with req.query.long
// This is where the form is submitted to.
// You should never need to visit this page manually.
app.get('/admin/formSubmitURL', (req, res) => {

  if (
      // If the password parameter is correct
      req.query.password == process.env['PASSWORD'] &&

      // and the long URL parameter is not empty
      typeof req.query.long !== 'undefined' &&

      // and the short URL parameter is not empty
      typeof req.query.short !== 'undefined'
    ) {

    // Create a newJSON variable and set it's value to the contents of the links.json file
    let newJSON = JSON.parse(fs.readFileSync('links.json', {
      encoding: 'utf8',
      flag: 'r'
    }));

    // Decode the short URL parameter (for example %2F becomes /)
    let short = decodeURIComponent(req.query.short);

    // If req.query.short is already in the JSON, don't add it
    if (newJSON.hasOwnProperty(req.query.short)) {

      // And send a message to the user saying so
      return res.send('Short URL already exists');
    }

    // If req.query.short starts with a (urlencoded) /, remove it
    if (short.startsWith('%2F')) {
      short = short.substring(1);
    }

    // Add a new key to the JSON with the short URL as the key and the long URL as the value
    newJSON[encodeURIComponent(short)] = req.query.long;

    urls = newJSON;
    fs.writeFileSync('links.json', JSON.stringify(newJSON, null, 2));

    res.setHeader('Content-type', 'text/html')
    return res.send(`Successfully added redirect from <a href="https://link.jonahkc.com/${short}">https://link.jonahkc.com/${short}</a> to <a href="${decodeURIComponent(req.query.long)}">${decodeURIComponent(req.query.long)}</a>`)
  }
  return res.send('URL did not include necessary data OR password was incorrect.')
});

app.listen(3000);