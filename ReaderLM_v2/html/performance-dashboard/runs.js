window.READERLM_RUNS = {
  "generated_at": "2026-09-29T23:25:14-04:00",
  "run_count": 7,
  "errors": [],
  "runs": [
    {
      "id": "2026-09-29_232511-008_json_madoka-suzuki-207363_readerlm-v2_cleaned",
      "folder": "2026-09-29_232511-008_json_madoka-suzuki-207363_readerlm-v2_cleaned",
      "file": "2026-09-29_232511-008_madoka-suzuki-207363_performance.json",
      "relative_path": "output/2026-09-29_232511-008_json_madoka-suzuki-207363_readerlm-v2_cleaned/2026-09-29_232511-008_madoka-suzuki-207363_performance.json",
      "report": {
        "timing": {
          "started_at": "2026-09-29T23:25:11.312-04:00",
          "finished_at": "2026-09-29T23:25:14.280-04:00"
        },
        "model": {
          "id": "readerlm-v2",
          "publisher": "mradermacher",
          "architecture": "qwen2",
          "quantization": "Q6_K",
          "state": "loaded",
          "loaded_context_length": 8192,
          "max_context_length": 512768
        },
        "request": {
          "endpoint": "/api/v1/chat",
          "temperature": 0.0,
          "repeat_penalty": 1.08,
          "max_tokens": 2048,
          "prompt_characters": 12076
        },
        "tokens": {
          "input_tokens": 4293,
          "output_tokens": 521,
          "reasoning_output_tokens": 0,
          "total_tokens": 4814
        },
        "speed": {
          "tokens_per_second": 208.13,
          "time_to_first_token_seconds": 0.443,
          "model_load_time_seconds": null,
          "wall_clock_seconds": 2.968,
          "output_tokens_per_wall_second": 175.56
        },
        "memory": {
          "before": {
            "captured_at": "2026-09-29T23:25:11.050-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4528.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 4.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 50463.7,
              "used_mib": 14493.7,
              "used_percent": 22
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 939.2,
              "largest_working_set_mib": 668.8,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 57.4
                },
                {
                  "pid": 12432,
                  "working_set_mib": 668.8
                },
                {
                  "pid": 24004,
                  "working_set_mib": 6.8
                },
                {
                  "pid": 24532,
                  "working_set_mib": 6.6
                },
                {
                  "pid": 25080,
                  "working_set_mib": 57.6
                },
                {
                  "pid": 25588,
                  "working_set_mib": 1.8
                },
                {
                  "pid": 26380,
                  "working_set_mib": 131.0
                },
                {
                  "pid": 28196,
                  "working_set_mib": 6.6
                },
                {
                  "pid": 29432,
                  "working_set_mib": 0.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 2.6
                }
              ]
            }
          },
          "after": {
            "captured_at": "2026-09-29T23:25:14.280-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4493.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 86.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 50230.7,
              "used_mib": 14726.7,
              "used_percent": 22
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 1173.3,
              "largest_working_set_mib": 894.7,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 58.4
                },
                {
                  "pid": 12432,
                  "working_set_mib": 894.7
                },
                {
                  "pid": 24004,
                  "working_set_mib": 6.8
                },
                {
                  "pid": 24532,
                  "working_set_mib": 6.6
                },
                {
                  "pid": 25080,
                  "working_set_mib": 57.6
                },
                {
                  "pid": 25588,
                  "working_set_mib": 1.8
                },
                {
                  "pid": 26380,
                  "working_set_mib": 138.2
                },
                {
                  "pid": 28196,
                  "working_set_mib": 6.6
                },
                {
                  "pid": 29432,
                  "working_set_mib": 0.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 2.6
                }
              ]
            }
          },
          "gpu_samples": 6,
          "gpu_peak_used_mib": 4526.0
        },
        "result": {
          "finish_reason": "stop",
          "json_parsed": true,
          "json_object_count": 9,
          "schema_ok": true,
          "schema_detail": "9 objects with the required fields"
        },
        "lmstudio_stats": {
          "input_tokens": 4293,
          "total_output_tokens": 521,
          "reasoning_output_tokens": 0,
          "tokens_per_second": 208.1312609159054,
          "time_to_first_token_seconds": 0.443
        },
        "insights": [
          "The prompt used 4293 of 8192 loaded context tokens (52%).",
          "Time to first token was 0.443s, about 9691 input tokens/second of prompt processing.",
          "Generation speed was 208.1 tokens/second across 521 output tokens.",
          "Wall clock for the whole request was 2.968s (175.5 output tokens per wall-clock second, including prompt processing).",
          "GPU memory after the run was 4493 of 24463 MiB on NVIDIA GeForce RTX 5090 Laptop GPU.",
          "Peak GPU memory sampled during the request was 4526 MiB.",
          "The model was already loaded, so this run has no model-load time."
        ]
      }
    },
    {
      "id": "2026-09-29_232110-212_json_nick-suzuki-187477_readerlm-v2_cleaned",
      "folder": "2026-09-29_232110-212_json_nick-suzuki-187477_readerlm-v2_cleaned",
      "file": "2026-09-29_232110-212_nick-suzuki-187477_performance.json",
      "relative_path": "output/2026-09-29_232110-212_json_nick-suzuki-187477_readerlm-v2_cleaned/2026-09-29_232110-212_nick-suzuki-187477_performance.json",
      "report": {
        "timing": {
          "started_at": "2026-09-29T23:21:10.481-04:00",
          "finished_at": "2026-09-29T23:21:15.239-04:00"
        },
        "model": {
          "id": "readerlm-v2",
          "publisher": "mradermacher",
          "architecture": "qwen2",
          "quantization": "Q6_K",
          "state": "loaded",
          "loaded_context_length": 8192,
          "max_context_length": 512768
        },
        "request": {
          "endpoint": "/api/v1/chat",
          "temperature": 0.0,
          "repeat_penalty": 1.08,
          "max_tokens": 2048,
          "prompt_characters": 18891
        },
        "tokens": {
          "input_tokens": 7021,
          "output_tokens": 867,
          "reasoning_output_tokens": 0,
          "total_tokens": 7888
        },
        "speed": {
          "tokens_per_second": 207.63,
          "time_to_first_token_seconds": 0.544,
          "model_load_time_seconds": null,
          "wall_clock_seconds": 4.758,
          "output_tokens_per_wall_second": 182.23
        },
        "memory": {
          "before": {
            "captured_at": "2026-09-29T23:21:10.226-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4159.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 4.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 51321.1,
              "used_mib": 13636.3,
              "used_percent": 20
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 628.3,
              "largest_working_set_mib": 378.5,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 47.0
                },
                {
                  "pid": 12432,
                  "working_set_mib": 378.5
                },
                {
                  "pid": 24004,
                  "working_set_mib": 5.7
                },
                {
                  "pid": 24532,
                  "working_set_mib": 6.5
                },
                {
                  "pid": 25080,
                  "working_set_mib": 57.6
                },
                {
                  "pid": 25588,
                  "working_set_mib": 1.8
                },
                {
                  "pid": 26380,
                  "working_set_mib": 122.1
                },
                {
                  "pid": 28196,
                  "working_set_mib": 6.5
                },
                {
                  "pid": 29432,
                  "working_set_mib": 0.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 2.6
                }
              ]
            }
          },
          "after": {
            "captured_at": "2026-09-29T23:21:15.239-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4127.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 87.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 51073.0,
              "used_mib": 13884.4,
              "used_percent": 21
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 936.7,
              "largest_working_set_mib": 668.7,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 57.8
                },
                {
                  "pid": 12432,
                  "working_set_mib": 668.7
                },
                {
                  "pid": 24004,
                  "working_set_mib": 5.7
                },
                {
                  "pid": 24532,
                  "working_set_mib": 6.5
                },
                {
                  "pid": 25080,
                  "working_set_mib": 57.6
                },
                {
                  "pid": 25588,
                  "working_set_mib": 1.8
                },
                {
                  "pid": 26380,
                  "working_set_mib": 129.5
                },
                {
                  "pid": 28196,
                  "working_set_mib": 6.5
                },
                {
                  "pid": 29432,
                  "working_set_mib": 0.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 2.6
                }
              ]
            }
          },
          "gpu_samples": 9,
          "gpu_peak_used_mib": 4161.0
        },
        "result": {
          "finish_reason": "stop",
          "json_parsed": true,
          "json_object_count": 15,
          "schema_ok": true,
          "schema_detail": "15 objects with the required fields"
        },
        "lmstudio_stats": {
          "input_tokens": 7021,
          "total_output_tokens": 867,
          "reasoning_output_tokens": 0,
          "tokens_per_second": 207.63284191165903,
          "time_to_first_token_seconds": 0.544
        },
        "insights": [
          "The prompt used 7021 of 8192 loaded context tokens (86%).",
          "Time to first token was 0.544s, about 12906 input tokens/second of prompt processing.",
          "Generation speed was 207.6 tokens/second across 867 output tokens.",
          "Wall clock for the whole request was 4.758s (182.2 output tokens per wall-clock second, including prompt processing).",
          "GPU memory after the run was 4127 of 24463 MiB on NVIDIA GeForce RTX 5090 Laptop GPU.",
          "Peak GPU memory sampled during the request was 4161 MiB.",
          "The model was already loaded, so this run has no model-load time."
        ]
      }
    },
    {
      "id": "2026-09-29_221750-308_json_gistfile1_readerlm-v2_cleaned",
      "folder": "2026-09-29_221750-308_json_gistfile1_readerlm-v2_cleaned",
      "file": "2026-09-29_221750-308_gistfile1_performance.json",
      "relative_path": "output/2026-09-29_221750-308_json_gistfile1_readerlm-v2_cleaned/2026-09-29_221750-308_gistfile1_performance.json",
      "report": {
        "timing": {
          "started_at": "2026-09-29T22:17:50.572-04:00",
          "finished_at": "2026-09-29T22:17:54.782-04:00"
        },
        "model": {
          "id": "readerlm-v2",
          "publisher": "mradermacher",
          "architecture": "qwen2",
          "quantization": "Q6_K",
          "state": "loaded",
          "loaded_context_length": 8192,
          "max_context_length": 512768
        },
        "request": {
          "endpoint": "/api/v1/chat",
          "temperature": 0.0,
          "repeat_penalty": 1.08,
          "max_tokens": 2048,
          "prompt_characters": 18821
        },
        "tokens": {
          "input_tokens": 6984,
          "output_tokens": 863,
          "reasoning_output_tokens": 0,
          "total_tokens": 7847
        },
        "speed": {
          "tokens_per_second": 207.11,
          "time_to_first_token_seconds": 0.022,
          "model_load_time_seconds": null,
          "wall_clock_seconds": 4.21,
          "output_tokens_per_wall_second": 204.99
        },
        "memory": {
          "before": {
            "captured_at": "2026-09-29T22:17:50.328-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4317.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 3.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 48826.2,
              "used_mib": 16131.1,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3070.8,
              "largest_working_set_mib": 1898.6,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 262.3
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1898.6
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 197.6
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "after": {
            "captured_at": "2026-09-29T22:17:54.783-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4313.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 90.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 48856.1,
              "used_mib": 16101.2,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3072.1,
              "largest_working_set_mib": 1898.8,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 262.8
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1898.8
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 198.2
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "gpu_samples": 8,
          "gpu_peak_used_mib": 4317.0
        },
        "result": {
          "finish_reason": "stop",
          "json_parsed": true,
          "json_object_count": 15,
          "schema_ok": true,
          "schema_detail": "15 objects with the required fields"
        },
        "lmstudio_stats": {
          "input_tokens": 6984,
          "total_output_tokens": 863,
          "reasoning_output_tokens": 0,
          "tokens_per_second": 207.1141676650386,
          "time_to_first_token_seconds": 0.022
        },
        "insights": [
          "The prompt used 6984 of 8192 loaded context tokens (85%).",
          "Time to first token was 0.022s. For 6984 input tokens that is about 317455 tokens/second, which is only plausible if LM Studio reused a cached prompt. Treat it as a cache hit, not a cold prompt-processing rate.",
          "Generation speed was 207.1 tokens/second across 863 output tokens.",
          "Wall clock for the whole request was 4.210s (205.0 output tokens per wall-clock second, including prompt processing).",
          "GPU memory after the run was 4313 of 24463 MiB on NVIDIA GeForce RTX 5090 Laptop GPU.",
          "Peak GPU memory sampled during the request was 4317 MiB.",
          "The model was already loaded, so this run has no model-load time."
        ]
      }
    },
    {
      "id": "2026-09-29_221743-804_json_gistfile1_readerlm-v2_cleaned",
      "folder": "2026-09-29_221743-804_json_gistfile1_readerlm-v2_cleaned",
      "file": "2026-09-29_221743-804_gistfile1_performance.json",
      "relative_path": "output/2026-09-29_221743-804_json_gistfile1_readerlm-v2_cleaned/2026-09-29_221743-804_gistfile1_performance.json",
      "report": {
        "timing": {
          "started_at": "2026-09-29T22:17:44.098-04:00",
          "finished_at": "2026-09-29T22:17:48.192-04:00"
        },
        "model": {
          "id": "readerlm-v2",
          "publisher": "mradermacher",
          "architecture": "qwen2",
          "quantization": "Q6_K",
          "state": "loaded",
          "loaded_context_length": 8192,
          "max_context_length": 512768
        },
        "request": {
          "endpoint": "/api/v1/chat",
          "temperature": 0.0,
          "repeat_penalty": 1.08,
          "max_tokens": 2048,
          "prompt_characters": 18821
        },
        "tokens": {
          "input_tokens": 6984,
          "output_tokens": 863,
          "reasoning_output_tokens": 0,
          "total_tokens": 7847
        },
        "speed": {
          "tokens_per_second": 213.44,
          "time_to_first_token_seconds": 0.038,
          "model_load_time_seconds": null,
          "wall_clock_seconds": 4.094,
          "output_tokens_per_wall_second": 210.81
        },
        "memory": {
          "before": {
            "captured_at": "2026-09-29T22:17:43.849-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4311.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 4.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 48808.2,
              "used_mib": 16149.1,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3069.6,
              "largest_working_set_mib": 1898.5,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 261.6
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1898.5
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 197.2
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "after": {
            "captured_at": "2026-09-29T22:17:48.192-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4324.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 90.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 48858.3,
              "used_mib": 16099.1,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3072.1,
              "largest_working_set_mib": 1898.7,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 263.5
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1898.7
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 197.6
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "gpu_samples": 8,
          "gpu_peak_used_mib": 4328.0
        },
        "result": {
          "finish_reason": "stop",
          "json_parsed": true,
          "json_object_count": 15,
          "schema_ok": true,
          "schema_detail": "15 objects with the required fields"
        },
        "lmstudio_stats": {
          "input_tokens": 6984,
          "total_output_tokens": 863,
          "reasoning_output_tokens": 0,
          "tokens_per_second": 213.4383558865705,
          "time_to_first_token_seconds": 0.038
        },
        "insights": [
          "The prompt used 6984 of 8192 loaded context tokens (85%).",
          "Time to first token was 0.038s. For 6984 input tokens that is about 183789 tokens/second, which is only plausible if LM Studio reused a cached prompt. Treat it as a cache hit, not a cold prompt-processing rate.",
          "Generation speed was 213.4 tokens/second across 863 output tokens.",
          "Wall clock for the whole request was 4.094s (210.8 output tokens per wall-clock second, including prompt processing).",
          "GPU memory after the run was 4324 of 24463 MiB on NVIDIA GeForce RTX 5090 Laptop GPU.",
          "Peak GPU memory sampled during the request was 4328 MiB.",
          "The model was already loaded, so this run has no model-load time."
        ]
      }
    },
    {
      "id": "2026-09-29_221353-472_json_gistfile1_readerlm-v2_cleaned",
      "folder": "2026-09-29_221353-472_json_gistfile1_readerlm-v2_cleaned",
      "file": "2026-09-29_221353-472_gistfile1_performance.json",
      "relative_path": "output/2026-09-29_221353-472_json_gistfile1_readerlm-v2_cleaned/2026-09-29_221353-472_gistfile1_performance.json",
      "report": {
        "timing": {
          "started_at": "2026-09-29T22:13:53.777-04:00",
          "finished_at": "2026-09-29T22:13:57.794-04:00"
        },
        "model": {
          "id": "readerlm-v2",
          "publisher": "mradermacher",
          "architecture": "qwen2",
          "quantization": "Q6_K",
          "state": "loaded",
          "loaded_context_length": 8192,
          "max_context_length": 512768
        },
        "request": {
          "endpoint": "/api/v1/chat",
          "temperature": 0.0,
          "repeat_penalty": 1.08,
          "max_tokens": 2048,
          "prompt_characters": 18821
        },
        "tokens": {
          "input_tokens": 6984,
          "output_tokens": 863,
          "reasoning_output_tokens": 0,
          "total_tokens": 7847
        },
        "speed": {
          "tokens_per_second": 216.67,
          "time_to_first_token_seconds": 0.033,
          "model_load_time_seconds": null,
          "wall_clock_seconds": 4.017,
          "output_tokens_per_wall_second": 214.86
        },
        "memory": {
          "before": {
            "captured_at": "2026-09-29T22:13:53.524-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4288.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 3.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 48966.8,
              "used_mib": 15990.6,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3067.8,
              "largest_working_set_mib": 1898.2,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 261.4
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1898.2
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 195.9
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "after": {
            "captured_at": "2026-09-29T22:13:57.794-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4287.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 88.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 48968.2,
              "used_mib": 15989.1,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3071.3,
              "largest_working_set_mib": 1898.8,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 263.0
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1898.8
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 197.2
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "gpu_samples": 8,
          "gpu_peak_used_mib": 4306.0
        },
        "result": {
          "finish_reason": "stop",
          "json_parsed": true,
          "json_object_count": 15,
          "schema_ok": true,
          "schema_detail": "15 objects with the required fields"
        },
        "lmstudio_stats": {
          "input_tokens": 6984,
          "total_output_tokens": 863,
          "reasoning_output_tokens": 0,
          "tokens_per_second": 216.66769602652033,
          "time_to_first_token_seconds": 0.033
        },
        "insights": [
          "The prompt used 6984 of 8192 loaded context tokens (85%).",
          "Time to first token was 0.033s. For 6984 input tokens that is about 211636 tokens/second, which is only plausible if LM Studio reused a cached prompt. Treat it as a cache hit, not a cold prompt-processing rate.",
          "Generation speed was 216.7 tokens/second across 863 output tokens.",
          "Wall clock for the whole request was 4.017s (214.8 output tokens per wall-clock second, including prompt processing).",
          "GPU memory after the run was 4287 of 24463 MiB on NVIDIA GeForce RTX 5090 Laptop GPU.",
          "Peak GPU memory sampled during the request was 4306 MiB.",
          "The model was already loaded, so this run has no model-load time."
        ]
      }
    },
    {
      "id": "2026-09-29_221343-620_json_gistfile1_readerlm-v2_cleaned",
      "folder": "2026-09-29_221343-620_json_gistfile1_readerlm-v2_cleaned",
      "file": "2026-09-29_221343-620_gistfile1_performance.json",
      "relative_path": "output/2026-09-29_221343-620_json_gistfile1_readerlm-v2_cleaned/2026-09-29_221343-620_gistfile1_performance.json",
      "report": {
        "timing": {
          "started_at": "2026-09-29T22:13:43.896-04:00",
          "finished_at": "2026-09-29T22:13:47.873-04:00"
        },
        "model": {
          "id": "readerlm-v2",
          "publisher": "mradermacher",
          "architecture": "qwen2",
          "quantization": "Q6_K",
          "state": "loaded",
          "loaded_context_length": 8192,
          "max_context_length": 512768
        },
        "request": {
          "endpoint": "/api/v1/chat",
          "temperature": 0.0,
          "repeat_penalty": 1.08,
          "max_tokens": 2048,
          "prompt_characters": 18821
        },
        "tokens": {
          "input_tokens": 6984,
          "output_tokens": 863,
          "reasoning_output_tokens": 0,
          "total_tokens": 7847
        },
        "speed": {
          "tokens_per_second": 219.78,
          "time_to_first_token_seconds": 0.037,
          "model_load_time_seconds": null,
          "wall_clock_seconds": 3.977,
          "output_tokens_per_wall_second": 217.02
        },
        "memory": {
          "before": {
            "captured_at": "2026-09-29T22:13:43.641-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4278.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 4.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 49026.2,
              "used_mib": 15931.2,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3062.1,
              "largest_working_set_mib": 1896.9,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 261.2
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1896.9
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 191.7
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "after": {
            "captured_at": "2026-09-29T22:13:47.878-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4310.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 88.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 49014.8,
              "used_mib": 15942.6,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3069.4,
              "largest_working_set_mib": 1898.4,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 263.1
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1898.4
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 195.6
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "gpu_samples": 8,
          "gpu_peak_used_mib": 4310.0
        },
        "result": {
          "finish_reason": "stop",
          "json_parsed": true,
          "json_object_count": 15,
          "schema_ok": true,
          "schema_detail": "15 objects with the required fields"
        },
        "lmstudio_stats": {
          "input_tokens": 6984,
          "total_output_tokens": 863,
          "reasoning_output_tokens": 0,
          "tokens_per_second": 219.77837273851745,
          "time_to_first_token_seconds": 0.037
        },
        "insights": [
          "The prompt used 6984 of 8192 loaded context tokens (85%).",
          "Time to first token was 0.037s. For 6984 input tokens that is about 188757 tokens/second, which is only plausible if LM Studio reused a cached prompt. Treat it as a cache hit, not a cold prompt-processing rate.",
          "Generation speed was 219.8 tokens/second across 863 output tokens.",
          "Wall clock for the whole request was 3.977s (217.0 output tokens per wall-clock second, including prompt processing).",
          "GPU memory after the run was 4310 of 24463 MiB on NVIDIA GeForce RTX 5090 Laptop GPU.",
          "Peak GPU memory sampled during the request was 4310 MiB.",
          "The model was already loaded, so this run has no model-load time."
        ]
      }
    },
    {
      "id": "2026-09-29_220922-169_json_gistfile1_readerlm-v2_cleaned",
      "folder": "2026-09-29_220922-169_json_gistfile1_readerlm-v2_cleaned",
      "file": "2026-09-29_220922-169_gistfile1_performance.json",
      "relative_path": "output/2026-09-29_220922-169_json_gistfile1_readerlm-v2_cleaned/2026-09-29_220922-169_gistfile1_performance.json",
      "report": {
        "timing": {
          "started_at": "2026-09-29T22:09:22.677-04:00",
          "finished_at": "2026-09-29T22:09:26.835-04:00"
        },
        "model": {
          "id": "readerlm-v2",
          "publisher": "mradermacher",
          "architecture": "qwen2",
          "quantization": "Q6_K",
          "state": "loaded",
          "loaded_context_length": 8192,
          "max_context_length": 512768
        },
        "request": {
          "endpoint": "/api/v1/chat",
          "temperature": 0.0,
          "repeat_penalty": 1.08,
          "max_tokens": 2048,
          "prompt_characters": 18821
        },
        "tokens": {
          "input_tokens": 6984,
          "output_tokens": 863,
          "reasoning_output_tokens": 0,
          "total_tokens": 7847
        },
        "speed": {
          "tokens_per_second": 211.74,
          "time_to_first_token_seconds": 0.053,
          "model_load_time_seconds": null,
          "wall_clock_seconds": 4.159,
          "output_tokens_per_wall_second": 207.52
        },
        "memory": {
          "before": {
            "captured_at": "2026-09-29T22:09:22.204-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4313.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 4.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 48618.5,
              "used_mib": 16338.8,
              "used_percent": 25
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3286.7,
              "largest_working_set_mib": 2109.2,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 261.4
                },
                {
                  "pid": 12432,
                  "working_set_mib": 2109.2
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 203.8
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "after": {
            "captured_at": "2026-09-29T22:09:26.835-04:00",
            "gpu": {
              "gpus": [
                {
                  "name": "NVIDIA GeForce RTX 5090 Laptop GPU",
                  "memory_used_mib": 4312.0,
                  "memory_total_mib": 24463.0,
                  "utilization_percent": 89.0
                }
              ]
            },
            "system_ram": {
              "total_mib": 64957.4,
              "available_mib": 48819.0,
              "used_mib": 16138.3,
              "used_percent": 24
            },
            "lm_studio_processes": {
              "process_count": 10,
              "working_set_sum_mib": 3080.8,
              "largest_working_set_mib": 1897.0,
              "processes": [
                {
                  "pid": 2976,
                  "working_set_mib": 264.2
                },
                {
                  "pid": 12432,
                  "working_set_mib": 1897.0
                },
                {
                  "pid": 24004,
                  "working_set_mib": 216.4
                },
                {
                  "pid": 24532,
                  "working_set_mib": 114.9
                },
                {
                  "pid": 25080,
                  "working_set_mib": 138.7
                },
                {
                  "pid": 25588,
                  "working_set_mib": 51.3
                },
                {
                  "pid": 26380,
                  "working_set_mib": 207.3
                },
                {
                  "pid": 28196,
                  "working_set_mib": 89.4
                },
                {
                  "pid": 29432,
                  "working_set_mib": 35.0
                },
                {
                  "pid": 33240,
                  "working_set_mib": 66.6
                }
              ]
            }
          },
          "gpu_samples": 8,
          "gpu_peak_used_mib": 4313.0
        },
        "result": {
          "finish_reason": "stop",
          "json_parsed": true,
          "json_object_count": 15,
          "schema_ok": true,
          "schema_detail": "15 objects with the required fields"
        },
        "lmstudio_stats": {
          "input_tokens": 6984,
          "total_output_tokens": 863,
          "reasoning_output_tokens": 0,
          "tokens_per_second": 211.74043027716402,
          "time_to_first_token_seconds": 0.053
        },
        "insights": [
          "The prompt used 6984 of 8192 loaded context tokens (85%).",
          "Time to first token was 0.053s. For 6984 input tokens that is about 131774 tokens/second, which is only plausible if LM Studio reused a cached prompt. Treat it as a cache hit, not a cold prompt-processing rate.",
          "Generation speed was 211.7 tokens/second across 863 output tokens.",
          "Wall clock for the whole request was 4.159s (207.5 output tokens per wall-clock second, including prompt processing).",
          "GPU memory after the run was 4312 of 24463 MiB on NVIDIA GeForce RTX 5090 Laptop GPU.",
          "Peak GPU memory sampled during the request was 4313 MiB.",
          "The model was already loaded, so this run has no model-load time."
        ]
      }
    }
  ]
};
