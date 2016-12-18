'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const _ = require('lodash')
const app = express()
const util = require('util')

// recommended to inject access tokens as environmental variables, e.g.
// const token = process.env.PAGE_ACCESS_TOKEN
const access_token = "EAADEwXIWTAIBABOdksEnPlZAwwlBeJHmExgWIVO9KN7JB7E7M2S2BBqxfbv0l6sk1ty90RJ74N4jrb44NMlvfyI8zld23eZBUAwGDD4dUayEZAr1kbE3ZANhxdovj4A3puO3oAzSQ5EZAJ09EDiJzTrNh0yoCBGP8GTEJ1Dlz9wZDZD"

const GREETINGS = ['Salut', 'Yo', 'Hello', 'Coucou', 'Bonjour', 'Hey', 'salut', 'yo', 'hello', 'coucou', 'bonjour', 'hey'];
const HELPING = ['Qu\'est que je peux faire pour toi ? Tu cherches un cours en particulier ?',
	'T\'as un sujet sur une formation qui t\'interesse ?'];
const DIGITAL = ['digital', 'digitale', 'numérique', 'numerique', 'internet', 'mobile'];

app.set('port', (process.env.PORT || 5000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}))

// parse application/json
app.use(bodyParser.json())

// index
app.get('/', function (req, res) {
	res.send('hello world i am a secret bot')
})

// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

// to post data
app.post('/webhook/', function (req, res) {
	console.log(util.inspect(req.body, {depth: null}));
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
			let text = event.message.text

			const isGreeting = _.some(GREETINGS, greeting => {
				return text.indexOf(greeting) !== -1;
			})
			if (isGreeting) {
				sendGreetingMessage(sender)
					.then(() => sendOptionFormation(sender))
				//sendTextMessage(sender, HELPING[_.random(0, HELPING.length)]);
				continue
			}

			const isCoursDigital = _.some(DIGITAL, digital => {
				return text.indexOf(digital) !== -1;
			})
			if (isCoursDigital) {
				sendGenericMessage(sender)
				continue
			}
			sendTextMessage(sender, ":-/ je suis un peu confus, je te rappel, je suis juste un bot");
			sendOptionFormation(sender);
		}
		if (event.postback) {
			let text = JSON.stringify(event.postback)
			sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
			continue
		}
	}
	res.sendStatus(200)
})

function sendTextMessage(sender, text) {
	let messageData = { text:text }

	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function sendGreetingMessage(sender) {
	return getUser(sender)
		.then(userData => {
			const greetings = _.concat(GREETINGS,
				`Hey ${userData.first_name}!`,
				`Hello ${userData.first_name}, content de te voir !`,
				`Bonjour ${userData.first_name}! :P`,
				`Coucou ${userData.first_name}!`,
				'Aaaaaaaalors !');
			const greet = greetings[_.random(0, greetings.length)];

			request({
				url: 'https://graph.facebook.com/v2.6/me/messages',
				qs: {access_token},
				method: 'POST',
				json: {
					recipient: {id:sender},
					message: { text:greet },
				}
			}, function(error, response, body) {
				if (error) {
					console.log('Error sending messages: ', error)
				} else if (response.body.error) {
					console.log('Error: ', response.body.error)
				}
			})
		})
	;
}

function sendOptionFormation(sender) {
	let message = {
    "text":"Allez, choisis une thématique qui t'interesse :",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Le Numérique",
        "payload":"DIGITAL"
      },
      {
        "content_type":"text",
        "title":"Les assurances",
        "payload":"LINXEA"
      },
      {
        "content_type":"text",
        "title":"GIRL POWER",
        "payload":"AU_FEMININ"
      }
    ]
  };
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function sendGenericMessage(sender) {
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": "Métiers du digital",
					"subtitle": "Cours de 15 minutes",
					"image_url": "https://static.coorpacademy.com/content/up/fr/medias/img/cover/metiers_du_digital-1447318780902.jpg",
					"buttons": [{
						"type": "web_url",
						"url": "https://up.coorpacademy.com/discipline/dis_VkjiR69Gl",
						"title": "Commencer le cours"
					},{
						"type": "web_url",
						"url": "https://store.coorpacademy.com/checkout/add/P0",
						"title": "Acheter le pack"
					}],
				}, {
					"title": "La Révolution Mobile",
					"subtitle": "Cours de 15 minutes",
					"image_url": "https://static.coorpacademy.com/content/up/fr/disciplines/MOBILE.jpg",
					"buttons": [{
						"type": "web_url",
						"url": "https://www.coorpacademy.com/catalog/trainings/02",
						"title": "Plus d'information"
					},{
						"type": "web_url",
						"url": "https://up.coorpacademy.com/discipline/02",
						"title": "Commencer le cours"
					}],
				}]
			}
		}
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

function getUser(sender) {
	return new Promise((resolve, reject) => {
		request({
			url: `https://graph.facebook.com/v2.6/${sender}`,
			qs: {
				fields: 'first_name,last_name,gender',
				access_token
			},
			json: true,
			method: 'GET'
		}, function(error, response, body) {
			if (error) {
				console.log(error);
				return reject(error);
			} else if (response.body.error) {
				console.log('Error: ', response.body.error)
				return reject(error);
			}
			return resolve(body);
		});
	});
}

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})
