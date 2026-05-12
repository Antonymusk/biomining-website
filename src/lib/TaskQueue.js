/**
 * Non-blocking client-side Task Queue for background calculations, bulk exports, or heavy computation.
 */
class TaskQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.queue = [];
    this.running = 0;
  }

  /**
   * Add a new computational task to the background queue
   * @param {string} name - Name of the task
   * @param {function} fn - The asynchronous function containing the task logic
   * @param {function} callback - Completion callback
   */
  push(name, fn, callback) {
    this.queue.push({ name, fn, callback });
    this.processNext();
  }

  async processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { name, fn, callback } = this.queue.shift();
    this.running++;
    console.log(`[TaskQueue] Executing background task: ${name}`);

    try {
      // Execute the task asynchronously in the background
      const result = await fn();
      if (callback) callback(null, result);
    } catch (error) {
      console.error(`[TaskQueue] Error in background task ${name}:`, error);
      if (callback) callback(error);
    } finally {
      this.running--;
      this.processNext();
    }
  }
}

export const taskQueue = new TaskQueue();
