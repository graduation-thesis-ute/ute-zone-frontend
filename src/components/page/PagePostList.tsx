// import React, { useState, useEffect } from 'react';
// import { formatDistanceToNow } from 'date-fns';
// import { vi } from 'date-fns/locale';
// import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
// import useFetch from '../../hooks/useFetch';

// interface PagePost {
//   _id: string;
//   content: string;
//   imageUrls: string[];
//   createdAt: string;
//   user: {
//     _id: string;
//     displayName: string;
//     avatarUrl: string | null;
//     role: {
//       systemRole: {
//         name: string;
//       };
//       pageRole: {
//         name: string;
//       };
//     };
//   };
//   totalReactions: number;
//   totalComments: number;
//   isReacted: number;
//   isOwner: number;
// }

// interface PagePostListProps {
//   pageId: string;
// }

// const PagePostList: React.FC<PagePostListProps> = ({ pageId }) => {
//   const [posts, setPosts] = useState<PagePost[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const { get } = useFetch();

//   useEffect(() => {
//     const fetchPosts = async () => {
//       try {
//         setIsLoading(true);
//         const response = await get(`/v1/page-post/list/${pageId}`, {
//           isPaged: '1',
//           page: '0',
//           size: '10'
//         });
//         setPosts(response.data.content);
//       } catch (error) {
//         console.error('Error fetching posts:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchPosts();
//   }, [pageId, get]);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-8">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {posts.map((post) => (
//         <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden">
//           {/* Post Header */}
//           <div className="flex items-center space-x-3 p-4">
//             <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
//               {post.user.avatarUrl ? (
//                 <img
//                   src={post.user.avatarUrl}
//                   alt={post.user.displayName}
//                   className="w-full h-full object-cover"
//                   onError={(e) => {
//                     const target = e.target as HTMLImageElement;
//                     target.style.display = 'none';
//                     target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
//                     target.parentElement!.innerHTML = `
//                       <span class="text-gray-500 text-sm">
//                         ${post.user.displayName.charAt(0).toUpperCase()}
//                       </span>
//                     `;
//                   }}
//                 />
//               ) : (
//                 <div className="w-full h-full flex items-center justify-center">
//                   <span className="text-gray-500 text-sm">
//                     {post.user.displayName.charAt(0).toUpperCase()}
//                   </span>
//                 </div>
//               )}
//             </div>
//             <div className="flex-1">
//               <div className="flex items-center space-x-2">
//                 <span className="font-semibold">{post.user.displayName}</span>
//                 <span className="text-gray-500">•</span>
//                 <span className="text-gray-500 text-sm">
//                   {formatDistanceToNow(new Date(post.createdAt), {
//                     addSuffix: true,
//                     locale: vi
//                   })}
//                 </span>
//               </div>
//             </div>
//             {post.isOwner === 1 && (
//               <button className="p-2 text-gray-400 hover:text-gray-600">
//                 <MoreHorizontal size={20} />
//               </button>
//             )}
//           </div>

//           {/* Post Content */}
//           <div className="px-4">
//             <p className="text-gray-800">{post.content}</p>
//           </div>

//           {/* Post Images */}
//           {post.imageUrls && post.imageUrls.length > 0 && (
//             <div className="mt-4">
//               <div className="grid grid-cols-2 gap-1">
//                 {post.imageUrls.map((image, index) => (
//                   <div key={index} className="relative h-48 bg-gray-100">
//                     <img
//                       src={image}
//                       alt={`Post image ${index + 1}`}
//                       className="w-full h-full object-cover"
//                       onError={(e) => {
//                         const target = e.target as HTMLImageElement;
//                         target.style.display = 'none';
//                         target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
//                         target.parentElement!.innerHTML = `
//                           <span class="text-gray-400 text-sm">Không thể tải ảnh</span>
//                         `;
//                       }}
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Post Stats */}
//           <div className="px-4 py-2 border-t border-b">
//             <div className="flex items-center space-x-4 text-sm text-gray-500">
//               <div className="flex items-center space-x-1">
//                 <Heart size={16} className={post.isReacted === 1 ? "text-red-500 fill-current" : ""} />
//                 <span>{post.totalReactions}</span>
//               </div>
//               <div className="flex items-center space-x-1">
//                 <MessageCircle size={16} />
//                 <span>{post.totalComments} bình luận</span>
//               </div>
//               <div className="flex items-center space-x-1">
//                 <Share2 size={16} />
//                 <span>Chia sẻ</span>
//               </div>
//             </div>
//           </div>

//           {/* Post Actions */}
//           <div className="flex items-center justify-between px-4 py-2">
//             <button className={`flex items-center space-x-2 flex-1 justify-center py-2 rounded-lg ${
//               post.isReacted === 1 ? 'text-red-500' : 'text-gray-500 hover:bg-gray-100'
//             }`}>
//               <Heart size={20} className={post.isReacted === 1 ? "fill-current" : ""} />
//               <span>Thích</span>
//             </button>
//             <button className="flex items-center space-x-2 flex-1 justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-100">
//               <MessageCircle size={20} />
//               <span>Bình luận</span>
//             </button>
//             <button className="flex items-center space-x-2 flex-1 justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-100">
//               <Share2 size={20} />
//               <span>Chia sẻ</span>
//             </button>
//           </div>
//         </div>
//       ))}

//       {posts.length === 0 && (
//         <div className="text-center py-12 bg-white rounded-lg shadow-md">
//           <p className="text-gray-500">Chưa có bài đăng nào</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PagePostList; 