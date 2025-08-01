
'use server';
/**
 * @fileOverview An AI assistant for the Cybernox3D editor.
 *
 * - askAI - A function that handles queries to the AI assistant.
 * - AIInput - The input type for the askAI function.
 * - AIOutput - The return type for the askAI function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const features = `
- 3D Scene Rendering with Three.js and WebGL.
- Camera Controls: Orbit, pan, zoom, rotate.
- Dynamic Lighting & Time of Day: Controllable via a slider (0-24 hours).
- Ground & Grid for object placement.
- Left Toolbar:
    - Add Menu (+): Add Scene Items (Skybox, Waypoint), Shapes (Cube, Sphere, Plane, etc.), Effects (Fire, Rain, Snow, etc.), Import (Scene, Image, Video, Audio, 3D Models), Export (Scene, 3D Models).
    - Transform Tools: Move (M), Rotate (R), Scale (S).
    - Object Actions: Copy (Ctrl+D), Delete (Delete).
- Right Panel:
    - Object List: View all scene objects, toggle visibility, undo/redo actions.
    - Properties Panel: Edit selected object's name, position, rotation, scale, and color.
- Object Management: Add, select, copy, delete, hide/show, undo/redo actions.
- Import/Export: Supports various formats including .cyb for scenes, GLTF/GLB, OBJ, STL for models, and common media files.
- Special Effects: Particle systems like Fire, Rain, etc.
- Skybox: Add a 360-degree background.
- Waypoints: Place map-pin style markers.
`;

export const AIInputSchema = z.string();
export type AIInput = z.infer<typeof AIInputSchema>;

export const AIOutputSchema = z.object({
  type: z.enum(['answer', 'model']).describe('The type of response from the AI.'),
  content: z.string().describe('The text content of the response. If type is "model", this contains a confirmation message.'),
  modelName: z.string().optional().describe('The name of the generated 3D model, if applicable.'),
  modelData: z.string().optional().describe("The Base64 encoded data of the generated 3D model (GLB format), if applicable."),
});
export type AIOutput = z.infer<typeof AIOutputSchema>;

export async function askAI(input: AIInput): Promise<AIOutput> {
  return askAIAssistantFlow(input);
}

const assistantPrompt = ai.definePrompt({
  name: 'askAIAssistantPrompt',
  input: { schema: AIInputSchema },
  output: { schema: AIOutputSchema },
  prompt: `You are an AI assistant embedded in a 3D modeling web application called Cybernox3D.
Your capabilities are:
1.  Answer questions about how to use the application based on its features.
2.  Generate a 3D model based on a user's description.

When the user asks a question, provide a concise and helpful answer based on the feature list provided below.
When the user asks for a 3D model, set the 'type' field to "model", provide a suitable 'modelName' for the object, and set the 'modelData' to the base64-encoded GLB data of the generated model. For the 'content' field, provide a confirmation message like "I have created the [modelName] model for you."

If the user's intent is unclear, assume they are asking a question.

Here is the list of application features:
${features}

User query: {{{prompt}}}`,
});

const modelerPrompt = ai.definePrompt({
    name: 'modelerPrompt',
    input: { schema: z.string() },
    output: { schema: z.any() },
    prompt: `You are a 3D modeler. Generate a 3D model in GLB format based on the following description: {{{prompt}}}`,
    config: {
        response: {
            format: 'glb'
        }
    }
});


const askAIAssistantFlow = ai.defineFlow(
  {
    name: 'askAIAssistantFlow',
    inputSchema: AIInputSchema,
    outputSchema: AIOutputSchema,
  },
  async (prompt) => {
    const llmResponse = await assistantPrompt(prompt);
    
    if (!llmResponse.output) {
      return {
        type: 'answer',
        content: "I'm sorry, I couldn't process that request. Please try again.",
      };
    }
    const assistantOutput = llmResponse.output;

    if (assistantOutput.type === 'model') {
        let modelName = assistantOutput.modelName?.replace(/[^a-zA-Z0-9\\s]/g, '').trim();
        if (!modelName || modelName.length === 0) {
            modelName = 'Generated Model';
        }

        const modelerResponse = await modelerPrompt(prompt);
        const modelOutput = modelerResponse.output as { media: { url: string } } | null;
        
        if (!modelOutput?.media?.url) {
             return {
                type: 'answer',
                content: `I'm sorry, I was unable to create the "${modelName}" model. Please try a different description.`,
            };
        }

        const base64Data = modelOutput.media.url.split(',')[1];

        return {
            type: 'model',
            content: `I've created the "${modelName}" model and added it to your scene.`,
            modelName: modelName,
            modelData: base64Data,
        };
    }
    
    return {
        type: 'answer',
        content: assistantOutput.content,
    };
  }
);
