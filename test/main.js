var llamaCppNode = require('..');
var { LLAMAModel, LLAMAContext } = llamaCppNode;
var test = require('node:test');
var assert = require('node:assert');
const { download } = require('../utils-test');
var model = null;
var ctx = null;

test('model-does-not-exist', (t) => {
  var e = null;
  try {
    new LLAMAModel('file-that-not-exist');
  } catch (err) {
    e = err;
  }
  assert.equal(e.message, "Failed to load model");
});

test('model-load', async (t) => {
  await download();
  model = new LLAMAModel('models/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin');
});

test('create-context', async (t) => {
  if (model == null) {
    await download();
    model = new LLAMAModel('models/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin');
  }
  ctx = new LLAMAContext(model);
});

test('encode-decode', async (t) => {
  if (model == null) {
    await download();
    model = new LLAMAModel('models/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin');
  }
  if (ctx == null) {
    ctx = new LLAMAContext(model);
  }
  var tokens = ctx.encode("Hello World!");
  assert.equal(ctx.decode(tokens), "Hello World!");
});