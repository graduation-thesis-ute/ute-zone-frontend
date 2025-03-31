// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Loader2, Upload, X } from 'lucide-react';
// import useFetch from '../../hooks/useFetch';

// interface CreatePageForm {
//   name: string;
//   description: string;
//   category: string;
//   avatarUrl: string;
//   coverUrl: string;
// }

// const CreatePage: React.FC = () => {
//   const navigate = useNavigate();
//   const { post } = useFetch();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
//   const [coverPreview, setCoverPreview] = useState<string | null>(null);
//   const [formData, setFormData] = useState<CreatePageForm>({
//     name: '',
//     description: '',
//     category: '',
//     avatarUrl: '',
//     coverUrl: ''
//   });

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       setIsLoading(true);
//       setError(null);

//       // Create FormData for file upload
//       const formData = new FormData();
//       formData.append('file', file);

//      if (avaterUrl){}
      
//       if (response.data && response.data.url) {
//         // Update form data with the uploaded image URL
//         setFormData(prev => ({
//           ...prev,
//           [type === 'avatar' ? 'avatarUrl' : 'coverUrl']: response.data.url
//         }));

//         // Create preview URL
//         const previewUrl = URL.createObjectURL(file);
//         if (type === 'avatar') {
//           setAvatarPreview(previewUrl);
//         } else {
//           setCoverPreview(previewUrl);
//         }
//       } else {
//         throw new Error('No URL in response');
//       }
//     } catch (err) {
//       setError('Failed to upload image. Please try again.');
//       console.error('Upload error:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       setIsLoading(true);
//       setError(null);

//       const response = await post('/v1/page/create', formData);
      
//       if (response.data) {
//         navigate(`/page/${response.data._id}`);
//       }
//     } catch (err) {
//       setError('Failed to create page. Please try again.');
//       console.error('Create page error:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRemoveImage = (type: 'avatar' | 'cover') => {
//     if (type === 'avatar') {
//       setAvatarPreview(null);
//       setFormData(prev => ({ ...prev, avatarUrl: '' }));
//     } else {
//       setCoverPreview(null);
//       setFormData(prev => ({ ...prev, coverUrl: '' }));
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-3xl mx-auto">
//         <div className="bg-white shadow-xl rounded-lg overflow-hidden">
//           <div className="px-6 py-8">
//             <h2 className="text-2xl font-bold text-gray-900 mb-8">Tạo trang mới</h2>

//             {error && (
//               <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//                 <p className="text-red-600">{error}</p>
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Cover Image Upload */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Ảnh bìa
//                 </label>
//                 <div className="relative">
//                   {coverPreview ? (
//                     <div className="relative h-48 rounded-lg overflow-hidden">
//                       <img
//                         src={coverPreview}
//                         alt="Cover preview"
//                         className="w-full h-full object-cover"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveImage('cover')}
//                         className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
//                       >
//                         <X size={16} />
//                       </button>
//                     </div>
//                   ) : (
//                     <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
//                       <label className="cursor-pointer flex flex-col items-center">
//                         <Upload className="h-12 w-12 text-gray-400" />
//                         <span className="mt-2 text-sm text-gray-600">
//                           Click để tải ảnh bìa
//                         </span>
//                         <input
//                           type="file"
//                           className="hidden"
//                           accept="image/*"
//                           onChange={(e) => handleImageUpload(e, 'cover')}
//                         />
//                       </label>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Avatar Upload */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Ảnh đại diện
//                 </label>
//                 <div className="relative">
//                   {avatarPreview ? (
//                     <div className="relative w-32 h-32 rounded-full overflow-hidden">
//                       <img
//                         src={avatarPreview}
//                         alt="Avatar preview"
//                         className="w-full h-full object-cover"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveImage('avatar')}
//                         className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
//                       >
//                         <X size={16} />
//                       </button>
//                     </div>
//                   ) : (
//                     <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
//                       <label className="cursor-pointer flex flex-col items-center">
//                         <Upload className="h-8 w-8 text-gray-400" />
//                         <span className="mt-2 text-sm text-gray-600">
//                           Click để tải ảnh đại diện
//                         </span>
//                         <input
//                           type="file"
//                           className="hidden"
//                           accept="image/*"
//                           onChange={(e) => handleImageUpload(e, 'avatar')}
//                         />
//                       </label>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Page Name */}
//               <div>
//                 <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//                   Tên trang
//                 </label>
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   required
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Description */}
//               <div>
//                 <label htmlFor="description" className="block text-sm font-medium text-gray-700">
//                   Mô tả
//                 </label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   rows={4}
//                   required
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Category */}
//               <div>
//                 <label htmlFor="category" className="block text-sm font-medium text-gray-700">
//                   Danh mục
//                 </label>
//                 <select
//                   id="category"
//                   name="category"
//                   required
//                   value={formData.category}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//                 >
//                   <option value="">Chọn danh mục</option>
//                   <option value="Giáo dục">Giáo dục</option>
//                   <option value="Công nghệ">Công nghệ</option>
//                   <option value="Thể thao">Thể thao</option>
//                   <option value="Giải trí">Giải trí</option>
//                   <option value="Kinh doanh">Kinh doanh</option>
//                   <option value="Khác">Khác</option>
//                 </select>
//               </div>

//               {/* Submit Button */}
//               <div className="flex justify-end">
//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//                 >
//                   {isLoading ? (
//                     <>
//                       <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
//                       Đang tạo...
//                     </>
//                   ) : (
//                     'Tạo trang'
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreatePage; 