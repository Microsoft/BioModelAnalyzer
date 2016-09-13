/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="..\..\node_modules\monaco-editor\monaco.d.ts"/>

module BMA.CodeEditor {
    export type Options =
        {
            text: string;
            language: string;
            suggestVariables: string[];
        }

    var lang_targetfunc = {
        tokensProvider: {
            keywords: [
                'min', 'max', 'avg', 'ceil', 'floor'
            ],

            operators: ['+', '-', '*', '/'
            ],

            brackets: [
                ['(', ')', 'delimiter.parenthesis']
            ],

            // we include these common regular expressions
            symbols: /[=><!~?:&|+\-*\/\^%]+/,

            numbers: /(?:[+-])?(?:(?:(?:\d*\.)?\d+)(?:[eE][-+]?\d+)?)/,

            // The main tokenizer for our languages
            tokenizer: {
                root: [
                    // identifiers and keywords
                    [/(var\s*)(\()([^)]+)(\))/, ['keyword', '@brackets', 'identifier', '@brackets']],

                    [/(const\s*)(\()(\s*@numbers\s*)(\))/, ['keyword', '@brackets', 'number', '@brackets']],

                    [/[A-Za-z_$][\w$]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default': 'invalid'
                        }
                    }
                    ],

                    // whitespace
                    { include: '@whitespace' },

                    // delimiters and operators
                    [/[()]/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],

                    // numbers
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/\d+/, 'number'],

                    // delimiter: after number because of .\d floats
                    [/[,]/, 'delimiter'],
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white']
                ]
            }
        },
        completionItemProvider: (variables: string[]) => {
            var items = [
                {
                    label: 'max',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'max({{A}},{{B}})',
                    documentation: "Returns the maximum of two or more expressions."
                },
                {
                    label: 'min',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'min({{A}},{{B}})',
                    documentation: "Returns the minimum of two or more expressions."
                },
                {
                    label: 'avg',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'avg({{A}},{{B}})',
                    documentation: "Returns the average of two or more expressions."
                },
                {
                    label: 'ceil',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'ceil({{A}})',
                    documentation: "Returns the ceiling of an expression."
                },
                {
                    label: 'floor',
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: 'floor({{A}})',
                    documentation: "Returns the floor of an expression."
                },

                {
                    label: 'var',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'var({{A}})',
                    documentation: "Represents a variable with the give name."
                },
                {
                    label: 'const',
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: 'const({{0}})',
                    documentation: "Represents a numeric value."
                }
            ];
            if (variables) {
                for (var i = 0; i < variables.length; i++) {
                    items.push({
                        label: variables[i],
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'var(' + variables[i] + ')',
                        documentation: undefined
                    });
                }
            }
            return () => items;
        }
    }

    export var languages = {
        "bma.targetfunc": lang_targetfunc
    }
}

(function ($) {
    $.widget("BMA.codeeditor", {
        options: <BMA.CodeEditor.Options>{
            text: "",
            language: "",
            suggestVariables: new Array<string>(0),
        },

        _create: function () {
            this._refresh();
        },

        _refresh: function () {
            var that = this;
            var options = <BMA.CodeEditor.Options>this.options;

            var editor = $.data(this.element, "editor");
            if (!editor) {
                var lang = BMA.CodeEditor.languages[options.language];
                monaco.languages.register({ id: options.language });
                monaco.languages.setMonarchTokensProvider(options.language, lang.tokensProvider);
                monaco.languages.setLanguageConfiguration(options.language, { brackets: [['(', ')']] });

                if (lang._completionItemProvider) lang._completionItemProvider.dispose();
                lang._completionItemProvider = monaco.languages.registerCompletionItemProvider(options.language, { provideCompletionItems: lang.completionItemProvider(options.suggestVariables) });

                this.element.empty();
                this.element.addClass("bma.codeeditor");

                editor = monaco.editor.create(this.element[0], {
                    value: options.text,
                    language: options.language,
                    lineNumbers: false,
                    scrollBeyondLastLine: false,
                    autoClosingBrackets: true,
                    wordWrap: true
                });
                $.data(this.element, "editor", editor);
                this.onContentChanged = editor.onDidChangeModelContent(e => {
                    that._trigger("change");
                });
            }
            else { // already initialized
                var lang = BMA.CodeEditor.languages[options.language];

                // Update completion item provider
                if (lang._completionItemProvider) lang._completionItemProvider.dispose();
                lang._completionItemProvider = monaco.languages.registerCompletionItemProvider(options.language, { provideCompletionItems: lang.completionItemProvider(options.suggestVariables) });

                // If need, update editor text
                if (editor.getValue() != options.text) {
                    editor.setValue(options.text);
                }
            }
        },

        _destroy: function () {
            var editor = $.data(this.element, "editor");
            if (editor) {
                editor.dispose();
            }
            this.element.empty();
        },

        // _setOptions is called with a hash of all options that are changing
        // always refresh when changing options
        _setOptions: function () {
            this._superApply(arguments);
            this._refresh();
        },

        text: function () {
            var editor = $.data(this.element, "editor");
            return editor.getValue();
        }
    });
} (jQuery));

interface JQuery {
    codeeditor(): JQuery;
    codeeditor(settings: BMA.CodeEditor.Options): JQuery;
    codeeditor(settings: string): any;
    codeeditor(optionLiteral: string, optionName: string): any;
    codeeditor(optionLiteral: string, optionName: string, optionValue: any): JQuery;
}  