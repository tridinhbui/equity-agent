/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Prevent bundling native ONNX runtime bindings
    config.resolve.alias["onnxruntime-node"] = false;
    
    // For onnxruntime-web, only use WASM files, not .node.js
    config.resolve.alias["onnxruntime-web/dist/ort-web.node.js"] = false;
    
    // Ensure .node files are ignored
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        "onnxruntime-node": "commonjs onnxruntime-node",
        "sharp": "commonjs sharp",
      });
    }
    
    return config;
  },
  // Disable experimental features that may cause issues
  experimental: {},
};

export default nextConfig;
