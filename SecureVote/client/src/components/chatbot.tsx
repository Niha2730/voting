import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  message: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatResponse {
  response: string;
  suggestions?: string[];
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: welcomeMessage } = useQuery<ChatResponse>({
    queryKey: ["/api/chat/welcome"],
    enabled: isOpen && messages.length === 0,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { message });
      return res.json();
    },
    onSuccess: (response: ChatResponse) => {
      setMessages(prev => [...prev, {
        message: response.response,
        isUser: false,
        timestamp: new Date(),
        suggestions: response.suggestions
      }]);
    },
  });

  useEffect(() => {
    if (welcomeMessage && messages.length === 0) {
      setMessages([{
        message: welcomeMessage.response,
        isUser: false,
        timestamp: new Date(),
        suggestions: welcomeMessage.suggestions
      }]);
    }
  }, [welcomeMessage, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      message: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary-dark shadow-lg"
          size="icon"
        >
          <MessageCircle size={24} className="text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? "w-80 h-12" : "w-96 h-[32rem]"
    }`}>
      <Card className="h-full shadow-2xl border-2 border-primary/20">
        <CardHeader className="p-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">VoteEd Assistant</CardTitle>
                <p className="text-xs text-primary-light">Here to help with voting questions</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
              {messages.map((msg, index) => (
                <div key={index}>
                  <div
                    className={`flex ${msg.isUser ? "justify-end" : "justify-start"} mb-2`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.isUser
                          ? "bg-primary text-white"
                          : "bg-white border border-neutral-200 text-neutral-900"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {!msg.isUser && (
                          <Bot size={16} className="mt-0.5 text-primary flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.isUser ? "text-primary-light" : "text-neutral-500"
                          }`}>
                            {msg.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        {msg.isUser && (
                          <User size={16} className="mt-0.5 text-primary-light flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-6">
                      {msg.suggestions.map((suggestion, sugIndex) => (
                        <Badge
                          key={sugIndex}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-xs"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-neutral-200 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot size={16} className="text-primary" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-neutral-200 bg-white">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about voting, elections, or candidates..."
                  className="flex-1"
                  disabled={chatMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatMutation.isPending}
                  size="icon"
                  className="bg-primary hover:bg-primary-dark"
                >
                  <Send size={18} />
                </Button>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Ask me about voting procedures, election schedules, or security features!
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <MessageCircle size={16} />
          <span>Help Assistant</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot size={20} className="text-primary" />
            <span>VoteEd Assistant</span>
          </DialogTitle>
        </DialogHeader>
        <div className="h-full">
          <ChatbotWidget />
        </div>
      </DialogContent>
    </Dialog>
  );
}