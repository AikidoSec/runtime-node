module.exports = async function measureFunctionPerformance(
  func,
  warmupIterations = 100,
  measuredIterations = 1000
) {
  for (let i = 0; i < warmupIterations; i++) {
    await func();
  }

  const timings = [];
  for (let i = 0; i < measuredIterations; i++) {
    const start = performance.now();
    await func();
    const end = performance.now();
    timings.push(end - start);
  }

  return timings;
};
