import React, { useState } from 'react';
import { Send, Sparkles, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { generateSQL } from '../../services/api';

interface AIAssistantProps {
  onQueryGenerated: (query: string) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  query?: string;
  timestamp: Date;
}

export function AIAssistant({ onQueryGenerated }: AIAssistantProps) {
  const [input, setInput] = useState('');
  const initialMessage = {
    id: '1',
    type: 'assistant',
    content: "Hi! I'm your AI SQL assistant. I can help you write SQL queries using natural language. Try asking me something like 'Show me monthly revenue by region' or 'Find all users who signed up last month'.",
    timestamp: new Date()
  };
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const predefinedQuestions = [
    "Show me monthly revenue trends",
    "Find top 10 customers by sales",
    "Compare this year vs last year performance",
    "Show user growth by region"
  ];

  const handleSend = async (message?: string) => {
    const userMessage = message || input;
    if (!userMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const res = await generateSQL(userMessage);
      if (res.success && res.sql_query) {
        const newAIMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          // descriptive text shown above the code block
          content: `Below is the sql query for "${userMessage}"`,
          // only this will be shown in the highlighted code block
          query: res.sql_query,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, newAIMessage]);
      } else {
        setError(res.error || 'No SQL generated.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate SQL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    toast.success('Query copied to clipboard');
  };

  const handleUseQuery = (query: string) => {
    onQueryGenerated(query);
    toast.success('Query loaded in editor');
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-medium">AI SQL Assistant</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Ask me to generate SQL queries in natural language
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setMessages([initialMessage])}>
          New Chat
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <Card className={`max-w-[85%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                  <CardContent className="p-3">
                    <p className="text-sm mb-2">{message.content}</p>
                    {message.query && (
                      <div className="mt-3 space-y-2">
                        <div className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{message.query}</pre>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyQuery(message.query!)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUseQuery(message.query!)}
                          >
                            Use Query
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.type === 'assistant' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span className="text-sm">Generating SQL query...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <Card className="bg-red-100 text-red-800">
                  <CardContent className="p-3">
                    <p className="text-sm">{error}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex flex-wrap gap-1">
            {predefinedQuestions.map((question) => (
              <Badge
                key={question}
                variant="outline"
                className="cursor-pointer hover:bg-accent text-xs"
                onClick={() => handleSend(question)}
              >
                {question}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to generate a SQL query..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}