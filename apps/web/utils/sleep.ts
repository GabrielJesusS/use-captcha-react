/**
 *
 * @param time in seconds
 * @returns
 */
export async function sleep(time: number) {
  return await new Promise((resolve) => {
    setTimeout(resolve, time * 1000);
  });
}
