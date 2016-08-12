import * as builder from 'botbuilder'
import * as restify from 'restify'
import * as config from 'config'
import { BlobModelStorage } from './ModelStorage'
import { setup as setupBot } from './bot'
import NLParser from './NLParser/NLParser'


var sentence = "show me a simulation where if x=1 and y=1 then z=1 eventually "
var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "x", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "y", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "z", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
var parserResponse = NLParser.parse(sentence, model)

let server = restify.createServer()
server.listen(config.get('PORT'), () => {
    console.log('%s listening to %s', server.name, server.url)
})
if (config.get('SERVE_STATIC_VIA_RESTIFY')) {
    server.get(/\/?.*/, restify.serveStatic({
        directory: './public'
    }))
}

let botSettings = {
    // this is false by default but we need to access data between unrelated dialogs
    persistConversationData: true
}

let bot: builder.UniversalBot
if (config.get('USE_CONSOLE')) {
    // Create console bot
    let connector = new builder.ConsoleConnector().listen()
    bot = new builder.UniversalBot(connector, botSettings)
} else {
    // Create server bot
    let connector = new builder.ChatConnector({
        appId: config.get<string>('APP_ID'),
        appPassword: config.get<string>('APP_PASSWORD')
    })
    bot = new builder.UniversalBot(connector, botSettings)
    server.post('/api/messages', connector.listen())
}

let modelStorage = new BlobModelStorage()
setupBot(bot, modelStorage)