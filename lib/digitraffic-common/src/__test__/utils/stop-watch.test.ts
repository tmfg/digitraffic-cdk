import { expect } from "@jest/globals";
import { StopWatch } from "../../utils/stop-watch.js";

describe("stop-watch.test.ts", () => {
  test("StopWatch start-stop", async () => {
    const sw = new StopWatch().start();
    await sleepMs(100);
    sw.stop();
    expect(sw.getDuration()).toBeGreaterThanOrEqual(95);
    expect(sw.getDuration()).toBeLessThan(150);

    sw.logTasks("StopWatchTest.stopWatch");
  });

  test("StopWatch with tasks start-stop", async () => {
    const sw = StopWatch.createStarted();
    sw.start("task1");
    await sleepMs(50);
    sw.stop("task1").start("task2");
    await sleepMs(100);
    sw.stop("task2").stop();

    // total duration should be ~150ms
    expect(sw.getDuration()).toBeGreaterThanOrEqual(145);
    expect(sw.getDuration()).toBeLessThan(160);
    // individual tasks
    expect(sw.getDuration("task1")).toBeGreaterThanOrEqual(45);
    expect(sw.getDuration("task1")).toBeLessThan(60);
    expect(sw.getDuration("task2")).toBeGreaterThanOrEqual(95);
    expect(sw.getDuration("task2")).toBeLessThan(110);

    sw.logTasks("StopWatchTest.tasks");
  });

  test("StopWatch task with periods", async () => {
    const sw = StopWatch.createStarted();
    // period 1
    sw.start("task1");
    expect(sw.getTask("task1")?.isRunning).toEqual(true);
    expect(sw.getTask("task1")?.periods.length).toEqual(1);
    await sleepMs(50);
    // period 2
    sw.start("task1");
    expect(sw.getTask("task1")?.isRunning).toEqual(true);
    expect(sw.getTask("task1")?.periods.length).toEqual(2);
    await sleepMs(100);
    sw.stop("task1");

    expect(sw.getTask("task1")?.isRunning).toEqual(false);
    expect(sw.getTask("task1")?.periods.length).toEqual(2);
    expect(sw.getTask("task1")?.periods[0]?.duration).toBeGreaterThanOrEqual(
      45,
    );
    expect(sw.getTask("task1")?.periods[0]?.duration).toBeLessThan(60);
    expect(sw.getTask("task1")?.periods[1]?.duration).toBeGreaterThanOrEqual(
      95,
    );
    expect(sw.getTask("task1")?.periods[1]?.duration).toBeLessThan(110);

    expect(sw.getTask("task1")?.totalDuration).toBeGreaterThanOrEqual(145);
    expect(sw.getTask("task1")?.totalDuration).toBeLessThan(160);
    expect(sw.getDuration("task1")).toEqual(sw.getTask("task1")?.totalDuration);

    sw.logTasks("StopWatchTest.periods");
  });

  test("StopWatch task with periods", async () => {
    const sw = StopWatch.createStarted();
    // period 1
    sw.start("task1");
    expect(sw.getTask("task1")?.isRunning).toEqual(true);
    expect(sw.getTask("task1")?.periods.length).toEqual(1);
    await sleepMs(50);
    // period 2
    sw.start("task1");
    expect(sw.getTask("task1")?.isRunning).toEqual(true);
    expect(sw.getTask("task1")?.periods.length).toEqual(2);
    await sleepMs(100);
    sw.stop("task1");

    expect(sw.getTask("task1")?.isRunning).toEqual(false);
    expect(sw.getTask("task1")?.periods.length).toEqual(2);
    expect(sw.getTask("task1")?.periods[0]?.duration).toBeGreaterThanOrEqual(
      45,
    );
    expect(sw.getTask("task1")?.periods[0]?.duration).toBeLessThan(60);
    expect(sw.getTask("task1")?.periods[1]?.duration).toBeGreaterThanOrEqual(
      95,
    );
    expect(sw.getTask("task1")?.periods[1]?.duration).toBeLessThan(110);

    expect(sw.getTask("task1")?.totalDuration).toBeGreaterThanOrEqual(145);
    expect(sw.getTask("task1")?.totalDuration).toBeLessThan(160);
    expect(sw.getDuration("task1")).toEqual(sw.getTask("task1")?.totalDuration);

    sw.logTasks("StopWatchTest.periods");
  });

  test("StopWatch task not stopped", async () => {
    const sw = StopWatch.createStarted();
    await sleepMs(50);
    // period 1
    sw.start("task1");
    await sleepMs(50);

    expect(sw.getTask("task1")?.isRunning).toEqual(true);
    expect(sw.getDuration()).toBeGreaterThanOrEqual(95);
    expect(sw.getDuration()).toBeLessThan(110);
    expect(sw.getDuration("task1")).toBeGreaterThanOrEqual(45);
    expect(sw.getDuration("task1")).toBeLessThan(55);

    sw.logTasks("StopWatchTest.notStopped");
  });

  test("StopWatch reset", async () => {
    const sw = StopWatch.createStarted();
    await sleepMs(50);
    // period 1
    sw.start("task1");
    sw.start("task2");
    await sleepMs(50);

    // reset tassk2 should not affect task1
    sw.reset("task2");
    expect(sw.getTask("task2")).toBeUndefined();
    expect(sw.getTask("task1")?.isRunning).toEqual(true);
    expect(sw.getDuration()).toBeGreaterThanOrEqual(95);
    expect(sw.getDuration()).toBeLessThan(110);
    expect(sw.getDuration("task1")).toBeGreaterThanOrEqual(45);
    expect(sw.getDuration("task1")).toBeLessThan(55);

    // Reset only task1
    sw.reset("task1");
    expect(sw.getTask("task1")).toBeUndefined();
    expect(sw.getDuration()).toBeGreaterThanOrEqual(95);
    expect(sw.getDuration()).toBeLessThan(110);

    // Reset also default task
    sw.reset();
    expect(sw.getDuration()).toEqual(0);
  });
});

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
