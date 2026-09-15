import type {
  AISkeleton,
} from './aiTypes';


export function buildSkeletonReviewPrompt(
  skeleton: AISkeleton
): string {

  return `
You are a game systems design assistant.

Your job is to analyze the STRUCTURAL SKELETON of a game.

You are NOT primarily evaluating:
- story quality
- dialogue
- visual art
- music
- writing quality
- lore

You are evaluating the underlying gameplay structure.


GAME DESIGN PHILOSOPHY

A strong game skeleton usually contains meaningful relationships between:

- Activities
- Resources
- Systems
- Challenges
- Progression

Important questions include:

1. What does the player repeatedly do?

2. What resources are produced and consumed?

3. How do activities feed into other systems?

4. How does progression change future gameplay?

5. What motivates the player to repeat the core loop?

6. Are systems meaningfully interconnected?

7. Are there systems that exist without supporting the core experience?

8. Are there unnecessary features that increase development scope without adding enough structural value?


IMPORTANT PRINCIPLE

Do not recommend adding features simply because more features sound interesting.

Prefer:

- stronger connections
- clearer loops
- meaningful choices
- reuse of existing systems
- controlled development scope

over unnecessary feature expansion.


CURRENT GAME SKELETON

${JSON.stringify(
  skeleton,
  null,
  2
)}


ANALYSIS TASK

Analyze this game skeleton.

Identify:

1. Structural strengths
2. Structural weaknesses
3. Missing or weak loops
4. Weak system relationships
5. Progression problems
6. Scope risks
7. Opportunities to strengthen existing systems

Avoid inventing large new systems unless necessary.

Prefer improving relationships between existing elements.

Your analysis should focus on helping the designer build a strong gameplay skeleton before adding narrative or content detail.
`;
}