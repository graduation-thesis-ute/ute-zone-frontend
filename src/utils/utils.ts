const base64ToBlob = (base64: string, type = "image/jpeg") => {
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteString = atob(base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type });
};

export const uploadImage = async (
  image: File | string | null,
  post: (url: string, data: any) => Promise<any>
) => {
  if (image) {
    const formData = new FormData();
    if (image instanceof File) {
      formData.append("file", image, image.name);
    } else {
      const imageBlob = base64ToBlob(image);
      formData.append("file", imageBlob, "profile_picture.jpg");
    }
    const uploadResponse = await post("/v1/file/upload", formData);
    if (uploadResponse.data) {
      return uploadResponse.data.url;
    }
  }
  return null;
}; 