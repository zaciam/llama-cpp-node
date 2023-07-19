#include <sstream>

#include "llama.h"
#include "napi.h"

class LLAMAModel : public Napi::ObjectWrap<LLAMAModel> {
  public:
  llama_context_params params;
  llama_model* model;
  LLAMAModel(const Napi::CallbackInfo& info) : Napi::ObjectWrap<LLAMAModel>(info) {
    params = llama_context_default_params();
    params.seed = -1;
    params.n_ctx = 4096;
    model = llama_load_model_from_file(info[0].As<Napi::String>().Utf8Value().c_str(), params);

    if (model == NULL) {
      Napi::Error::New(info.Env(), "Failed to load model").ThrowAsJavaScriptException();
      return;
    }
  }
  ~LLAMAModel() { llama_free_model(model); }
  static void init(Napi::Object exports) { exports.Set("LLAMAModel", DefineClass(exports.Env(), "LLAMAModel", {})); }
};

class LLAMAContext : public Napi::ObjectWrap<LLAMAContext> {
  public:
  LLAMAModel* model;
  llama_context* ctx;
  LLAMAContext(const Napi::CallbackInfo& info) : Napi::ObjectWrap<LLAMAContext>(info) {
    model = Napi::ObjectWrap<LLAMAModel>::Unwrap(info[0].As<Napi::Object>());
    model->Ref();
    ctx = llama_new_context_with_model(model->model, model->params);
    Napi::MemoryManagement::AdjustExternalMemory(Env(), llama_get_state_size(ctx));
  }
  ~LLAMAContext() {
    Napi::MemoryManagement::AdjustExternalMemory(Env(), -(int64_t)llama_get_state_size(ctx));
    llama_free(ctx);
    model->Unref();
  }
  Napi::Value Encode(const Napi::CallbackInfo& info) {
    std::string text = info[0].As<Napi::String>().Utf8Value();

    std::vector<llama_token> tokens(text.size());
    int n = llama_tokenize(ctx, text.data(), tokens.data(), text.size(), false);

    if (n < 0) {
      Napi::Error::New(info.Env(), "String expected").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
    tokens.resize(n);

    Napi::Uint32Array result = Napi::Uint32Array::New(info.Env(), n);
    for (size_t i = 0; i < tokens.size(); ++i) { result[i] = static_cast<uint32_t>(tokens[i]); }

    return result;
  }
  Napi::Value Decode(const Napi::CallbackInfo& info) {
    Napi::Uint32Array tokens = info[0].As<Napi::Uint32Array>();

    // Create a stringstream for accumulating the decoded string.
    std::stringstream ss;

    // Decode each token and accumulate the result.
    for (size_t i = 0; i < tokens.ElementLength(); i++) {
      const char* str = llama_token_to_str(ctx, (llama_token)tokens[i]);
      if (str == nullptr) {
        Napi::Error::New(info.Env(), "Invalid token").ThrowAsJavaScriptException();
        return info.Env().Undefined();
      }
      ss << str;
    }

    return Napi::String::New(info.Env(), ss.str());
  }
  Napi::Value Eval(const Napi::CallbackInfo& info);
  static void init(Napi::Object exports) {
    exports.Set("LLAMAContext",
        DefineClass(exports.Env(),
            "LLAMAContext",
            {
                InstanceMethod("encode", &LLAMAContext::Encode),
                InstanceMethod("decode", &LLAMAContext::Decode),
                InstanceMethod("eval", &LLAMAContext::Eval),
            }));
  }
};


class LLAMAContextEvalWorker : Napi::AsyncWorker, Napi::Promise::Deferred {
  LLAMAContext* ctx;
  std::vector<llama_token> tokenList;
  llama_token result;

  public:
  LLAMAContextEvalWorker(const Napi::CallbackInfo& info, LLAMAContext* ctx) : Napi::AsyncWorker(info.Env(), "LLAMAContextEvalWorker"), ctx(ctx), Napi::Promise::Deferred(info.Env()) {
    ctx->Ref();
    Napi::Uint32Array tokens = info[0].As<Napi::Uint32Array>();
    tokenList.reserve(tokens.ElementLength());
    for (size_t i = 0; i < tokens.ElementLength(); i++) { tokenList.push_back(static_cast<llama_token>(tokens[i])); }
  }
  ~LLAMAContextEvalWorker() { ctx->Unref(); }
  using Napi::AsyncWorker::Queue;
  using Napi::Promise::Deferred::Promise;

  protected:
  void Execute() {
    // Perform the evaluation using llama_eval.
    int re = llama_eval(ctx->ctx, tokenList.data(), tokenList.size(), llama_get_kv_cache_token_count(ctx->ctx), 6);
    if (re != 0) {
      SetError("Eval has failed");
      return;
    }

    // Select the best prediction.
    std::vector<llama_token_data> candidates;
    int n_vocab = llama_n_vocab(ctx->ctx);
    candidates.reserve(n_vocab);
    float* logits = llama_get_logits(ctx->ctx);
    for (llama_token id = 0; id < n_vocab; id++) { candidates.emplace_back(llama_token_data { id, logits[id], 0.0f }); }
    llama_token_data_array candidates_p = { candidates.data(), candidates.size(), false };
    result = llama_sample_token_greedy(ctx->ctx, &candidates_p);
  }
  void OnOK() { Napi::Promise::Deferred::Resolve(Napi::Number::New(Napi::AsyncWorker::Env(), (uint32_t)result)); }
  void OnError(const Napi::Error& err) { Napi::Promise::Deferred::Reject(err.Value()); }
};

Napi::Value LLAMAContext::Eval(const Napi::CallbackInfo& info) {
  LLAMAContextEvalWorker* worker = new LLAMAContextEvalWorker(info, this);
  worker->Queue();
  return worker->Promise();
}

Napi::Value tokenBos(const Napi::CallbackInfo& info) { return Napi::Number::From(info.Env(), llama_token_bos()); }
Napi::Value tokenEos(const Napi::CallbackInfo& info) { return Napi::Number::From(info.Env(), llama_token_eos()); }
Napi::Value systemInfo(const Napi::CallbackInfo& info) { return Napi::String::From(info.Env(), llama_print_system_info()); }

Napi::Object registerCallback(Napi::Env env, Napi::Object exports) {
  llama_backend_init(false);
  exports.DefineProperties({
      Napi::PropertyDescriptor::Function("tokenBos", tokenBos),
      Napi::PropertyDescriptor::Function("tokenEos", tokenEos),
      Napi::PropertyDescriptor::Function("systemInfo", systemInfo),
  });
  LLAMAModel::init(exports);
  LLAMAContext::init(exports);
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, registerCallback)