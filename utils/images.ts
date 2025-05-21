import listingImages from '../assets/images/listing-images';

// Get the first image as default
export const defaultImage = Object.values(listingImages)[0];

export const getImageSource = (filename: string) => {
  if (!filename) return defaultImage;
  return listingImages[filename as keyof typeof listingImages] || defaultImage;
};
