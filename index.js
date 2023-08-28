var llama_cpp_ggml = require('./build/Release/llama.cpp_ggml.node');
var llama_cpp_gguf = require('./build/Release/llama.cpp_gguf.node');

llama_cpp_ggml.LLAMAModel.prototype.createContext = function () { return new llama_cpp_ggml.LLAMAContext(this); };
llama_cpp_gguf.LLAMAModel.prototype.createContext = function () { return new llama_cpp_gguf.LLAMAContext(this); };

module.exports = {
	createModel: (filename) => {
		if (filename.endsWith(".gguf")) {
			return new llama_cpp_gguf.LLAMAModel(filename);
		} else if (filename.endsWith(".bin")) {
			return new llama_cpp_ggml.LLAMAModel(filename);
		} else {
			throw new Error("Failed to load model");
		}
	},
	systemInfo: () => {
		return llama_cpp_gguf.systemInfo();
	}
}