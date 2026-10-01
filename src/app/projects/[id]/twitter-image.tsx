import ogImage, { size as ogSize, contentType as ogContentType } from '../../project/[id]/opengraph-image';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const size = ogSize;
export const contentType = ogContentType;
export default ogImage;
