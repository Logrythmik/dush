#!/usr/bin/env -S deno run --allow-env --allow-net


import { parse } from "https://deno.land/std@0.189.0/flags/mod.ts";
import { load } from "https://deno.land/std@0.189.0/dotenv/mod.ts";
import { handle } from "./services/openai.ts";

await load({
  export: true,
  allowEmptyValues: true,
});


/**
 * Main entry point
 * @param args command line arguments
 */
async function main(args: string[]) {
  let { "--debug": verbose, _: params } = parse(args);

  const apiKey = Deno.env.get('OPENAI_ACCESS_TOKEN')
  if (!apiKey) {
    throw new Error("OPENAI_ACCESS_TOKEN environment variable is not set")
  }

  while (params.length === 0) {
    params = prompt("What do you want to do?")?.split(" ") || [];
  }

  const result = await handle(params.join(' '), apiKey, verbose);

  if (!result.valid) {
    console.log(`Error: ${result.message}`)
    Deno.exit(1)
  }

  console.log(`Command: ${result.script}`)
  console.log(`(${result.explanation})`)

  if (confirm("Run?")) {

    const command = new Deno.Command("bash", {
      args: ["-c", result.script],
      stdout: "piped",
      stderr: "piped",
      stdin: "piped",
    });

    const child = command.spawn();

    // open a file and pipe the subprocess output to it.
    child.stdout.pipeTo(
      Deno.stdout.writable,
    );

    const status = await child.status;

    Deno.exit(status.code);
  }

  Deno.exit(0)
}

main(Deno.args);
