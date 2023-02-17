define('ace/mode/asit', function (require, exports, module) {

    var oop = require("ace/lib/oop");
    var TextMode = require("ace/mode/text").Mode;
    var AsitHighlightRules = require("ace/mode/asit_highlight_rules").AsitHighlightRules;

    var Mode = function () {
        
        this.HighlightRules = AsitHighlightRules;
        
    };
    oop.inherits(Mode, TextMode);

    (function () {
        // Extra logic goes here. (see below)
    }).call(Mode.prototype);

    exports.Mode = Mode;
});

define('ace/mode/asit_highlight_rules', function (require, exports, module) {

    var oop = require("ace/lib/oop");
    var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

    var AsitHighlightRules = function () {

        this.$rules = {
            "start": 
            [   {   // Empty Line
                token: 'entity',
                regex: /^\s*$/,
                },{ // comment
                token: 'comment',
                regex: /#.*$/,
                },{ // variable: 
                token: 'variable',
                regex: /[a-zA-Z][\w_\.]*:/
                },{ // variable: 
                token: 'tag',
                regex: /![\w_.]*/
                }, { // variable: 
                    token: 'string',
                    regex: /.*/
                }

            ]
        }

    }

    oop.inherits(AsitHighlightRules, TextHighlightRules);

    exports.AsitHighlightRules = AsitHighlightRules;
});