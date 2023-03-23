window.asit_types = new Array();

function decode(data) {
    return data.replace(/\f/g, '\n');
}

function encode(data) {
    if (typeof(data) == 'string' && data.length > 0)
        return data.replace(/\n/g, '\f');
    return data
}

function next() {
    backdoor("backdoor", "", "");
}

function back() {
}

function sidebar() {
}

window.onerror = (event, source, lineno, colno, error) => { console.log('Editor Error: ' + JSON.stringify(event) )}; 

window.fusionJavaScriptHandler =
{
    handle: function (action, data) {
        var editor = ace.edit("editor");
        var decoded = decode(data);

        console.log('Editor palette incoming' + action + ': ' + decoded)
        try {
            if (action == 'response') {
                
            }
            else if (action == 'init_asit') {
                window.asit_types = decoded
                session = ace.createEditSession("", "ace/mode/asit");
                editor.setSession(session);
            }
            else if (action == 'replace') {
                ignore_on_change = true;
                editor.setValue(decoded);
                ignore_on_change = false;
            }
            else if (action == 'open') {
                session = ace.createEditSession("", "ace/mode/asit");
                editor.setSession(session);
                session.on('change', autosave);

                ignore_on_change = true
                editor.setValue(decoded);
                ignore_on_change = false;
            }
            else if (action == 'debugger') {
                debugger;
            }
            else {
                console.log('Unexpected command type: ' + action);
            }
        } catch (e) {
            console.log(e);
            console.log('exception caught with command: ' + action + ', data: ' + decoded);
        }
        // Build up JSON return string.
        var result = {};
        result.status = 'OK';
        var response = JSON.stringify(result);
        console.log("Editor fusionJavaScriptHandler response: " + response);
        return response;
    }
};

function sendToFusion(cmd, selector, data) {

    try {
        if (cmd == 'autosave') {
            adsk.fusionSendData(cmd, encode(data));   
            return "OK";
        }

        if (cmd == 'file') {
            adsk.fusionSendData(cmd + '.' + selector, encode(data))
                .then((result) => {
                    if (result.length > 0) {
                        var r = JSON.parse(result);
                        if (r.status == 'OK') {
                            editor.setValue(decode(r.data))
                            
                        }

                    } 
                    return "OK";
                });       
        }

        if (cmd == 'modify') {
            adsk.fusionSendData(cmd + '.' + selector, encode(data))
             .then((result) => {
                 if (result.length > 0) {
                     var r = JSON.parse(result);
                     if (r.status == 'OK') {
                         editor.setValue(decode(r.data))

                     }

                 }
                 return "OK";
             });       
        }

        if (cmd == 'commit') {
            adsk.fusionSendData(cmd + '.' + selector, encode(data));
                return "OK";
        }
    }
    catch (error) {
        console.log(`sendToFusion error ${error}`);
    }

    return 'OK'
}

function handleCmd_2(cmd, data) {

    function handle() {
        if (cmd == 'commit') {
            sendToFusion(cmd, data, editor.getValue()); 
        }
        else if (cmd == 'file') {
            sendToFusion(cmd, data, "");
        }
        else if (cmd == 'modify') {
            sendToFusion(cmd, data, "");
        }
    }
    return handle;
}

function handleCmd(cmd, data) {
    window.requestIdleCallback(handleCmd_2(cmd, data), { timeout: 200 })
}

function autosave_2() {
    var val = editor.getSession().getValue();
    if (val) {
        // console.log("autosave sent to python")
        sendToFusion('autosave', "", val);
    }
}

function autosave() //writes in <div> with id=output
{
    window.requestIdleCallback(autosave_2, { timeout: 200 })
}

// ace.config.set('basePath', '../ace_src');

var editor = ace.edit("editor");
editor.setOptions({
    maxLines: Infinity,
    minLines: 100,
    dragEnabled: true,
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
    autoScrollEditorIntoView: true,
    vScrollBarAlwaysVisible: true
    
})

editor.setTheme("ace/theme/github");
editor.session.setMode("ace/mode/yaml");
editor.session.on('change', autosave); //TBD restore and implement
console.log('Editor created 11');


function adjust_tab_size(ac_data, indent) {
    ac = [];
    
    ac_data.forEach(function(element) { 
        ac.push({
            caption: element.caption,
            value: element.value.replace(/\n/g, '\n' + indent),
            meta: element.meta
        })
        
    });
    return ac;
}

function get_parent_tag(pos){
    for (i = pos.row - 1; i >= 0; i--) {
        var line = editor.session.getLine(i);
        if (line.lastIndexOf('!') != -1) {
            const regexp = new RegExp("\![a-z][\w]");
            return line.search(regexp);
        }
    }
}

const tag_completions = [ 
    {
        caption: 'component',
        value: `component
    coordinates: !point3d
        x: !tbd
        y: !tbd
        z: !tbd
    `,
        meta: "fusion"
    },
    {
        caption: 'sketch',
        value: `sketch
    plane: xy
    center: !point3d
        x: !tbd
        y: !tbd 
    script: !script |+
        sketchLines = sketch().sketchCurves.sketchLines 
    `,
        meta: "fusion"
    },
    {
        caption: 'script',
        value: `script |+
    sketchLines = sketch().sketchCurves.sketchLines 
    `,
        meta: "fusion"
    },
    {
        caption: 'body',
        value: `body
    extrude: !extrude
        sketch: !tbd
        distance: !tbd 
    `,
        meta: "fusion"
    },
    {
        caption: 'extrude',
        value: `extrude
    sketch: !tbd
    distance: !tbd 
    `,
        meta: "fusion"
    },
    {
        caption: 'from',
        value: `from !tbd import doc
    `,
        meta: "fusion"
    }

]

function callback() {
    alert("aaa")
}

function add_tag_completions(){
    var staticWordCompleter = {
        getCompletions: function (editor, session, pos, prefix, callback) {
            var wordList = [];
            var line = editor.session.getLine(pos.row);
            // Add key: or new doc
            if (pos.column == 0) {
                item = {
                    caption: 'subsection',
                    value: `---

                    `,
                    meta: "doc"

                }
                wordList.push(item);
                console.log(wordList.length);
                console.log(JSON.stringify(wordList));
                callback(null, wordList);
            }
            // Creating Tag
            else if ((pos.column > prefix.length + 1) && line[pos.column - prefix.length - 1] == '!') {
                
                level = line.search(/[^\s\\]/);
                console.log("level: " + level);
                const regexp = new RegExp('^' + prefix, 'i');
                ac = adjust_tab_size(tag_completions.filter(x => regexp.test(x.caption)), " ".repeat(level));
                callback(null, ac);
            }
        }
    }
    
    editor.completers.push(staticWordCompleter);
}
            // console.log("pos: " + JSON.stringify(pos));
            // var wordList = ["component", "bar", "baz"];
            // callback(null, wordList.map(function (word) {
            //     console.log("word:" + word);
            //     console.log("position:" + pos);
            //     console.log("prefix:" + prefix);
            //     console.log("callback:" + callback);
            //     return {
            //         caption: word,
            //         value: word,
            //         meta: "static"
            //     };
//             }));

//         }
//     }

//     //langTools.setCompleters([staticWordCompleter])
//     // or 
//     //editor.completers = [staticWordCompleter]
//     //UPDATE: consider adding to completers list to not remove ace's already added completers
//     editor.completers.push(staticWordCompleter);
// }

add_tag_completions();



