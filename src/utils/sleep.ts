const sleep = async (ms: number) => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((r) => setTimeout(r, ms));
};
export default sleep;
