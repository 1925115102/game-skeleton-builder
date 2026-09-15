import type {
  AnalysisIssueType,
} from './analyzerTypes';


// ======================================================
// Fix Action Types
// ======================================================

export type IssueFixActionType =
  | 'connect_existing'
  | 'create_node'
  | 'create_edge'
  | 'change_importance'
  | 'remove_node'
  | 'review_structure'
  | 'custom';


// ======================================================
// Fix Option
// ======================================================

export interface IssueFixOption {

  id: string;

  label: string;

  description: string;

  actionType: IssueFixActionType;

  /**
   * Structural intention behind this fix.
   *
   * This is useful later for:
   * - AI prompting
   * - analytics
   * - recommendation ranking
   * - graph operation generation
   */
  structuralGoal:
    | 'connect_to_core'
    | 'add_source'
    | 'add_sink'
    | 'continue_progression'
    | 'increase_relevance'
    | 'reduce_scope'
    | 'clarify_role'
    | 'remove_redundancy';

  /**
   * Optional hint for what kind of Game Grammar
   * relationship this fix usually creates.
   */
  suggestedRelations?: (
    | 'produces'
    | 'consumes'
    | 'requires'
    | 'unlocks'
    | 'improves'
    | 'leads_to'
  )[];

  /**
   * Rough scope implication.
   *
   * This is NOT a development-time estimate.
   * It only indicates relative structural cost.
   */
  scopeImpact:
    | 'low'
    | 'medium'
    | 'high';
}


// ======================================================
// Issue → Fix Strategy Mapping
// ======================================================

export const issueFixMap: Record<
  AnalysisIssueType,
  IssueFixOption[]
> = {

  // ====================================================
  // ISOLATED NODE
  // ====================================================

  isolated_node: [

    {
      id: 'isolated-connect-to-core',

      label: 'Connect to Core Loop',

      description:
        'Connect this feature to an existing core activity, resource, system, challenge, or progression path.',

      actionType: 'connect_existing',

      structuralGoal:
        'connect_to_core',

      suggestedRelations: [
        'produces',
        'consumes',
        'requires',
        'unlocks',
        'improves',
        'leads_to',
      ],

      scopeImpact: 'low',
    },


    {
      id: 'isolated-clarify-role',

      label: 'Clarify Its Role',

      description:
        'Decide what this feature contributes to the game before connecting it to the rest of the skeleton.',

      actionType: 'review_structure',

      structuralGoal:
        'clarify_role',

      scopeImpact: 'low',
    },


    {
      id: 'isolated-mark-optional',

      label: 'Make It Optional',

      description:
        'Keep the feature, but explicitly treat it as optional side content rather than part of the core skeleton.',

      actionType:
        'change_importance',

      structuralGoal:
        'reduce_scope',

      scopeImpact: 'low',
    },


    {
      id: 'isolated-remove',

      label: 'Remove Feature',

      description:
        'Remove the feature if it does not meaningfully support the current game skeleton.',

      actionType:
        'remove_node',

      structuralGoal:
        'reduce_scope',

      scopeImpact: 'low',
    },

  ],


  // ====================================================
  // DEAD RESOURCE
  // ====================================================

  dead_resource: [

    {
      id: 'dead-resource-add-sink',

      label: 'Add a Resource Sink',

      description:
        'Define a system, activity, progression step, or exchange that consumes this resource.',

      actionType:
        'create_node',

      structuralGoal:
        'add_sink',

      suggestedRelations: [
        'consumes',
        'requires',
        'improves',
      ],

      scopeImpact: 'medium',
    },


    {
      id: 'dead-resource-connect-existing',

      label: 'Connect to Existing System',

      description:
        'Use an existing system, activity, or progression node as the consumer of this resource.',

      actionType:
        'connect_existing',

      structuralGoal:
        'add_sink',

      suggestedRelations: [
        'consumes',
        'requires',
        'improves',
      ],

      scopeImpact: 'low',
    },


    {
      id: 'dead-resource-convert',

      label: 'Turn It Into a Conversion Resource',

      description:
        'Make the resource feed into crafting, economy, progression, combat preparation, or another existing loop.',

      actionType:
        'connect_existing',

      structuralGoal:
        'increase_relevance',

      suggestedRelations: [
        'consumes',
        'improves',
        'unlocks',
      ],

      scopeImpact: 'low',
    },


    {
      id: 'dead-resource-remove',

      label: 'Remove Resource',

      description:
        'Remove the resource if it does not need to exist as a separate design element.',

      actionType:
        'remove_node',

      structuralGoal:
        'remove_redundancy',

      scopeImpact: 'low',
    },

  ],


  // ====================================================
  // MISSING RESOURCE SOURCE
  // ====================================================

  missing_resource_source: [

    {
      id: 'missing-source-create',

      label: 'Add a Resource Source',

      description:
        'Define how the player obtains this resource through exploration, combat, trade, production, rewards, or another activity.',

      actionType:
        'create_node',

      structuralGoal:
        'add_source',

      suggestedRelations: [
        'produces',
      ],

      scopeImpact: 'medium',
    },


    {
      id: 'missing-source-connect-existing',

      label: 'Use an Existing Source',

      description:
        'Connect an existing activity, challenge, or system that can naturally produce this resource.',

      actionType:
        'connect_existing',

      structuralGoal:
        'add_source',

      suggestedRelations: [
        'produces',
      ],

      scopeImpact: 'low',
    },


    {
      id: 'missing-source-reconsider',

      label: 'Reconsider the Resource',

      description:
        'If the resource has no clear acquisition method, reconsider whether it needs to exist independently.',

      actionType:
        'review_structure',

      structuralGoal:
        'clarify_role',

      scopeImpact: 'low',
    },

  ],


  // ====================================================
  // DEAD-END PROGRESSION
  // ====================================================

  dead_end_progression: [

    {
      id: 'progression-unlock-content',

      label: 'Unlock New Content',

      description:
        'Make this progression step unlock a new region, system, challenge, activity, resource tier, or gameplay option.',

      actionType:
        'create_node',

      structuralGoal:
        'continue_progression',

      suggestedRelations: [
        'unlocks',
        'leads_to',
      ],

      scopeImpact: 'medium',
    },


    {
      id: 'progression-return-to-loop',

      label: 'Reconnect to Core Loop',

      description:
        'Feed the progression result back into the main gameplay loop so the player enters a new cycle with expanded capabilities.',

      actionType:
        'connect_existing',

      structuralGoal:
        'continue_progression',

      suggestedRelations: [
        'unlocks',
        'improves',
        'leads_to',
      ],

      scopeImpact: 'low',
    },


    {
      id: 'progression-improve-existing',

      label: 'Improve an Existing System',

      description:
        'Let this progression step strengthen or alter an existing activity, build option, resource loop, or challenge.',

      actionType:
        'connect_existing',

      structuralGoal:
        'increase_relevance',

      suggestedRelations: [
        'improves',
        'unlocks',
      ],

      scopeImpact: 'low',
    },


    {
      id: 'progression-terminal',

      label: 'Mark as Final Goal',

      description:
        'If this is intentionally the end of progression, treat it as a final goal rather than a continuing progression node.',

      actionType:
        'review_structure',

      structuralGoal:
        'clarify_role',

      scopeImpact: 'low',
    },

  ],


  // ====================================================
  // DETACHED SYSTEM
  // ====================================================

  detached_system: [

    {
      id: 'detached-connect-input',

      label: 'Give the System an Input',

      description:
        'Connect an existing resource, activity, or requirement that feeds into this system.',

      actionType:
        'connect_existing',

      structuralGoal:
        'connect_to_core',

      suggestedRelations: [
        'requires',
        'consumes',
        'leads_to',
      ],

      scopeImpact: 'low',
    },


    {
      id: 'detached-connect-output',

      label: 'Give the System an Output',

      description:
        'Define what the system produces, improves, unlocks, or changes elsewhere in the game.',

      actionType:
        'connect_existing',

      structuralGoal:
        'connect_to_core',

      suggestedRelations: [
        'produces',
        'improves',
        'unlocks',
        'leads_to',
      ],

      scopeImpact: 'low',
    },


    {
      id: 'detached-integrate-loop',

      label: 'Integrate Into Core Loop',

      description:
        'Make this system meaningfully participate in the repeating gameplay loop instead of existing as a disconnected feature.',

      actionType:
        'review_structure',

      structuralGoal:
        'increase_relevance',

      scopeImpact: 'medium',
    },


    {
      id: 'detached-make-optional',

      label: 'Make It Optional',

      description:
        'Keep the system as side content, but do not treat it as part of the core game skeleton.',

      actionType:
        'change_importance',

      structuralGoal:
        'reduce_scope',

      scopeImpact: 'low',
    },


    {
      id: 'detached-remove',

      label: 'Remove System',

      description:
        'Remove the system if its development cost is not justified by its contribution to the current skeleton.',

      actionType:
        'remove_node',

      structuralGoal:
        'reduce_scope',

      scopeImpact: 'low',
    },

  ],

};