{
  "targets": [
    {
      "target_name": "llama.cpp_ggml",
      "sources": [
        "addon.cpp",
        "llama.cpp_ggml/ggml.c",
        "llama.cpp_ggml/ggml-alloc.c",
        "llama.cpp_ggml/k_quants.c",
        "llama.cpp_ggml/llama.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "llama.cpp_ggml"
      ],
      "cflags": ["-fexceptions"],
      "cflags_cc": ["-fexceptions"],
      "defines": [ "GGML_USE_K_QUANTS", "NAPI_CPP_EXCEPTIONS" ],
      "msvs_settings": {
        "VCCLCompilerTool": { "AdditionalOptions": [ '/arch:AVX2', '/EHsc' ] }
      }
    },
    {
      "target_name": "llama.cpp_gguf",
      "sources": [
        "addon.cpp",
        "llama.cpp_gguf/ggml.c",
        "llama.cpp_gguf/ggml-alloc.c",
        "llama.cpp_gguf/k_quants.c",
        "llama.cpp_gguf/llama.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "llama.cpp_gguf"
      ],
      "cflags": ["-fexceptions"],
      "cflags_cc": ["-fexceptions"],
      "defines": [ "GGML_USE_K_QUANTS", "NAPI_CPP_EXCEPTIONS" ],
      "msvs_settings": {
        "VCCLCompilerTool": { "AdditionalOptions": [ '/arch:AVX2', '/EHsc' ] }
      }
    }
  ]
}
