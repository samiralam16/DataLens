import { useState } from 'react';
import { Send, Sparkles, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI SQL assistant. I can help you write SQL queries using natural language. Try asking me something like 'Show me monthly revenue by region' or 'Find all users who signed up last month'.",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage);
      const newAIMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse.explanation,
        query: aiResponse.query,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newAIMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): { explanation: string; query: string } => {
    const input = userInput.toLowerCase();
    
    if (input.includes('revenue') && input.includes('month')) {
      return {
        explanation: "I'll create a query to show monthly revenue trends. This query groups sales data by month and calculates total revenue for each period.",
        query: `SELECT 
    DATE_TRUNC('month', order_date) as month,
    SUM(total_amount) as monthly_revenue,
    COUNT(*) as order_count
FROM orders 
WHERE order_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY 1
ORDER BY 1;`
      };
    } else if (input.includes('top') && input.includes('customer')) {
      return {
        explanation: "Here's a query to find your top customers by total sales amount. I've included customer details and their total purchase amounts.",
        query: `SELECT 
    c.customer_name,
    c.email,
    SUM(o.total_amount) as total_sales,
    COUNT(o.id) as order_count
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.customer_name, c.email
ORDER BY total_sales DESC
LIMIT 10;`
      };
    } else if (input.includes('user') && input.includes('growth')) {
      return {
        explanation: "This query will show user growth by region, including new signups and growth rates compared to previous periods.",
        query: `SELECT 
    region,
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30d,
    ROUND(
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' 
                          AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END), 0),
        2
    ) as growth_rate_percent
FROM users
GROUP BY region
ORDER BY new_users_30d DESC;`
      };
    } else {
      return {
        explanation: "I'll create a general data overview query for you. This will give you a sample of your data structure and some basic statistics.",
        query: `SELECT 
    COUNT(*) as total_records,
    MIN(created_at) as earliest_date,
    MAX(created_at) as latest_date,
    COUNT(DISTINCT user_id) as unique_users
FROM your_table
LIMIT 100;`
      };
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
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-medium">AI SQL Assistant</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask me to generate SQL queries in natural language
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
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
  );
}