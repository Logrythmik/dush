import {
  OpenAIApi,
  Configuration
} from "https://esm.sh/openai@3.2.1"

export type GPTResult = { valid: boolean, message: string, script: string, explanation: string }

/**
 * Convert the text to a shell command
 * @param text  The text to convert to a shell command
 * @param apiKey  The OpenAI API key
 * @param verbose  If true, print the response from the API
 * @returns The result of the conversion
 */
export async function handle(text: string, apiKey: string, verbose = false): Promise<GPTResult> {
  const prompt = `I want you to act like a bash expert and convert the requested functionality into a one-line shell command.
  The text to convert will be surrounded by curly braces, like this: {text}.

  {${text}}

  Please follow these rules:
  - If the text doesn't translate to a valid command, seems dangerous, or isn't relevant to a shell command, return valid: false and state the problem in the message property.
  - The command used in should be compatible for os: ${Deno.build.os}.
  - The response should be JSON formatted text.
  - The command property should be a single-line shell script that is concise as possible.
  - The script should use the following commands: ${Deno.build.os === "windows" ? "dir, cd, del, echo, exit, mkdir, move, rmdir, type" : "ls, cd, rm, echo, exit, mkdir, mv, rmdir, cat"}.

  Return your results as JSON with these properties:
  - valid: if the request can be converted to a safe shell command
  - message: if valid is false, explain why
  - script: single-line shell script
  - explanation: explain the script

  Example result output:

  {
    "valid": true,
    "message": "",
    "script": "ls -l",
    "explanation": "list files in long format"
  }

  `
  const api = new OpenAIApi(
    new Configuration({
      apiKey
    }))

  const { data, status } = await api.createChatCompletion(
    {
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0,
      max_tokens: 100,
      top_p: 1.0,
      frequency_penalty: 0.2,
      presence_penalty: 0.0,
    })

  if (status !== 200)
    return { valid: false, message: `Error: ${data}`, script: '', explanation: '' }
  if (verbose)
    console.dir(data)
  return JSON.parse(data.choices[0].message?.content || '') as GPTResult
}
