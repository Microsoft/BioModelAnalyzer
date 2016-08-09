import * as builder from 'botbuilder'
import * as config from 'config'
import * as strings from './strings'

/**
 * Registers the LUIS dialog as root dialog. 
 */
export function registerLUISDialog (bot: builder.UniversalBot) {
    // Create LUIS recognizer that points at our model and add it as the root '/' dialog for our bot.
    let model = 'https://api.projectoxford.ai/luis/v1/application?id=' + config.get('LUIS_MODEL_ID') 
        + '&subscription-key=' + config.get('LUIS_KEY')
    let recognizer = new builder.LuisRecognizer(model)
    let intents = new builder.IntentDialog({ recognizers: [recognizer] })
    bot.dialog('/', intents)

    /**
     * All intent handlers here 
     */
    intents.matches('AboutBot', [function (session) {
            session.send(strings.ABOUT_BOT)
        }
    ])

    intents.matches('ListTutorial', [function (session) {
            session.beginDialog('/tutorials')
        }
    ])
    
    intents.matches('SelectTutorial', [function (session, args) {
        
    }])
    
    intents.matches('ExplainOp', [function (session, args) {
            var operator = builder.EntityRecognizer.findEntity(args.entities, 'Operator')
            var operatorName = operator.entity
            switch (operatorName)
            {
                case 'and':session.send(strings.EXPLAIN_ALWAYS)
                break;
                case 'or':session.send(strings.EXPLAIN_OR)
                break;
                case 'implies':session.send(strings.EXPLAIN_IMPLIES)
                break;
                case 'not':session.send(strings.EXPLAIN_NOT)
                break;
                case 'next':session.send(strings.EXPLAIN_NEXT)
                break;
                case 'always':session.send(strings.EXPLAIN_ALWAYS)
                break;
                case 'eventually':session.send(strings.EXPLAIN_EVENTUALLY)
                break;
                case 'upto':session.send(strings.EXPLAIN_UPTO)
                break;
                case 'weakuntil':session.send(strings.EXPLAIN_WEAKUNTIL)
                break;
                case 'until':session.send(strings.EXPLAIN_UNTIL)
                break;
                case 'release':session.send(strings.EXPLAIN_RELEASE)
                break;
            }   
        }
    ])

    intents.matches('ExplainLTL', builder.DialogAction.send(strings.LTL_DESCRIPTION))
    intents.matches('LTLQuery', [
        (session, args, next) => {
            // check if JSON model has been uploaded already, otherwise prompt user
            if (!session.userData.bmaModel) {
                builder.Prompts.attachment(session, strings.MODEL_SEND_PROMPT)
            } else {
                // invoke LTL parser
                session.send('Try this: ...')
            }
        },
        (session, results, next) => {
            // check and store attachment
            let attachments: builder.IAttachment[] = results.response
            if (attachments.length > 1) {
                session.send(strings.TOO_MANY_FILES)
                return
            }
            let json = attachments[0].content
            let model: any
            if (typeof json === 'string') {
                // TODO does that ever happen except in test cases?!
                // -> who parses incoming JSON? bot framework, or we?
                try {
                    model = JSON.parse(json)
                } catch (e) {
                    session.send(strings.INVALID_JSON(e.message))
                    return
                }
            } else {
                model = json
            }

            session.userData.bmaModel = model
            session.send(strings.MODEL_RECEIVED)
        }
    ])
    
    intents.onDefault(function (session, args) {
        session.send(strings.UNKNOWN_INTENT)
    })
}