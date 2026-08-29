#include "edge_runtime_bridge.h"

#include <string>

int classsync_runtime_should_use_edge(float total_ram_gb, int has_npu, const char* architecture) {
  if (total_ram_gb < 3.0f) {
    return 0;
  }

  if (architecture != nullptr && (std::string(architecture) == "arm64-v8a" || std::string(architecture) == "ios-metal")) {
    return 1;
  }

  return has_npu == 1 ? 1 : 0;
}

int classsync_runtime_use_heuristic(float total_ram_gb, int has_npu, const char* architecture) {
  return (total_ram_gb < 3.0f) || (has_npu == 0 && architecture != nullptr && std::string(architecture) == "armeabi-v7a");
}

const char* classsync_runtime_route_label(float total_ram_gb, int has_npu, const char* architecture) {
  if (classsync_runtime_should_use_edge(total_ram_gb, has_npu, architecture)) {
    return "edge_runtime";
  }
  return "heuristic_fallback";
}
