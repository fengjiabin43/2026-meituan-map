import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import RestaurantPopup from './RestaurantPopup';
import { CATEGORIES, BRAND_NAMES } from './constants';
import FilterModal from './FilterModal';
import AIAssistant from './AIAssistant';

// Removed marker icon override to fix Leaflet errors

// Component to dynamically update map view based on state changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
      duration: 1.5
    });
  }, [center, zoom, map]);
  return null;
}

interface Restaurant {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  priceRange: string;
  price: number;
  location: { lat: number; lng: number };
  rating: number;
  quality: string[];
  service: string[];
  scenario: string[];
  hours: string[];
  people: string[];
  facilities: string[];
  lastComment?: {
    userAvatar: string;
    userName: string;
    text: string;
  };
}

export default function App() {
  const defaultPosition: [number, number] = [39.99, 116.32]; // Center of Beijing university area
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultPosition);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [highlightedRestaurantId, setHighlightedRestaurantId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({});
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // New UI states for top bar dropdowns
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'nearby' | 'sort' | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('全部美食');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Generate 200 mock restaurants
      const mockRestaurants: Restaurant[] = [];
      const categoriesList = Object.keys(CATEGORIES);
      const priceRanges = ['¥', '¥¥', '¥¥¥'];
      const universities = [
        { name: '北京大学', lat: 39.99, lng: 116.31 },
        { name: '清华大学', lat: 40.00, lng: 116.33 },
        { name: '中国人民大学', lat: 39.97, lng: 116.32 },
        { name: '北京交通大学', lat: 39.95, lng: 116.33 },
        { name: '北京师范大学', lat: 39.96, lng: 116.36 },
      ];

      for (let i = 0; i < 200; i++) {
        const uni = universities[Math.floor(Math.random() * universities.length)];
        const lat = uni.lat + (Math.random() - 0.5) * 0.05;
        const lng = uni.lng + (Math.random() - 0.5) * 0.05;
        const category = categoriesList[Math.floor(Math.random() * categoriesList.length)];
        const subCategories = CATEGORIES[category as keyof typeof CATEGORIES];
        const subCategory = subCategories[Math.floor(Math.random() * subCategories.length)];
        
        // Construct realistic names
        const brands = BRAND_NAMES[category] || [category + '店'];
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const branchSuffix = Math.random() > 0.5 ? `(${uni.name}店)` : (Math.random() > 0.5 ? '·精选店' : '');
        const finalName = `${brand}${branchSuffix}`;
        
        mockRestaurants.push({
          id: `mock-${i}`,
          name: finalName,
          category,
          subCategory,
          priceRange: priceRanges[Math.floor(Math.random() * priceRanges.length)],
          price: Math.floor(Math.random() * 200) + 20,
          location: { lat, lng },
          rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
          quality: ['高分餐厅', '黑珍珠', '必吃榜'].filter(() => Math.random() > 0.5),
          service: ['在线订座', '在线排队', '外卖', '在线点'].filter(() => Math.random() > 0.5),
          scenario: ['情侣约会', '商务宴请', '带娃吃饭'].filter(() => Math.random() > 0.5),
          hours: ['0-5时', '21-24时', '24小时营业', '营业中'].filter(() => Math.random() > 0.5),
          people: ['单人餐', '双人餐', '3-4人餐', '5人以上'].filter(() => Math.random() > 0.5),
          facilities: ['可停车', '有包间'].filter(() => Math.random() > 0.5),
          lastComment: i % 3 === 0 ? {
            userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
            userName: `用户${i}`,
            text: '这家店味道不错，推荐！'
          } : undefined
        });
      }
      setRestaurants(mockRestaurants);
    };
    fetchData();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const filtered = restaurants.filter(r => {
      let matchCategory = true;
      if (categoryFilter !== '全部' && categoryFilter !== '附近') {
        if (categoryFilter === '高分餐厅') {
          matchCategory = r.quality.includes('高分餐厅');
        } else {
          matchCategory = r.category === categoryFilter || r.subCategory === categoryFilter;
        }
      }
      
      const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply filters from FilterModal
      const matchFilters = Object.entries(filters).every(([category, values]) => {
        if (category === 'minPrice' || category === 'maxPrice') return true; // Handled below
        if (!values || (values as string[]).length === 0) return true;
        
        // Handle sort logic separately
        if (category === 'sort') return true;

        return (values as string[]).some(v => r[category as keyof Restaurant]?.includes(v as never));
      });
      
      const pMin = (filters as any).minPrice ?? 0;
      const pMax = (filters as any).maxPrice ?? 350;
      const matchPrice = r.price >= pMin && (pMax >= 350 || r.price <= pMax);

      return matchCategory && matchSearch && matchFilters && matchPrice;
    });

    // Apply sorting
    if (filters.sort && (filters.sort as string[]).length > 0) {
      const activeSort = (filters.sort as string[])[0]; // Assuming single sort works
      filtered.sort((a, b) => {
        if (activeSort === '好评优先') return b.rating - a.rating;
        if (activeSort === '低价优先') return a.price - b.price;
        if (activeSort === '高价优先') return b.price - a.price;
        // Mock '距离优先' using location data differences simply
        if (activeSort === '距离优先') {
           const distA = Math.abs(a.location.lat - mapCenter[0]) + Math.abs(a.location.lng - mapCenter[1]);
           const distB = Math.abs(b.location.lat - mapCenter[0]) + Math.abs(b.location.lng - mapCenter[1]);
           return distA - distB;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [restaurants, categoryFilter, searchQuery, filters]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <header className="p-3 bg-white shadow-sm z-[1000] relative flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="输入地点搜周边" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="p-2 bg-gray-100 rounded-full flex-grow text-sm"
          />
          {user ? (
            <button onClick={handleLogout} className="text-sm">退出</button>
          ) : (
            <button onClick={handleLogin} className="text-sm text-blue-500">登录</button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 text-sm scrollbar-hide relative" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')} 
            className={`px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${['全部', '粤菜', '高分餐厅', '附近'].includes(categoryFilter) == false ? 'bg-blue-50 text-blue-600 font-bold' : (activeDropdown === 'category' ? 'bg-gray-200 font-bold' : 'bg-gray-50')}`}
          >
            {['全部', '粤菜', '高分餐厅', '附近'].includes(categoryFilter) ? '全部' : categoryFilter} 
            <span className="text-[10px]">{activeDropdown === 'category' ? '▴' : '▾'}</span>
          </button>
          
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'nearby' ? null : 'nearby')} 
            className={`px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${categoryFilter === '附近' ? 'bg-blue-50 text-blue-600 font-bold' : (activeDropdown === 'nearby' ? 'bg-gray-200 font-bold' : 'bg-gray-50')}`}
          >
            附近 <span className="text-[10px]">{activeDropdown === 'nearby' ? '▴' : '▾'}</span>
          </button>
          
          <button 
            onClick={() => { setCategoryFilter('粤菜'); setActiveDropdown(null); }} 
            className={`px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${categoryFilter === '粤菜' ? 'bg-red-50 text-red-600 font-bold' : 'bg-gray-50'}`}
          >粤菜</button>
          
          <button 
            onClick={() => { setCategoryFilter('高分餐厅'); setActiveDropdown(null); }} 
            className={`px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${categoryFilter === '高分餐厅' ? 'bg-red-50 text-red-600 font-bold' : 'bg-gray-50'}`}
          >高分餐厅</button>
          
          {['饮品', '火锅', '小吃快餐', '面包甜点'].map(cat => (
            <button key={cat} onClick={() => { setCategoryFilter(cat); setActiveDropdown(null); }} className={`px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${categoryFilter === cat ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-gray-50'}`}>{cat}</button>
          ))}
          <button onClick={() => {setIsFilterModalOpen(true); setActiveDropdown(null);}} className="px-3 py-1.5 bg-gray-50 rounded-full whitespace-nowrap flex-shrink-0 flex items-center gap-1">筛选 <span className="text-[10px]">▾</span></button>
        </div>
        
        {/* Category Dropdown */}
        {activeDropdown === 'category' && (
          <div className="absolute top-[104px] left-0 w-full bg-white shadow-xl z-50 flex h-[350px] text-sm border-t border-gray-100">
            {/* Left side: Main Categories */}
            <div className="w-1/3 bg-gray-50 overflow-y-auto">
              {['全部美食', ...Object.keys(CATEGORIES)].map(mainCat => (
                <div 
                  key={mainCat} 
                  onClick={() => setSelectedMainCategory(mainCat)}
                  className={`px-4 py-3 ${selectedMainCategory === mainCat ? 'bg-white font-bold' : 'text-gray-600'}`}
                >
                  {mainCat}
                </div>
              ))}
            </div>
            {/* Right side: Sub Categories */}
            <div className="w-2/3 bg-white overflow-y-auto pl-4">
              <div 
                onClick={() => { setCategoryFilter(selectedMainCategory === '全部美食' ? '全部' : selectedMainCategory); setActiveDropdown(null); }}
                className={`flex items-center justify-between px-4 py-3 border-b border-gray-50 ${categoryFilter === (selectedMainCategory === '全部美食' ? '全部' : selectedMainCategory) ? 'text-blue-500 font-bold' : 'text-gray-800'}`}
              >
                全部{selectedMainCategory === '全部美食' ? '' : selectedMainCategory}
                {categoryFilter === (selectedMainCategory === '全部美食' ? '全部' : selectedMainCategory) && <span>✓</span>}
              </div>
              {selectedMainCategory !== '全部美食' && CATEGORIES[selectedMainCategory as keyof typeof CATEGORIES]?.map(subCat => (
                <div 
                  key={subCat}
                  onClick={() => { setCategoryFilter(subCat); setActiveDropdown(null); }}
                  className={`flex items-center justify-between px-4 py-3 border-b border-gray-50 ${categoryFilter === subCat ? 'text-blue-500 font-bold' : 'text-gray-800'}`}
                >
                  {subCat}
                  {categoryFilter === subCat && <span>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Dropdown */}
        {activeDropdown === 'nearby' && (
          <div className="absolute top-[104px] left-0 w-full bg-white shadow-xl z-50 flex h-[250px] text-sm border-t border-gray-100">
             <div className="w-1/3 bg-gray-50 overflow-y-auto">
               <div className="px-4 py-3 bg-white font-bold">步行范围</div>
               <div className="px-4 py-3 text-gray-600">直线距离</div>
               <div className="px-4 py-3 text-gray-600">行政区/商圈</div>
               <div className="px-4 py-3 text-gray-600">地铁线</div>
             </div>
             <div className="w-2/3 bg-white overflow-y-auto pl-4">
               {['不限', '步行5分钟', '步行10分钟', '步行15分钟'].map(dist => (
                  <div key={dist} onClick={() => { setCategoryFilter(dist === '不限' ? '附近' : dist); setActiveDropdown(null); }} className="flex justify-between items-center px-4 py-3 border-b border-gray-50 text-gray-800">
                    <span className={dist === '不限' ? 'text-blue-500' : ''}>{dist}</span>
                    {dist === '不限' && <span className="w-4 h-4 bg-blue-500 rounded-full text-white text-[10px] flex items-center justify-center">✓</span>}
                  </div>
               ))}
             </div>
          </div>
        )}
      </header>
      
      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        onApply={(f) => setFilters(f)}
        currentFilters={filters}
      />

      <main className="flex-grow relative z-0">
        <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full">
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          <TileLayer
            url="https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            attribution='&copy; <a href="https://ditu.amap.com/">高德地图</a>'
          />
          {filteredRestaurants.map(restaurant => {
            const isHighlighted = restaurant.id === highlightedRestaurantId;
            const markerZIndex = isHighlighted ? 'z-[1000]' : 'z-10';
            const markerScale = isHighlighted ? 'scale-110' : 'hover:scale-110';
            const markerGlow = isHighlighted ? 'ring-4 ring-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.8)]' : 'shadow-md';
            
            const customIcon = L.divIcon({
              html: `
                <div class="relative flex flex-col items-center transition-all duration-300 ${markerScale} ${markerZIndex}" style="transform: translate(-50%, -100%); width: max-content;">
                  <div class="bg-white rounded-full ${markerGlow} border border-gray-100 flex items-center relative z-20 px-2.5 py-1.5 gap-2 w-max transition-shadow">
                    <div class="flex items-center gap-1">
                      <div class="w-5 h-5 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 text-[11px] shadow-inner font-normal">🍴</div>
                      <span class="text-[13px] font-bold text-orange-500">${restaurant.rating.toFixed(1)}分</span>
                    </div>
                    ${restaurant.lastComment ? `
                      <div class="w-px h-4 bg-gray-200"></div>
                      <div class="flex items-center gap-1.5">
                        <img src="${restaurant.lastComment.userAvatar}" class="w-5 h-5 rounded-full border border-gray-100 shadow-sm" />
                        <div class="truncate max-w-[90px] text-xs text-gray-700 font-bold">${restaurant.lastComment.userName}推荐</div>
                      </div>
                    ` : ''}
                    <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-100 shadow-sm -z-10"></div>
                  </div>
                  <div class="mt-1.5 text-center font-bold text-gray-900" style="text-shadow: 0px 0px 2px white, 0px 0px 4px white, 0px 0px 6px white;">
                    <div class="text-sm leading-tight">${restaurant.name}</div>
                    <div class="text-xs text-gray-700 font-normal leading-tight mt-0.5">¥${restaurant.price}/人</div>
                  </div>
                </div>
              `,
              className: 'custom-marker',
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            });

            return (
              <Marker 
                key={restaurant.id} 
                position={[restaurant.location.lat, restaurant.location.lng]}
                icon={customIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-bold text-lg">{restaurant.name}</div>
                      <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        {restaurant.rating}分
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <div>{restaurant.category} · {restaurant.subCategory}</div>
                      <div>人均: ¥{restaurant.price}</div>
                    </div>

                    {restaurant.lastComment && (
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <img src={restaurant.lastComment.userAvatar} className="w-6 h-6 rounded-full" alt="avatar" />
                          <span className="font-bold text-xs">{restaurant.lastComment.userName}</span>
                        </div>
                        <div className="text-xs text-gray-700">{restaurant.lastComment.text}</div>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <RestaurantPopup restaurantId={restaurant.id} user={user} />
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        
        {/* Floating AI Assistant */}
        <AIAssistant 
          restaurants={filteredRestaurants} 
          onSuggestRestaurant={(restaurant) => {
             setMapCenter([restaurant.location.lat, restaurant.location.lng]);
             setMapZoom(16);
             setHighlightedRestaurantId(restaurant.id);
          }} 
        />
      </main>
    </div>
  );
}
