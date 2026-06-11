#!/usr/bin/env python3
"""Printify store management agent powered by Claude."""

import json
import os
import sys

import anthropic
from dotenv import load_dotenv

from printify_tools import TOOL_DEFINITIONS, TOOL_FUNCTIONS

load_dotenv()

MODEL = "claude-opus-4-8"

SYSTEM_PROMPT = """You are a helpful Printify store management assistant. You help users manage their
print-on-demand store by interacting with the Printify API on their behalf.

You can help with:
- Listing and managing shops
- Browsing, creating, updating, and publishing products
- Managing orders (viewing, submitting, canceling)
- Exploring the Printify catalog (blueprints, variants, print providers)
- Managing uploaded artwork/images

When users ask questions, use the available tools to fetch real data from their Printify account.
Always confirm destructive actions (delete, cancel) with the user before proceeding.
Present data in a clear, readable format — use tables or bullet points where appropriate.
When you receive paginated results, let the user know there may be more pages available.
"""


def execute_tool(tool_name: str, tool_input: dict) -> str:
    func = TOOL_FUNCTIONS.get(tool_name)
    if not func:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})
    try:
        result = func(**tool_input)
        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


def run_agent_turn(client: anthropic.Anthropic, messages: list) -> str:
    """Run one turn of the agent loop, handling tool calls until Claude responds."""
    while True:
        response_text = ""
        input_tokens = 0
        output_tokens = 0
        stop_reason = None
        content_blocks = []

        with client.messages.stream(
            model=MODEL,
            max_tokens=8096,
            system=SYSTEM_PROMPT,
            tools=TOOL_DEFINITIONS,
            messages=messages,
            thinking={"type": "adaptive"},
        ) as stream:
            current_block_type = None
            current_block_id = None
            current_block_name = None
            current_block_input = ""

            for event in stream:
                event_type = type(event).__name__

                if event_type == "RawContentBlockStartEvent":
                    block = event.content_block
                    current_block_type = block.type
                    if block.type == "text":
                        current_block_id = None
                        current_block_name = None
                        current_block_input = ""
                    elif block.type == "tool_use":
                        current_block_id = block.id
                        current_block_name = block.name
                        current_block_input = ""
                        print(f"\n[Calling tool: {block.name}]", flush=True)
                    elif block.type == "thinking":
                        current_block_id = None
                        current_block_name = None
                        current_block_input = ""

                elif event_type == "RawContentBlockDeltaEvent":
                    delta = event.delta
                    delta_type = type(delta).__name__

                    if delta_type == "TextDeltaEvent" and current_block_type == "text":
                        print(delta.text, end="", flush=True)
                        response_text += delta.text
                    elif delta_type == "InputJSONDeltaEvent" and current_block_type == "tool_use":
                        current_block_input += delta.partial_json

                elif event_type == "RawContentBlockStopEvent":
                    if current_block_type == "tool_use":
                        try:
                            parsed_input = json.loads(current_block_input) if current_block_input else {}
                        except json.JSONDecodeError:
                            parsed_input = {}
                        content_blocks.append({
                            "type": "tool_use",
                            "id": current_block_id,
                            "name": current_block_name,
                            "input": parsed_input,
                        })
                    elif current_block_type == "text" and response_text:
                        content_blocks.append({"type": "text", "text": response_text})

                elif event_type == "RawMessageDeltaEvent":
                    stop_reason = event.delta.stop_reason

                elif event_type == "RawMessageStopEvent":
                    final = stream.get_final_message()
                    input_tokens = final.usage.input_tokens
                    output_tokens = final.usage.output_tokens

        tool_uses = [b for b in content_blocks if b["type"] == "tool_use"]

        if not tool_uses or stop_reason == "end_turn":
            if response_text:
                print()
            return response_text

        # Add assistant message with all content blocks
        messages.append({"role": "assistant", "content": content_blocks})

        # Execute all tool calls and collect results
        tool_results = []
        for tool_use in tool_uses:
            print(f"[Executing: {tool_use['name']}({json.dumps(tool_use['input'])})]", flush=True)
            result = execute_tool(tool_use["name"], tool_use["input"])
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_use["id"],
                "content": result,
            })

        messages.append({"role": "user", "content": tool_results})


def main():
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    printify_key = os.environ.get("PRINTIFY_API_KEY")

    if not anthropic_key:
        print("Error: ANTHROPIC_API_KEY is not set. Add it to your .env file.")
        sys.exit(1)
    if not printify_key:
        print("Error: PRINTIFY_API_KEY is not set. Add it to your .env file.")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=anthropic_key)
    messages = []

    print("Printify Store Manager")
    print("=" * 40)
    print("Type your request (or 'quit' to exit)\n")

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "q"):
            print("Goodbye!")
            break

        messages.append({"role": "user", "content": user_input})

        print("\nAssistant: ", end="", flush=True)
        try:
            response = run_agent_turn(client, messages)
            messages.append({"role": "assistant", "content": response})
        except anthropic.APIError as e:
            print(f"\nAPI error: {e}")
        except Exception as e:
            print(f"\nUnexpected error: {e}")

        print()


if __name__ == "__main__":
    main()
