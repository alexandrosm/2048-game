import { createMachine } from "xstate";

export const description = "OODA Loop (Observe, Orient, Decide, Act) decision cycle for strategic planning and execution";

export const machine = createMachine(
    {
        id: "ooda_loop",
        initial: "observe",
        context: {
            // Data collected during observation
            observations: [],
            // Analysis and insights from orientation
            analysis: null,
            // Decision made in the decide phase
            decision: null,
            // Results of actions taken
            actionResults: [],
            // Metadata about the current cycle
            cycleStartTime: null,
            cycleEndTime: null,
            cycleCount: 0,
            // Domain-specific context that can be added during use
            domain: {}
        },
        states: {
            observe: {
                meta: {
                    description: "Collect information and data from the environment to build situational awareness"
                },
                entry: ["initializeCycle"],
                on: {
                    ADD_OBSERVATION: {
                        actions: ["addObservation"],
                        meta: {
                            description: "Add an observation or piece of information to the current cycle",
                            parameters: {
                                observation: "string (required): The observation or information collected",
                                source: "string (optional): The source of this observation",
                                timestamp: "string (optional): When this observation was made (defaults to now)",
                                importance: "string (optional): Priority level of the observation (high, medium, low)"
                            }
                        }
                    },
                    COMPLETE_OBSERVATION: {
                        target: "orient",
                        meta: {
                            description: "Complete the observation phase and move to analysis (orient)",
                            parameters: {
                                finalNotes: "string (optional): Any final notes about the observation phase"
                            }
                        }
                    }
                }
            },
            orient: {
                meta: {
                    description: "Analyze the collected information, identify patterns, and form a mental model"
                },
                on: {
                    UPDATE_ANALYSIS: {
                        actions: ["updateAnalysis"],
                        meta: {
                            description: "Update the analysis based on the observations",
                            parameters: {
                                analysis: "object (required): The updated analysis of the situation",
                                key_insights: "array (optional): Key insights derived from the observations",
                                potential_options: "array (optional): Potential options identified during analysis"
                            }
                        }
                    },
                    COMPLETE_ORIENTATION: {
                        target: "decide",
                        meta: {
                            description: "Complete the orientation (analysis) phase and move to decision making",
                            parameters: {
                                finalAnalysis: "string (optional): Final summary of the analysis"
                            }
                        }
                    },
                    REVISIT_OBSERVATION: {
                        target: "observe",
                        meta: {
                            description: "Return to the observation phase to gather more information",
                            parameters: {
                                reason: "string (required): Reason for needing more observations"
                            }
                        }
                    }
                }
            },
            decide: {
                meta: {
                    description: "Determine the course of action based on analysis and options"
                },
                on: {
                    MAKE_DECISION: {
                        actions: ["recordDecision"],
                        meta: {
                            description: "Record the decision made based on the orientation phase",
                            parameters: {
                                decision: "string (required): The decision being made",
                                rationale: "string (optional): Reasoning behind this decision",
                                alternatives: "array (optional): Alternative decisions that were considered",
                                confidence: "number (optional): Confidence level in this decision (0-100)"
                            }
                        }
                    },
                    COMPLETE_DECISION: {
                        target: "act",
                        meta: {
                            description: "Complete the decision phase and move to action",
                            parameters: {
                                finalDecision: "string (optional): Final decision description"
                            }
                        }
                    },
                    RECONSIDER: {
                        target: "orient",
                        meta: {
                            description: "Return to the orientation phase to reconsider the analysis",
                            parameters: {
                                reason: "string (required): Reason for reconsidering the analysis"
                            }
                        }
                    }
                }
            },
            act: {
                meta: {
                    description: "Execute the decided course of action and monitor results"
                },
                on: {
                    RECORD_ACTION: {
                        actions: ["recordAction"],
                        meta: {
                            description: "Record an action taken as part of executing the decision",
                            parameters: {
                                action: "string (required): Description of the action taken",
                                timestamp: "string (optional): When this action was taken (defaults to now)",
                                outcome: "string (optional): Immediate outcome of this action if known"
                            }
                        }
                    },
                    COMPLETE_ACTION: {
                        target: "observe",
                        actions: ["completeCycle"],
                        meta: {
                            description: "Complete the action phase and start a new OODA cycle",
                            parameters: {
                                results: "string (required): Summary of the action results",
                                success: "boolean (optional): Whether the actions were successful",
                                lessons: "array (optional): Lessons learned to apply to next cycle"
                            }
                        }
                    },
                    ADJUST_EXECUTION: {
                        target: "decide",
                        meta: {
                            description: "Return to the decision phase to adjust the course of action",
                            parameters: {
                                reason: "string (required): Reason for adjusting the execution",
                                new_information: "string (optional): New information prompting the adjustment"
                            }
                        }
                    }
                }
            }
        }
    },
    {
        actions: {
            initializeCycle: ({ context }) => {
                context.cycleStartTime = new Date().toISOString();
                context.cycleCount += 1;
                if (context.cycleCount === 1) {
                    // First cycle, initialize arrays
                    context.observations = [];
                    context.actionResults = [];
                    context.analysis = null;
                    context.decision = null;
                }
                // Otherwise, we keep the existing data for reference across cycles
            },
            addObservation: ({ context }, { observation, source, timestamp, importance }) => {
                context.observations.push({
                    observation,
                    source: source || "unspecified",
                    timestamp: timestamp || new Date().toISOString(),
                    importance: importance || "medium"
                });
            },
            updateAnalysis: ({ context }, { analysis, key_insights, potential_options }) => {
                context.analysis = {
                    ...analysis,
                    key_insights: key_insights || [],
                    potential_options: potential_options || [],
                    timestamp: new Date().toISOString()
                };
            },
            recordDecision: ({ context }, { decision, rationale, alternatives, confidence }) => {
                context.decision = {
                    decision,
                    rationale: rationale || "",
                    alternatives: alternatives || [],
                    confidence: confidence || 50,
                    timestamp: new Date().toISOString()
                };
            },
            recordAction: ({ context }, { action, timestamp, outcome }) => {
                if (!context.actionResults) {
                    context.actionResults = [];
                }
                context.actionResults.push({
                    action,
                    timestamp: timestamp || new Date().toISOString(),
                    outcome: outcome || "pending"
                });
            },
            completeCycle: ({ context }, { results, success, lessons }) => {
                context.cycleEndTime = new Date().toISOString();
                // Store completion data in the current cycle's results
                const cycleCompletion = {
                    results,
                    success: success !== undefined ? success : null,
                    lessons: lessons || [],
                    cycleDuration: new Date(context.cycleEndTime) - new Date(context.cycleStartTime)
                };

                // Add this as the final action result for this cycle
                if (!context.actionResults) {
                    context.actionResults = [];
                }
                context.actionResults.push({
                    action: "cycle_completion",
                    timestamp: new Date().toISOString(),
                    outcome: cycleCompletion
                });
            }
        }
    }
);
