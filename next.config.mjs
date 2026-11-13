/** @type {import('next').NextConfig} */
const nextConfig = {
  // Let phones on the local network load the dev server (testing on a real
  // device). Without this Next blocks its dev resources and the page never
  // becomes interactive there. Dev only — has no effect on production builds.
  allowedDevOrigins: ['192.168.55.50', '192.168.*.*'],
};

export default nextConfig;
