#pragma once

#ifdef __cplusplus
extern "C" {
#endif

struct DeviceInfo {
  float total_ram_gb;
  int has_npu;
  const char* architecture;
};

struct ModelSpec {
  const char* model_name;
  long long size_bytes;
  float target_tokens_per_second;
  const char* format;
  const char* quantization;
};

int classsync_runtime_should_use_edge(float total_ram_gb, int has_npu, const char* architecture);
int classsync_runtime_use_heuristic(float total_ram_gb, int has_npu, const char* architecture);
const char* classsync_runtime_route_label(float total_ram_gb, int has_npu, const char* architecture);

#ifdef __cplusplus
}
#endif
