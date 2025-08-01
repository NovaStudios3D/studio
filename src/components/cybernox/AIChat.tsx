
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Sparkles, Loader, CornerDownLeft } from 'lucide-react';
import { askAI, AIOutput } from "@/ai/flows/ask-ai-assistant-flow";
import type { SceneObject } from '@/app/page';

interface AIChatProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddObject: (type: SceneObject['type'], options: { src?: string | ArrayBuffer, name?: string, format?: string }) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
};
  

export default function AIChat({ isOpen, onOpenChange, onAddObject }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: AIOutput = await askAI(input);
      
      if (response.type === 'model' && response.modelName && response.modelData) {
        const modelBlob = b64toBlob(response.modelData, 'application/octet-stream');
        const reader = new FileReader();
        reader.onloadend = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          onAddObject('Model', {
            src: arrayBuffer,
            name: response.modelName,
            format: 'glb'
          });
        };
        reader.readAsArrayBuffer(modelBlob);
        
        const assistantMessage: Message = { role: 'assistant', content: `I've created the "${response.modelName}" model and added it to your scene.` };
        setMessages(prev => [...prev, assistantMessage]);

      } else {
        const assistantMessage: Message = { role: 'assistant', content: response.content };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error("AI Assistant Error:", error);
      const errorMessage: Message = { role: 'assistant', content: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, onAddObject]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary w-5 h-5" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Ask questions or describe a 3D model to generate.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pr-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && <Bot className="w-6 h-6 text-primary flex-shrink-0" />}
                  <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                    <Loader className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g., 'a red sports car' or 'how do I add a skybox?'"
              className="pr-12 h-10"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7" disabled={isLoading || !input.trim()}>
              <CornerDownLeft className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    