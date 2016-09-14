// Copyright (C) 2016 Microsoft - All Rights Reserved

import * as builder from 'botbuilder'

import {registerMiddleware} from './middleware'
import {registerLUISDialog} from './dialogs/luis'
import {registerTutorialDialogs} from './dialogs/tutorials'
import {registerFormulaHistoryDialogs} from './dialogs/formulaHistory'
import {registerFormulaDialog} from './dialogs/formula'
import {registerModelStorageDialogs} from './dialogs/modelStorage'
import {ModelStorage} from './ModelStorage'

/** Registers all dialogs and middlewares onto the given bot instance. */
export function setup (bot: builder.UniversalBot, modelStorage: ModelStorage) {
    registerMiddleware(bot)
    registerLUISDialog(bot, modelStorage)
    registerTutorialDialogs(bot)
    registerFormulaDialog(bot, modelStorage)
    registerFormulaHistoryDialogs(bot)
    registerModelStorageDialogs(bot, modelStorage)
}
