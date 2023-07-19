var llamaCppNode = require('..');
var { LLAMAModel, LLAMAContext } = llamaCppNode;
var test = require('node:test');
var assert = require('node:assert');
var { download } = require('../test-utils.js');
var model = null;
var ctx = null;

var ask = async (request) => {
  var tokens = ctx.encode(request);
  var response = '';

  while (1) {
    var token = await ctx.eval(tokens);
    tokens = Uint32Array.from([token]);
    response += ctx.decode(tokens);
    if (~response.toUpperCase().indexOf("\nUSER:") || token == llamaCppNode.tokenEos()) {
      break;
    }
  }
  return response.trim();
};

test('days-in-july', async (t) => {
  await download();
  if (model == null) {
    model = new LLAMAModel('models/Wizard-Vicuna-7B-Uncensored.ggmlv3.q4_K_S.bin');
  }
  ctx = new LLAMAContext(model);
  var response = await ask("USER: How many days does july have?\nASSISTANT:");
  assert.equal(response, "July has 31 days.");
});