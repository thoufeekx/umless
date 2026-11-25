// Argument parsing for the CLI (cli/umless.ts), kept here so it can be unit-tested.

export type CliArgs = { input?: string; output?: string; score: boolean };

/** Parse `umless <file> [--score] [-o|--output <path>]`. Flags may come before or after the file. */
export function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = { score: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--score") args.score = true;
    else if (a === "-o" || a === "--output") {
      const v = argv[++i];
      if (!v || v.startsWith("-")) throw new Error(`${a} needs a path, e.g. ${a} clean/take3.mp4`);
      args.output = v;
    } else if (a.startsWith("--output=")) {
      args.output = a.slice("--output=".length);
      if (!args.output) throw new Error("--output needs a path, e.g. --output=clean/take3.mp4");
    } else if (args.input === undefined) args.input = a;
  }
  return args;
}
