export class SchedulerService {
  shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const randomBuffer = new Uint32Array(1);
      const hasCrypto =
        typeof crypto !== 'undefined' &&
        typeof crypto.getRandomValues !== 'undefined';
      if (hasCrypto) {
        crypto.getRandomValues(randomBuffer);
        const j = Math.floor((randomBuffer[0] / 0xffffffff) * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      } else {
        const seed = Date.now() + i;
        const j = Math.floor(Math.abs(Math.sin(seed)) * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    return arr;
  }
}
