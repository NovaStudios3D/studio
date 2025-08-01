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

const intentPrompt = ai.definePrompt({
    name: 'assistantIntentPrompt',
    input: { schema: z.string() },
    output: { schema: z.object({ isModelRequest: z.boolean().describe("Set to true if the user wants to generate a 3D model. Keywords include 'generate', 'create', 'make', 'model of'.") }) },
    prompt: `Analyze the user's query and determine if they want to generate a 3D model.
  
  User query: {{{prompt}}}`,
});

const modelerPrompt = ai.definePrompt({
    name: 'modelerPrompt',
    input: { schema: z.string() },
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
    const intentResponse = await intentPrompt(prompt);
    const intent = intentResponse.output;

    if (intent?.isModelRequest) {
        let modelName = 'Generated Model';
        try {
            const nameResponse = await ai.generate({
                prompt: `Create a concise, two-word name for a 3D model based on this description: "${prompt}". For example, 'Red car' or 'Oak tree'.`
            });
            modelName = nameResponse.text?.replace(/["']/g, "").trim() || modelName;
        } catch (e) {
            console.warn("Could not generate a model name, using default.");
        }
        
        const modelerResponse = await modelerPrompt(prompt);
        
        if (!modelerResponse.media?.url) {
             return {
                type: 'answer',
                content: `I'm sorry, I was unable to create the "${modelName}" model. Please try a different description.`,
            };
        }

        const base64Data = modelerResponse.media.url.split(',')[1];

        return {
            type: 'model',
            content: `I've created the "${modelName}" model and added it to your scene.`,
            modelName: modelName,
            modelData: base64Data,
        };
    }
    
    // If it's not a model request, answer the question.
    const qaResponse = await ai.generate({
        prompt: `You are an AI assistant in a 3D editor called Cybernox3D. Answer the user's question based on the features below. Be concise.

Features:
${features}

Question: ${prompt}
Answer:`
    });
    
    return {
        type: 'answer',
        content: qaResponse.text || "I'm sorry, I couldn't process that request. Please try again.",
    };
  }
);
