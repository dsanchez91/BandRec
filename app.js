/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Recommender = require('./model.js');

var client_id = '946d683a06d242da8558914d38649f66'; // Your client id
var client_secret = 'fa0dc3df5c6944b19be5eeb5be3428ab'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var bandindex = [];
var rowLabels = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10','user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18', 'user19'];
var colLabels = ['Rolling Stones', 'The beatles', 'Oasis', 'Muse', 'Bruce Springteen', 'AC/DC', 'U2', 'Blur', 'Taylor Swift', 'Jay-z','Arctic Monkeys', 'Avicii', 'Kanye West', 'Beck', 'Led Zeppelin', 'Pink Floyd', 'Dire Straits', 'Eric Clapton', 'Skrillex', 'Miley Cyrus', 'Placebo', 'David Guetta', 'Pitbull', 'Calvin Harris', 'Supertramp', 'Sia', 'Ed Sheeran', 'Bruno Mars', 'Beyonce', 'Sam Smith'];

//Matrix of user rates based on a echonest dataset
var inputMatrix = [ [ 1, 2, 6, 7, 4, 4, 5, 4, 0, 7, 5, 3, 1, 5, 2, 2, 0, 4, 7, 3, 6, 5, 9, 3, 8, 1, 8, 4, 1, 3 ],
                    [ 5, 5, 8, 5, 6, 6, 7, 7, 0, 3, 7, 4, 5, 3, 8, 0, 1, 7, 8, 8, 5, 8, 9, 5, 3, 1, 9, 6, 5, 5 ],
                    [ 1, 0, 9, 0, 7, 8, 1, 0, 3, 7, 5, 1, 6, 9, 9, 5, 0, 6, 3, 5, 8, 9, 9, 4, 8, 1, 0, 4, 6, 8 ],
                    [ 2, 8, 7, 4, 8, 0, 3, 4, 4, 0, 3, 6, 4, 1, 4, 6, 1, 7, 2, 0, 9, 4, 9, 8, 5, 1, 4, 1, 7, 1 ],
                    [ 0, 9, 4, 7, 5, 6, 0, 0, 6, 9, 4, 0, 3, 2, 9, 1, 0, 0, 8, 8, 8, 6, 3, 8, 2, 8, 0, 7, 9, 9 ],
                    [ 1, 6, 0, 6, 6, 8, 7, 4, 5, 3, 8, 3, 2, 0, 9, 3, 1, 4, 4, 7, 6, 7, 9, 3, 8, 1, 9, 1, 6, 8 ],
                    [ 6, 5, 3, 0, 7, 9, 0, 3, 8, 4, 9, 6, 4, 5, 3, 0, 0, 6, 7, 7, 0, 8, 5, 5, 2, 5, 2, 2, 3, 7 ],
                    [ 7, 0, 7, 7, 9, 0, 7, 8, 9, 1, 7, 3, 0, 4, 9, 1, 4, 2, 8, 5, 6, 3, 9, 2, 0, 1, 2, 0, 4, 1 ],
                    [ 8, 2, 2, 8, 4, 1, 0, 7, 0, 4, 4, 0, 2, 5, 0, 4, 3, 9, 0, 9, 7, 9, 0, 3, 8, 4, 9, 6, 8, 5 ],
                    [ 3, 0, 4, 5, 6, 0, 8, 6, 6, 1, 4, 6, 7, 3, 9, 2, 9, 7, 9, 6, 6, 8, 6, 8, 5, 1, 4, 1, 9, 6 ],
                    [ 4, 2, 0, 7, 7, 5, 0, 3, 7, 6, 6, 4, 2, 0, 3, 0, 4, 5, 0, 5, 6, 2, 8, 7, 9, 5, 6, 3, 3, 0 ],
                    [ 6, 7, 8, 2, 8, 1, 5, 4, 8, 4, 7, 7, 2, 3, 9, 3, 6, 3, 3, 7, 4, 8, 9, 6, 1, 7, 0, 4, 8, 3 ],
                    [ 0, 9, 0, 3, 3, 8, 4, 6, 0, 0, 0, 4, 4, 5, 0, 2, 0, 6, 4, 6, 4, 3, 9, 6, 8, 3, 2, 6, 9, 9 ],
                    [ 3, 9, 9, 0, 1, 1, 5, 7, 9, 9, 7, 3, 9, 1, 9, 2, 9, 3, 6, 5, 1, 8, 3, 5, 4, 5, 0, 0, 6, 7 ],
                    [ 8, 7, 3, 8, 0, 7, 5, 4, 4, 0, 6, 1, 8, 5, 1, 5, 0, 6, 0, 8, 8, 5, 6, 1, 8, 9, 5, 3, 7, 8 ],
                    [ 5, 2, 5, 9, 8, 2, 0, 7, 5, 4, 0, 2, 0, 4, 9, 0, 1, 2, 6, 8, 6, 4, 9, 0, 6, 3, 7, 8, 5, 9 ],
                    [ 4, 4, 7, 0, 9, 9, 3, 0, 3, 3, 3, 9, 9, 3, 8, 3, 5, 8, 5, 5, 6, 6, 7, 8, 2, 8, 1, 7, 4, 8 ],
                    [ 4, 2, 7, 3, 1, 0, 8, 8, 5, 1, 8, 3, 0, 4, 3, 1, 4, 2, 8, 2, 6, 9, 9, 2, 0, 1, 9, 0, 4, 1 ],
                    [ 8, 6, 3, 8, 2, 8, 0, 9, 6, 9, 5, 8, 1, 5, 9, 2, 0, 0, 3, 7, 3, 8, 0, 7, 5, 9, 4, 0, 1, 7 ]
                  ];

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))



app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


app.get('/bands',function(req,res){
  
  var bands = [];
  for ( i= 0; i <=2; i ++){
    bandindex[i] = Math.floor(Math.random() * 30);
    bands.push(colLabels[bandindex[i]]);
  }
  res.send(bands);
});

app.post('/newrats',function(req,res){
  var band0=req.body.band0;
  var band1=req.body.band1;
  var band2=req.body.band2;
  
  var newuser = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
  newuser [bandindex[0]] = parseInt(band0);
  newuser [bandindex[1]] = parseInt(band1);
  newuser [bandindex[2]] = parseInt(band2);
  console.log(newuser);
  inputMatrix.push(newuser);
  console.log(inputMatrix)
  rowLabels.push("newuser");
  console.log(rowLabels)
  var model = Recommender.buildModel(inputMatrix, rowLabels, colLabels);
  var allItems = model.recommendations('newuser');
  console.log(allItems)
  res.send(allItems[3][0]);
  allItems = [];
  rowLabels.pop();

});










console.log('Listening on 8888');
app.listen(8888);
