var llamaCppNode = require('..');
var test = require('node:test');
var assert = require('node:assert');
const { download } = require('../utils-test');
var model = null;
var ctx = null;

test('create-context-50', async (t) => {
  await download();
  if (model == null) {
    model = llamaCppNode.createModel('models/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin');
  }
  for (var i = 0; i < 50; i++) {
    ctx = model.createContext(model);
    assert.notEqual(ctx, null);
    await new Promise((f) => setTimeout(f, 100));
  }
}); 