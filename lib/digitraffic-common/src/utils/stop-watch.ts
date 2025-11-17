import type {
  DtLogger,
  LoggableType,
  LoggerMethodType,
} from "../aws/runtime/dt-logger.js";
import { logger } from "../aws/runtime/dt-logger-default.js";

export interface TaskPeriod {
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface TaskRecord {
  taskName: string;
  periods: TaskPeriod[];
  totalDuration: number;
  isRunning: boolean;
}
// Deep readonly type for returning
export type ReadonlyTaskRecord = Readonly<{
  taskName: string;
  periods: ReadonlyArray<Readonly<TaskPeriod>>;
  totalDuration: number;
  isRunning: boolean;
}>;

export class StopWatch {
  private tasks: Map<string, TaskRecord> = new Map();
  private static readonly DEFAULT_TASK_NAME: string = "DEFAULT_INTERNAL_TASK";

  static createStarted(
    taskName: string = StopWatch.DEFAULT_TASK_NAME,
  ): StopWatch {
    const sw = new StopWatch();
    sw.start(taskName);
    return sw;
  }

  getDuration(taskName: string = StopWatch.DEFAULT_TASK_NAME): number {
    const task = this.getTask(taskName);
    if (!task) {
      return 0;
    }
    let duration = task.totalDuration;

    if (task.isRunning) {
      // If the task is running, last period is ongoing
      const currentPeriod = task.periods[task.periods.length - 1];
      if (currentPeriod) {
        duration += Date.now() - currentPeriod.startTime;
      }
    }
    return duration;
  }

  start(taskName: string = StopWatch.DEFAULT_TASK_NAME): this {
    const now = Date.now();
    let task = this.tasks.get(taskName);

    if (!task) {
      // create a new one
      task = {
        taskName,
        periods: [],
        totalDuration: 0,
        isRunning: false,
      };
      this.tasks.set(taskName, task);
    }

    // if already running, stop it and start new
    if (task.isRunning) {
      this.stop(taskName);
    }

    // start a new period
    task.periods.push({ startTime: now });
    task.isRunning = true;
    return this;
  }

  stop(taskName: string = StopWatch.DEFAULT_TASK_NAME): this {
    const now = Date.now();
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new Error(`Task "${taskName}" not found`);
    }
    if (!task.isRunning) {
      return this; // nothing to stop
    }

    const currentPeriod = task.periods[task.periods.length - 1];
    if (!currentPeriod || currentPeriod.endTime) {
      throw new Error(`Task "${taskName}" is not currently running`);
    }

    currentPeriod.endTime = now;
    currentPeriod.duration = now - currentPeriod.startTime;
    task.totalDuration += currentPeriod.duration;
    task.isRunning = false;
    return this;
  }

  /**
   * If task is runing, records does not include duration of current period.
   * @param taskName
   */
  getTask(taskName: string): ReadonlyTaskRecord | undefined {
    return this.tasks.get(taskName);
  }

  /**
   * If task is runing, records does not include duration of current period.
   */
  getTasks(): ReadonlyTaskRecord[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.taskName !== StopWatch.DEFAULT_TASK_NAME,
    );
  }

  /**
   * Removes one or all tasks.
   * @param taskName if given resets only that task otherwise clears all.
   */
  reset(taskName?: string): this {
    if (taskName) {
      this.tasks.delete(taskName);
    } else {
      this.tasks.clear();
    }
    return this;
  }

  /**
   * Logs all tasks and their durations. If their is also default task, logs that too with <code>task: method</code>.
   * @param method
   * @param level
   */
  logTasks(
    method: LoggerMethodType,
    level: keyof Pick<DtLogger, "debug" | "info" | "warn" | "error"> = "info",
  ): void {
    for (const task of this.getTasks()) {
      logger[level]({
        method,
        customTask: task.taskName,
        tookMs: this.getDuration(task.taskName),
      } satisfies LoggableType);
    }
    if (this.getTask(StopWatch.DEFAULT_TASK_NAME)) {
      logger[level]({
        method,
        customTask: method,
        tookMs: this.getDuration(StopWatch.DEFAULT_TASK_NAME),
      } satisfies LoggableType);
    }
  }
}
