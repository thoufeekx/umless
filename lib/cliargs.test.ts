import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCliArgs } from "./cliargs";

test("input only keeps the default output", () => {
  assert.deepEqual(parseCliArgs(["demo.mp4"]), { input: "demo.mp4", score: false });
});

test("-o and --output set the output path, before or after the input", () => {
  assert.deepEqual(parseCliArgs(["raw/take3.mov", "-o", "clean/take3.mp4"]), {
    input: "raw/take3.mov", output: "clean/take3.mp4", score: false,
  });
  assert.equal(parseCliArgs(["--output", "/tmp/out/clean.mp4", "demo.mp4"]).output, "/tmp/out/clean.mp4");
  assert.equal(parseCliArgs(["demo.mp4", "--output=/tmp/x.m4a"]).output, "/tmp/x.m4a");
  assert.equal(parseCliArgs(["--output", "/tmp/out/clean.mp4", "demo.mp4"]).input, "demo.mp4");
});

test("--score still parses alongside -o", () => {
  assert.deepEqual(parseCliArgs(["demo.mp4", "--score", "-o", "x.mp4"]), {
    input: "demo.mp4", output: "x.mp4", score: true,
  });
});

test("a missing path is an error", () => {
  assert.throws(() => parseCliArgs(["demo.mp4", "-o"]), /-o needs a path/);
  assert.throws(() => parseCliArgs(["demo.mp4", "--output", "--score"]), /--output needs a path/);
  assert.throws(() => parseCliArgs(["demo.mp4", "--output="]), /--output needs a path/);
});
