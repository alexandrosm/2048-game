# OODA Loop State Machine

This directory contains an implementation of the OODA Loop (Observe, Orient, Decide, Act) as an XState state machine for use with the xstate-mcp server.

## Overview

The OODA Loop is a decision-making framework developed by military strategist John Boyd. It represents a cycle of:

1. **Observe** - Collect information from the environment
2. **Orient** - Analyze the information and form a mental model
3. **Decide** - Determine a course of action based on the analysis
4. **Act** - Implement the decision and observe the results

This cycle then repeats, with each iteration potentially becoming faster and more effective.

## State Machine Implementation

The state machine in `ooda_loop.js` implements the OODA Loop with four primary states:

### States

1. **observe**
   - Description: Collect information and data from the environment to build situational awareness
   - Entry Action: `initializeCycle` - Sets up a new cycle and increments the cycle counter
   - Transitions:
     - `ADD_OBSERVATION` - Add a piece of information to the current cycle
     - `COMPLETE_OBSERVATION` - Move to the orient state

2. **orient**
   - Description: Analyze the collected information, identify patterns, and form a mental model
   - Transitions:
     - `UPDATE_ANALYSIS` - Update the analysis based on observations
     - `COMPLETE_ORIENTATION` - Move to the decide state
     - `REVISIT_OBSERVATION` - Return to observation for more data

3. **decide**
   - Description: Determine the course of action based on analysis and options
   - Transitions:
     - `MAKE_DECISION` - Record the decision
     - `COMPLETE_DECISION` - Move to the act state
     - `RECONSIDER` - Return to orientation for more analysis

4. **act**
   - Description: Execute the decided course of action and monitor results
   - Transitions:
     - `RECORD_ACTION` - Record an action taken
     - `COMPLETE_ACTION` - Complete the cycle and start a new one
     - `ADJUST_EXECUTION` - Return to decision phase to adjust

### Context

The state machine maintains context with:

- `observations` - Array of collected observations
- `analysis` - Analysis and insights from orientation
- `decision` - Decision made in the decide phase
- `actionResults` - Results of actions taken
- Metadata about the cycle (timing, counts)
- Domain-specific context that can be added during use

## Usage with XState MCP

To use this state machine with XState MCP server:

1. Ensure the xstate-mcp server is running
2. Create an instance of the machine:
   ```javascript
   // Use the MCP tool create-instance
   {
     "machineID": "ooda_loop"
   }
   ```

3. Transition through the states:
   ```javascript
   // Example: Add an observation
   {
     "event": "ADD_OBSERVATION",
     "params": {
       "observation": "Project structure analysis shows a web-based application",
       "source": "file system",
       "importance": "high"
     }
   }

   // Example: Complete observation phase
   {
     "event": "COMPLETE_OBSERVATION",
     "params": {
       "finalNotes": "Initial observation phase complete"
     }
   }

   // Continue with other transitions through the OODA loop
   ```

## Benefits for LLM Agents

The OODA loop state machine helps LLM agents:

1. Structure decision-making processes
2. Maintain focus through complex problem-solving tasks
3. Balance information collection with action
4. Adapt strategies based on feedback
5. Document thought processes and decision rationale

This structure helps keep agents "on rails" by guiding them through a disciplined decision process rather than jumping directly to solutions.
