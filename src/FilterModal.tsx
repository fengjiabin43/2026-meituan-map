import React, { useState } from 'react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

export default function FilterModal({ isOpen, onClose, onApply, currentFilters }: FilterModalProps) {
  const [filters, setFilters] = useState(currentFilters);
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice ?? 0);
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice ?? 350);

  if (!isOpen) return null;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinPrice(Math.min(Number(e.target.value), maxPrice - 10));
  };
  
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPrice(Math.max(Number(e.target.value), minPrice + 10));
  };

  const toggleFilter = (category: string, value: string) => {
    setFilters((prev: any) => {
      // Handle single-select categories
      if (category === 'sort' || category === 'priceRange') {
        return { ...prev, [category]: prev[category]?.includes(value) ? [] : [value] };
      }

      const current = prev[category] || [];
      const updated = current.includes(value) 
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const Chip = ({ category, value, key }: { category: string, value: string, key: string }) => (
    <button 
      onClick={() => toggleFilter(category, value)}
      className={`px-4 py-2 rounded-lg text-sm transition-colors ${filters[category]?.includes(value) ? 'bg-blue-50 text-blue-600 font-bold border border-transparent' : 'bg-gray-50 text-gray-700 border border-transparent'}`}
    >
      {value}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-end" onClick={onClose}>
      <div className="bg-white w-full h-[85vh] rounded-t-3xl flex flex-col z-[1001] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-center items-center py-4 relative border-b border-gray-100">
          <button onClick={onClose} className="absolute left-4 text-gray-400 text-lg">✕</button>
          <h2 className="text-base font-bold text-gray-800">全部筛选</h2>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-4 space-y-6 pb-24">
          
          <div>
            <h3 className="text-sm font-bold mb-3 text-gray-800">排序</h3>
            <div className="flex gap-2 flex-wrap">
              {['距离优先', '好评优先', '低价优先', '高价优先'].map(v => <Chip key={v} category="sort" value={v} />)}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold mb-3 text-gray-800">人均价格</h3>
            
            {/* Custom Dual Slider */}
            <div className="px-2 pt-2 pb-6 relative">
              <style>{`
                .range-slider {
                  position: relative;
                  width: 100%;
                  height: 4px;
                  background-color: #E5E7EB;
                  border-radius: 2px;
                }
                .range-thumb {
                  position: absolute;
                  top: 50%;
                  transform: translate(-50%, -50%);
                  width: 20px;
                  height: 20px;
                  background-color: white;
                  border: 2px solid #3B82F6;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  pointer-events: none;
                  z-index: 10;
                }
                .range-track {
                  position: absolute;
                  height: 100%;
                  background-color: #3B82F6;
                  border-radius: 2px;
                }
                .range-input {
                  position: absolute;
                  width: 100%;
                  height: 20px;
                  top: -8px;
                  opacity: 0;
                  pointer-events: none;
                  margin: 0;
                  z-index: 20;
                }
                .range-input::-webkit-slider-thumb {
                  pointer-events: all;
                  width: 20px;
                  height: 20px;
                  -webkit-appearance: none;
                  cursor: pointer;
                }
              `}</style>
              
              <div className="flex justify-between text-xs text-gray-500 mb-6">
                <span>¥ {minPrice}</span>
                <span>¥ {maxPrice}{maxPrice === 350 ? '+' : ''}</span>
              </div>
              
              <div className="range-slider">
                <div 
                  className="range-track" 
                  style={{ left: (minPrice / 350) * 100 + '%', right: (100 - (maxPrice / 350) * 100) + '%' }}
                ></div>
                <div className="range-thumb" style={{ left: (minPrice / 350) * 100 + '%' }}></div>
                <div className="range-thumb" style={{ left: (maxPrice / 350) * 100 + '%' }}></div>
                <input type="range" min="0" max="350" value={minPrice} onChange={handleMinChange} className="range-input" />
                <input type="range" min="0" max="350" value={maxPrice} onChange={handleMaxChange} className="range-input" />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold mb-3 text-gray-800">商家品质</h3>
            <div className="flex gap-2 flex-wrap">
              {['高分餐厅', '黑珍珠', '必吃榜'].map(v => <Chip key={v} category="quality" value={v} />)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-gray-800">商家服务</h3>
            <div className="flex gap-2 flex-wrap">
              {['在线订座', '在线排队', '外卖', '在线点'].map(v => <Chip key={v} category="service" value={v} />)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-gray-800">用餐场景</h3>
            <div className="flex gap-2 flex-wrap">
              {['情侣约会', '商务宴请', '带娃吃饭'].map(v => <Chip key={v} category="scenario" value={v} />)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-gray-800">营业时间</h3>
            <div className="flex gap-2 flex-wrap">
              {['0-5时', '21-24时', '24小时营业', '营业中'].map(v => <Chip key={v} category="hours" value={v} />)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-gray-800">用餐人数</h3>
            <div className="flex gap-2 flex-wrap">
              {['单人餐', '双人餐', '3-4人餐', '5人以上'].map(v => <Chip key={v} category="people" value={v} />)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3 text-gray-800">基础设施</h3>
            <div className="flex gap-2 flex-wrap">
              {['可停车', '有包间'].map(v => <Chip key={v} category="facilities" value={v} />)}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={() => { setFilters({}); setMinPrice(0); setMaxPrice(350); }} className="w-1/3 py-3 rounded-full text-base font-bold bg-gray-100 text-gray-700">重置</button>
          <button onClick={() => { onApply({ ...filters, minPrice, maxPrice }); onClose(); }} className="w-2/3 py-3 rounded-full text-base font-bold bg-blue-500 text-white shadow-md">确定</button>
        </div>
      </div>
    </div>
  );
}
