var child_process = require('node:child_process');
var fs = require('node:fs');
var model = null;

var download = async () => {
    try {
        fs.mkdirSync('models');
        if (fs.statSync('models/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin').size == 3791725184) {
            return;
        }
    } catch { }
    var exitCode = await new Promise((f, r) => {
        var p = child_process.spawn('curl', [
            '-L',
            '-o', 'Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin',
            'https://huggingface.co/TheBloke/Wizard-Vicuna-7B-Uncensored-GGML/resolve/main/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin'
        ], {
            cwd: 'models',
            stdio: 'inherit'
        });
        p.on('exit', f);
        p.on('error', r);
    });
    if (exitCode != 0) {
        throw new Error("Error: Process has returned non zero error code.");
    }
}

module.exports = { download };
