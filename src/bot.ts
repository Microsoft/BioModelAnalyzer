import * as builder from 'botbuilder'
import * as config from 'config'

export function setup (bot: builder.UniversalBot) {
    registerLUISDialog(bot)
    registerTutorialDialogs(bot)
}

function registerLUISDialog (bot: builder.UniversalBot) {
    // Create LUIS recognizer that points at our model and add it as the root '/' dialog for our bot.
    let model = 'https://api.projectoxford.ai/luis/v1/application?id=' + config.get('LUIS_MODEL_ID') + '&subscription-key=' + config.get('LUIS_KEY')
    let recognizer = new builder.LuisRecognizer(model)
    let dialog = new builder.IntentDialog({ recognizers: [recognizer] })
    bot.dialog('/', dialog)

    // Add intent handlers
    dialog.matches('ExplainLTL', builder.DialogAction.send('LTL means linear temporal logic'))
    dialog.matches('LTLQuery', [
        function (session, args, next) {
            // send file
            let message = new builder.Message(session)
            message.addAttachment({
                contentType: 'application/octet-stream',
                content: 'foo'
            })
            message.text('attachment coming')
            session.send(message)
        }
    ])
    dialog.onDefault(builder.DialogAction.send('sorry, no idea what you are saying'))
}

function registerTutorialDialogs (bot: builder.UniversalBot) {
    // TODO implement
}