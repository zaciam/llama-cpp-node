var llamaCppNode = require('..');
var test = require('node:test');
var assert = require('node:assert');
var { download } = require('../utils-test.js');

test('model-load-50', async (t) => {
  await download();
  for (var i = 0; i < 50; i++) {
    model = llamaCppNode.createModel('models/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin');
    assert.notEqual(model, null);
  }
});