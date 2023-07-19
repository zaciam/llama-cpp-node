var llamaCppNode = require('..');
var { LLAMAModel, LLAMAContext } = llamaCppNode;
var test = require('node:test');
var assert = require('node:assert');
var { download } = require('../test-utils.js');

test('model-load-50', async (t) => {
  await download();
  for (var i = 0; i < 50; i++) {
    model = new LLAMAModel('models/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin');
    assert.notEqual(model, null);
  }
});