import { useState } from 'react';
import { User } from 'firebase/auth';

interface Props {
  restaurantId: string;
  user: User | null;
}

export default function RestaurantPopup({ restaurantId, user }: Props) {
  const [comments, setComments] = useState<any[]>([
    { id: '1', comment: '这家店环境真不错！', rating: 5, userName: '热心食客' }
  ]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState('');

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setComments([...comments, { 
      id: Date.now().toString(), 
      comment, 
      rating,
      userName: user ? user.displayName || '已登录用户' : '游客'
    }]);
    setComment('');
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleAction = (action: string) => {
    setShowToast(`已成功发起${action}！`);
    setTimeout(() => setShowToast(''), 2000);
  };

  return (
    <div className="w-64 relative">
      {showToast && (
        <div className="absolute -top-10 left-0 right-0 bg-green-500 text-white text-center text-xs py-1.5 rounded-lg z-50 shadow-md">
          {showToast}
        </div>
      )}
      
      <div className="flex gap-2 mb-3">
        <button onClick={toggleFavorite} className={`flex-1 py-1.5 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${isFavorite ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-700 border border-transparent'}`}>
          {isFavorite ? '★ 已收藏' : '☆ 收藏'}
        </button>
        <button onClick={() => handleAction('排队')} className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold border border-blue-100">
          排队
        </button>
        <button onClick={() => handleAction('预订')} className="flex-1 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-bold shadow-sm">
          点餐
        </button>
      </div>
      
      <div className="max-h-32 overflow-y-auto mb-3 bg-gray-50 rounded-lg border border-gray-100 p-2">
        {comments.map(c => (
          <div key={c.id} className="text-xs border-b border-gray-200 last:border-0 py-1.5">
            <span className="font-bold text-gray-700 mr-1">{c.userName}:</span>
            <span className="text-gray-600">{c.comment} <span className="text-orange-400">{'★'.repeat(c.rating)}</span></span>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
           <input type="number" value={rating} onChange={e => setRating(Number(e.target.value))} min={1} max={5} className="w-16 border rounded-lg p-1.5 text-sm bg-gray-50 focus:bg-white focus:outline-blue-500" placeholder="星级" title="评分 1-5" />
           <input value={comment} onChange={e => setComment(e.target.value)} placeholder="评价一下这只餐厅..." className="flex-1 border rounded-lg p-1.5 text-sm bg-gray-50 focus:bg-white focus:outline-blue-500" />
        </div>
        <button onClick={handleAddComment} className="w-full bg-blue-500 hover:bg-blue-600 transition-colors text-white py-1.5 text-sm font-bold rounded-lg shadow-sm">
          发布评价
        </button>
      </div>
    </div>
  );
}
