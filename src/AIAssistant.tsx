import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, MapPin, ChefHat, Bot } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  price: number;
  rating: number;
  location: { lat: number; lng: number };
  scenario?: string[];
}

interface AIAssistantProps {
  restaurants: Restaurant[];
  onSuggestRestaurant: (restaurant: Restaurant) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Restaurant[];
}

export default function AIAssistant({ restaurants, onSuggestRestaurant }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是你的专属地图找店AI助手 🍽️\n你可以问我：\n"附近有什么好吃的火锅？"\n"想找个人均100左右的约会餐厅"\n"评分最高的日料店是哪家？"'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response Logic based on local data
    setTimeout(() => {
      let responseContent = '我为你找到了一些不错的推荐，希望你喜欢！';
      let suggestions: Restaurant[] = [];

      const query = userMessage.content.toLowerCase();
      
      // Simple intent matching
      let filtered = [...restaurants];
      
      if (query.includes('火锅') || query.includes('涮')) {
        filtered = filtered.filter(r => r.category.includes('火锅') || r.subCategory.includes('火锅'));
        responseContent = '找到这几家热气腾腾的火锅店，口碑都很棒哦：';
      } else if (query.includes('西餐') || query.includes('牛排') || query.includes('约会')) {
        filtered = filtered.filter(r => r.category.includes('西餐') || r.scenario?.includes('情侣约会'));
        responseContent = '为您推荐几家氛围感拉满的西餐厅，很适合约会：';
      } else if (query.includes('便宜') || query.includes('性价比') || query.includes('快餐')) {
        filtered = filtered.filter(r => r.price <= 50 || r.category.includes('小吃快餐'));
        responseContent = '这几家店好吃又不贵，性价比超高：';
      } else if (query.includes('日料') || query.includes('寿司')) {
        filtered = filtered.filter(r => r.category.includes('国际料理') && (r.subCategory.includes('日本') || r.name.includes('寿司') || r.name.includes('料理')));
        responseContent = '为您找到以下高分日料餐厅：';
      } else if (query.includes('好喝') || query.includes('奶茶') || query.includes('咖啡')) {
        filtered = filtered.filter(r => r.category.includes('饮品'));
        responseContent = '请查收这几间热门饮品店：';
      } else {
        // Fallback: just keyword search
        filtered = filtered.filter(r => 
          r.name.includes(query) || 
          r.category.includes(query) || 
          r.subCategory.includes(query)
        );
        if (filtered.length > 0) {
          responseContent = `根据您的描述，这几家"${query}"餐厅非常符合您的要求，点击卡片可以在地图上查看详细位置哦：`;
        } else {
           // Default to top rated if no match
           filtered = [...restaurants].sort((a,b) => b.rating - a.rating).slice(0, 3);
           const fallbackReplies = [
             "虽然没有找到完全匹配的结果，但附近这几家高分好店非常受欢迎，强烈建议您去尝尝鲜！",
             "您提到的口味暂未在当前区域发现，不过我可以为您推荐本地长期霸榜的必吃餐厅：",
             "换换口味也不错！这几家店是美食达人们最近高频打卡的宝藏地点："
           ];
           responseContent = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
        }
      }

      // Sort by rating and take top 3
      suggestions = filtered.sort((a, b) => b.rating - a.rating).slice(0, 3);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[2000] w-14 h-14 bg-gradient-to-tr from-orange-400 via-red-500 to-rose-500 rounded-full shadow-[0_4px_12px_rgba(239,68,68,0.4)] flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_6px_16px_rgba(239,68,68,0.5)] transition-all ${isOpen ? 'hidden' : 'block'}`}
      >
        <Bot size={28} className="drop-shadow-md" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 z-[2000] w-[360px] max-w-[calc(100vw-32px)] h-[550px] max-h-[calc(100vh-100px)] bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI 觅食助手</h3>
              <p className="text-[10px] opacity-80 mt-0.5 max-w-[180px] leading-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></span>
                演示模式 (未配置 API KEY)
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages Auto Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-2 shrink-0 border border-blue-200">
                  <Sparkles size={14} className="text-blue-600" />
                </div>
              )}
              
              <div className="max-w-[80%]">
                <div 
                  className={`p-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-tr-sm' 
                      : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                
                {/* AI Restaurant Suggestions */}
                {msg.suggestions && (
                  <div className="mt-2 space-y-2">
                    {msg.suggestions.map(restaurant => (
                      <div 
                        key={restaurant.id} 
                        onClick={() => {
                          onSuggestRestaurant(restaurant);
                          // Optionally on mobile, we might close the modal
                        }}
                        className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col gap-1.5"
                      >
                         <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{restaurant.name}</h4>
                            <span className="text-orange-500 font-bold text-xs bg-orange-50 px-1.5 py-0.5 rounded shrink-0">{restaurant.rating}分</span>
                         </div>
                         <div className="flex items-center text-xs text-gray-500 gap-2">
                            <span className="flex items-center"><ChefHat size={12} className="mr-0.5"/> {restaurant.subCategory}</span>
                            <span>人均: ¥{restaurant.price}</span>
                         </div>
                         <div className="flex items-center text-[10px] text-blue-500 mt-1">
                            <MapPin size={10} className="mr-0.5"/> 点击在地图上查看
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-2 shrink-0 border border-blue-200">
                  <Sparkles size={14} className="text-blue-600" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-blue-400 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="告诉AI你想吃什么..."
              className="w-full bg-transparent resize-none outline-none text-sm p-2 max-h-24 min-h-[40px] text-gray-800 placeholder-gray-400"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-blue-500 text-white rounded-xl mb-0.5 shrink-0 hover:bg-blue-600 disabled:bg-blue-200 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2 flex justify-center items-center gap-1 text-[10px] text-gray-400">
            <Sparkles size={10} /> AI推荐可能会有偏差，请以实际为准
          </div>
        </div>
      </div>
    </>
  );
}
