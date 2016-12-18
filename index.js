'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const _ = require('lodash')
const app = express()

const GREETINGS = ['Salut', 'Yo', 'Hello', 'Coucou', 'Bonjour', 'Hey'];
const HELPING = ['Qu\'est que je peux faire pour toi ? Tu cherches un cours en particulier ?',
	'T\'as un sujet sur une formation qui t\'interesse ?'];
const DIGITAL = ['digital', 'digitale', 'numérique', 'numerique', 'internet', 'mobile'];


app.set('port', (process.env.PORT || 5000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

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
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
			let text = event.message.text


			const isGreeting = _.some(GREETINGS, greeting => {
				return text.indexOf(text) !== -1;
			})
			if (isGreeting) {
				sendGreetingMessage(sender)
				sendTextMessage(sender, HELPING[_.random(0, HELPING.length)]);
				continue
			}

			const isCoursDigital = _.some(DIGITAL, greeting => {
				return text.indexOf(text) !== -1;
			})
			if (isCoursDigital) {
				sendGenericMessage(sender)
				continue
			}
			sendTextMessage(sender, ":-/ je suis un peu confus, je te rappel, je suis juste un bot 💁" + text.substring(0, 200))
		}
		if (event.postback) {
			let text = JSON.stringify(event.postback)
			sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
			continue
		}
	}
	res.sendStatus(200)
})


// recommended to inject access tokens as environmental variables, e.g.
// const token = process.env.PAGE_ACCESS_TOKEN
const token = "EAADEwXIWTAIBABOdksEnPlZAwwlBeJHmExgWIVO9KN7JB7E7M2S2BBqxfbv0l6sk1ty90RJ74N4jrb44NMlvfyI8zld23eZBUAwGDD4dUayEZAr1kbE3ZANhxdovj4A3puO3oAzSQ5EZAJ09EDiJzTrNh0yoCBGP8GTEJ1Dlz9wZDZD"

function sendTextMessage(sender, text) {
	let messageData = { text:text }

	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
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
	console.log('sender', sender)
	const greetings = _.concat(GREETINGS, 'Hey !', 'Hello, content de te voir !', 'Hello ! :P', 'Hi there!');
	const greet = greetings[_.random(0, greetings.length)];
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
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
						"url": "https://store.coorpacademy.com/checkout/add/P0"
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
					}],
				}]
			}
		}
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
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

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})
