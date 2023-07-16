# Llama-Cpp-Node

Llama-Cpp-Node is a Node.js binding for llama.cpp, a C++ library for LLMs (Large Language Models) like wizard models.
This module allows you to load a model file, create a context, encode strings into tokens, evaluate tokens on the context to predict the next token, and decode tokens back to strings.

## Prerequisites

Before using llama-cpp-node, please ensure the following prerequisites are met:

- C++ Compiler: A C++ compiler is required to build the underlying llama.cpp library. Make sure you have a compatible C++ compiler installed. For Linux, you may need to install `build-essential` or an equivalent package depending on your distribution. For Windows, you can use Visual Studio with C++ support.

## Installation

To install llama-cpp-node, you can use npm:

```bash
npm install llama-cpp-node
```

Note: The latest llama.cpp source code will be automatically downloaded from [here](https://github.com/ggerganov/llama.cpp/releases/latest) during the installation.

## Usage

To get started, require the module in your Node.js application:

```javascript
var llamaCppNode = require('llama-cpp-node');
var { LLAMAModel, LLAMAContext } = llamaCppNode;
```

### Loading a Model File and Creating a Context

Before you can use llama-cpp-node, you need to load a model file and create a context.
The model file should be in the ggml format.

```javascript
var model = new LLAMAModel('C:/models/13B/Wizard-Vicuna-13B-Uncensored.ggmlv3.q4_0.bin');
var ctx = new LLAMAContext(model);
```

### Encoding Strings into Tokens

To use the model for predictions, you need to encode input strings into tokens. Tokens are represented as `Uint32Array`s.

```javascript
var prompt = 'You are a 25 old human named ASSISTANT. It follows a transcript between you and your wife named USER.\nASSISTANT:';
var tokens = ctx.encode(prompt);
```

### Evaluating Tokens to Predict the Next Token

After encoding the input string, you can evaluate the tokens on the context to predict the next token.

```javascript
var nextToken = await ctx.eval(tokens);
```

### Decode Tokens into Strings

To decode tokens back to strings you can use the `decode` method.
```javascript
var tokens = Uint32Array.from([nextToken]);
var tokenStr = ctx.decode(tokens);
```

### Chatbot Example

To create a conversational chatbot, you can use the readline module to communicate with the user.

```javascript
var llamaCppNode = require('llama-cpp-node');
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
  // Print out the promnpt line.
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
```

Make sure to replace `C:/models/13B/Wizard-Vicuna-13B-Uncensored.ggmlv3.q4_0.bin` with the actual path to your llama model file.

## API

### `llamaCppNode.systemInfo()`

This function returns information about the system where llama-cpp-node is running, such as the CPU and GPU information.

### `new LLAMAModel(modelPath: string)`

This class represents a llama model. It takes the path to the model file as a parameter and can be used to create a context.

### `new LLAMAContext(model: LLAMAModel)`

This class represents a context for the llama model. It takes a model instance as a parameter and can be used to encode, evaluate, and decode tokens.

### `ctx.encode(input: string): Uint32Array`

This method takes an input string and encodes it into tokens. It returns a `Uint32Array` representing the tokens.

### `ctx.eval(tokens: Uint32Array): Promise<number>`

This method takes a `Uint32Array` of tokens and evaluates them on the context to predict the next token. It returns a Promise that resolves to the next predicted token.

### `ctx.decode(tokens: Uint32Array): string`

This method takes a `Uint32Array` of tokens and decodes them back into a string. It returns the decoded string.

## Contributing

Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue on the [GitHub repository](https://github.com/zaciam/llama-cpp-binding).

## License

This module is released under the [MIT License](https://opensource.org/licenses/MIT). See the [LICENSE](https://github.com/zaciam/llama-cpp-binding/LICENSE) file for more details.