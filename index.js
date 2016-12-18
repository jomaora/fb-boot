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

const GREETINGS = ['salut', 'yo', 'hello', 'coucou', 'bonjour', 'hey'];
const MOOD = ['ça va', 'comment ça va', 'tu vas bien', 'ça roule'];
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
			let quickReply = (event.message.quick_reply) ? event.message.quick_reply.payload : null;

			const isGreeting = _.some(GREETINGS, greeting => {
				return text.toLowerCase().indexOf(greeting) !== -1;
			})
			if (isGreeting) {
				sendGreetingMessage(sender)
					.then(() => sendOptionFormation(sender))
				//sendTextMessage(sender, HELPING[_.random(0, HELPING.length)]);
				continue
			}

			const isMood = _.some(MOOD, mood => {
                return text.toLowerCase().indexOf(mood) !== -1;
            })
            if (isMood) {
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

			if (quickReply) {
			    sendTextMessage(sender, 'Nous avons trouvé des cours qui pourraient vous intéresser !');
				sendGenericMessage(sender, quickReply)
				continue
			}

            sendOopsMessage(sender);
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
			const greetings = [
				`Hey ${userData.first_name}!`,
				`Hello ${userData.first_name}, content de te voir !`,
				`Bonjour ${userData.first_name}! :P`,
				`Coucou ${userData.first_name}!`,
				'Aaaaaaaalors !'];
			const greet = greetings[_.random(0, greetings.length)];

            return new Promise((resolve, reject) => {
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
                        return reject(error)
                    } else if (response.body.error) {
                        console.log('Error: ', response.body.error)
                        return reject(error)
                    }
                    console.log('sendGreetingMessage')
                    return resolve();
                })
            });
		})
	;
}

function sendMoodMessage(sender) {
    const day = (new Date()).getDay();
    let message = '';
    switch (day) {
        case 0:
            message = _.sample(['Ça roule, c\'est dimanche !', 'J\'ai un peu la gueule de bois, grosse teuf hier !']);
            break;
        case 1:
            message = _.sample(['Ça va !', 'Comme un lundi :-/ !', 'Bof, c\'est lundi !', 'Trop bien, merci !', 'Avec une super pêche pour commencer la semaine']);
            break;
        case 5:
            message = _.sample(['Super ! c\'est le weekend', 'Excellent !', 'Top, en plus c\'est vendredi (même si moi je taffe tout le temps)']);
            break;
        case 6:
            message = _.sample(['Super ! c\'est le weekend', 'Tranquilou !']);
            break;
        default:
            message = _.sample(['Ça peut aller.', 'Tranquilou !', 'Bah... vivement le week-end !', 'Ça va !', 'Ça va, merci pour demander :)', 'Ça roule']);
            break;
    }
    sendTextMessage(sender, message);
}

function sendOopsMessage(sender) {
    const message = _.sample([
        ":-/ je suis un peu confus, je te rappel, je suis juste un bot",
        "Eh oh ! Tu trouves pas que t'abuses là ! Je te rappel que je suis juste un bot.",
        "No comprendo :-|",
        "Tu pouvoir répéter, moi être juste bot. Pas comprendre tout !"
    ])
    sendTextMessage(sender, message);
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

function sendGenericMessage(sender, selectedCourse) {
	const courses =
	{
		'AU_FEMININ': [
			{
                "title": "S'affirmer au féminin",
                "subtitle": "Cours de 20 minutes",
                "image_url": "https://static.coorpacademy.com/content/partner-au-feminin/fr/medias/img/cover/shutterstock_403515793-1464273763383.jpg",
                "buttons": [
                    {
                        "type": "web_url",
                        "url": "https://www.coorpacademy.com/catalog/trainings/20",
                        "title": "Plus d'information"
                    },
                    {
                        "type": "web_url",
                        "url": "https://up.coorpacademy.com/discipline/dis_4Ji0aiG5g/module/mod_EyrZRoMql/question",
                        "title": "Commencer le cours"
                    },
                    {
                        "type": "web_url",
                        "url": "https://store.coorpacademy.com/checkout/add/P0",
                        "title": "Acheter le pack"
                    }
                ]
			},
			{
                "title": "La femme, un leader comme les autres",
                "subtitle": "Cours de 20 minutes",
                "image_url": "https://static.coorpacademy.com/content/partner-au-feminin/fr/medias/img/cover/shutterstock_403515793-1464273763383.jpg",
				"buttons": [
					{
						"type": "web_url",
						"url": "https://www.coorpacademy.com/catalog/trainings/21",
						"title": "Plus d'information"
					},
					{
						"type": "web_url",
						"url": "https://up.coorpacademy.com/discipline/dis_Vk2ZOI0ix/module/mod_VJImdUAig/question",
						"title": "Commencer le cours"
					},
					{
						"type": "web_url",
						"url": "https://store.coorpacademy.com/checkout/add/P0",
						"title": "Acheter le pack"
					}
				]
			}
		],
		'DIGITAL': [
			{
				"title": "Métiers du digital",
				"subtitle": "Cours de 15 minutes",
				"image_url": "https://static.coorpacademy.com/content/up/fr/medias/img/cover/metiers_du_digital-1447318780902.jpg",
				"buttons": [
					{
						"type": "web_url",
						"url": "https://up.coorpacademy.com/discipline/dis_VkjiR69Gl",
						"title": "Commencer le cours"
					},
					{
						"type": "web_url",
						"url": "https://store.coorpacademy.com/checkout/add/P0",
						"title": "Acheter le pack"
					}
				]
			},
			{
				"title": "La Révolution Mobile",
				"subtitle": "Cours de 15 minutes",
				"image_url": "https://static.coorpacademy.com/content/up/fr/disciplines/MOBILE.jpg",
				"buttons": [
					{
						"type": "web_url",
						"url": "https://www.coorpacademy.com/catalog/trainings/02",
						"title": "Plus d'information"
					},
					{
						"type": "web_url",
						"url": "https://up.coorpacademy.com/discipline/02",
						"title": "Commencer le cours"
					}
				]
			}
		],
		'LINXEA': [
		    {
                "title": "L'assurance Vie",
                "subtitle": "Cours de 20 minutes",
                "image_url": "https://s3-eu-west-1.amazonaws.com/static.coorpacademy.com/content/CoorpAcademy/content-linxea/cockpit-linxea-academy/cover/fotolia_87271168_subscription_monthly_m-1-1476878009321.jpg",
                "buttons": [
                    {
                        "type": "web_url",
                        "url": "https://www.coorpacademy.com/catalog/trainings/40",
                        "title": "Plus d'information"
                    },
                    {
                        "type": "web_url",
                        "url": "https://up.coorpacademy.com/discipline/dis_Vk6SrO16x/start",
                        "title": "Commencer le cours"
                    },
                    {
                        "type": "web_url",
                        "url": "https://store.coorpacademy.com/checkout/add/P0",
                        "title": "Acheter le pack"
                    }
                ]
            },
            {
                "title": "Gestion et fiscalité de l'assurance vie",
                "subtitle": "Cours de 20 minutes",
                "image_url": "https://s3-eu-west-1.amazonaws.com/static.coorpacademy.com/content/CoorpAcademy/content-linxea/cockpit-linxea-academy/cover/fotolia_79298456_subscription_monthly_m-1-1476878026340.jpg",
                "buttons": [
                    {
                        "type": "web_url",
                        "url": "https://www.coorpacademy.com/catalog/trainings/41",
                        "title": "Plus d'information"
                    },
                    {
                        "type": "web_url",
                        "url": "https://up.coorpacademy.com/discipline/dis_EJ8i7O9ag/start",
                        "title": "Commencer le cours"
                    },
                    {
                        "type": "web_url",
                        "url": "https://store.coorpacademy.com/checkout/add/P0",
                        "title": "Acheter le pack"
                    }
                ]
            }
		]
	};

    const course = courses[selectedCourse];

	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": course
			}
		}
	};

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
