var llamaCppNode = require('.');
var { LLAMAModel, LLAMAContext } = llamaCppNode;
var readline = require('readline/promises');

// Print some system info.
console.log(llamaCppNode.systemInfo());

// Load the model and create a context.
var model = new LLAMAModel('C:/models/13B/Wizard-Vicuna-13B-Uncensored.ggmlv3.q4_0.bin');

var ctx = new LLAMAContext(model);

// Specify the initial prompt and encode it as tokens.
var prompt = 'You are a 25 old human named ASSISTANT. It follows a transcript between you and your wife named USER.\nASSISTANT:';
var tokens = ctx.encode(prompt);

// Add a BOS token at the beginning of the tokens.
tokens = Array.from(tokens);
tokens.unshift(llamaCppNode.tokenBos());
tokens = Uint32Array.from(tokens);

// Create a readline interface to communicate with the user.
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

interact = async () => {
  // Print out the prompt line.
  var line = 'ASSISTANT:';
  process.stdout.write(line);

  // Loop until user input is needed.
  while (1) {
    // Evaluate to get the next token.
    var nextToken = await ctx.eval(tokens);

    // Handle EOS as switch between assistant to user.
    if (nextToken === llamaCppNode.tokenEos()) {
      // Fixup the reverse prompt.
      tokenStr = '\nUSER: '
      process.stdout.write(tokenStr);
      break;
    }

    // Create tokens for the next eval.
    tokens = Uint32Array.from([nextToken]);

    // Decode the next token to token string.
    var tokenStr = ctx.decode(tokens);

    // Remove additional spaces after the assistant colon (only on the terminal).
    if (tokenStr.startsWith(' ') && line === 'ASSISTANT: ') {
      tokenStr = tokenStr.slice(1);
    }

    // Output the new token.
    process.stdout.write(tokenStr);
    if (tokenStr === '') {
      process.stdout.write('[' + nextToken + ']');
    }

    // Track what is on the current line.
    if (tokenStr === '\n') {
      line = '';
    } else {
      line += tokenStr;
    }

    // Handle the reverse prompt as switch between assistant to user.
    if (line.toUpperCase().startsWith('USER:')) {
      // Add a missing space if needed.
      if (!line.endsWith(' ')) {
        tokenStr += ' ';
        process.stdout.write(' ');
      }
      break;
    }
  }

  // Prompt the user for input and encode the tokens.
  var input = await rl.question('USER: ');
  tokens = ctx.encode(tokenStr + input + '\nASSISTANT:');
};

main = async () => {
  try {
    // Endless loop for endless chatting.
    while (1) {
      await interact();
    }
  } catch (e) {
    console.log(e.stack);
  }
};

main();