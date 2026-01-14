#!/bin/bash
#
# Claude-Focused Statusline - Displays model, context usage, and workspace info
#
# CUSTOMIZATION:
#   - Set PAI_SIMPLE_COLORS=1 in settings.json env for basic ANSI colors
#   - Modify color codes below to match your theme preference
#

# Read JSON input from stdin
input=$(cat)

# Extract data from JSON input
current_dir=$(echo "$input" | jq -r '.workspace.current_dir')
project_dir=$(echo "$input" | jq -r '.workspace.project_dir')
model_name=$(echo "$input" | jq -r '.model.display_name')
model_id=$(echo "$input" | jq -r '.model.id')

# Calculate context usage percentage
usage=$(echo "$input" | jq '.context_window.current_usage')
context_pct=""
context_display="No messages yet"

if [ "$usage" != "null" ]; then
    # Calculate current context usage (input + cache tokens)
    current_tokens=$(echo "$usage" | jq '.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens')
    context_window_size=$(echo "$input" | jq '.context_window.context_window_size')

    if [ "$current_tokens" != "null" ] && [ "$context_window_size" != "null" ] && [ "$context_window_size" -gt 0 ]; then
        context_pct=$((current_tokens * 100 / context_window_size))

        # Format with thousands separator
        current_tokens_formatted=$(printf "%'d" "$current_tokens" 2>/dev/null || echo "$current_tokens")
        context_window_formatted=$(printf "%'d" "$context_window_size" 2>/dev/null || echo "$context_window_size")

        context_display="${current_tokens_formatted} / ${context_window_formatted} tokens (${context_pct}%)"
    fi
fi

# Get directory names
dir_name=$(basename "$current_dir")
if [ "$project_dir" != "$current_dir" ] && [ "$project_dir" != "null" ]; then
    project_name=$(basename "$project_dir")
    workspace_display="$project_name/$dir_name"
else
    workspace_display="$dir_name"
fi

# Color definitions - Tokyo Night Storm theme
BRIGHT_PURPLE='\033[38;2;187;154;247m'
BRIGHT_BLUE='\033[38;2;122;162;247m'
BRIGHT_CYAN='\033[38;2;125;207;255m'
BRIGHT_YELLOW='\033[38;2;224;175;104m'
BRIGHT_GREEN='\033[38;2;158;206;106m'
BRIGHT_ORANGE='\033[38;2;255;158;100m'
SEPARATOR_COLOR='\033[38;2;140;152;180m'
RESET='\033[0m\033[49m'

# Simple colors mode fallback
if [ "${PAI_SIMPLE_COLORS:-0}" = "1" ]; then
    BRIGHT_PURPLE='\033[35m'
    BRIGHT_BLUE='\033[34m'
    BRIGHT_CYAN='\033[36m'
    BRIGHT_YELLOW='\033[33m'
    BRIGHT_GREEN='\033[32m'
    BRIGHT_ORANGE='\033[33m'
    SEPARATOR_COLOR='\033[37m'
fi

# Determine context color based on percentage
CONTEXT_COLOR="$BRIGHT_GREEN"
if [ -n "$context_pct" ]; then
    if [ "$context_pct" -ge 80 ]; then
        CONTEXT_COLOR="$BRIGHT_ORANGE"
    elif [ "$context_pct" -ge 60 ]; then
        CONTEXT_COLOR="$BRIGHT_YELLOW"
    fi
fi

# Output Claude-focused statusline
printf "${BRIGHT_PURPLE}Model${RESET}${SEPARATOR_COLOR}: ${RESET}${BRIGHT_BLUE}${model_name}${RESET}  ${SEPARATOR_COLOR}|${RESET}  ${BRIGHT_PURPLE}Context${RESET}${SEPARATOR_COLOR}: ${RESET}${CONTEXT_COLOR}${context_display}${RESET}  ${SEPARATOR_COLOR}|${RESET}  ${BRIGHT_PURPLE}Workspace${RESET}${SEPARATOR_COLOR}: ${RESET}${BRIGHT_CYAN}${workspace_display}${RESET}\n"