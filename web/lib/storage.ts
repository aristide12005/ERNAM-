import { supabase } from './supabaseClient';

export async function uploadCourseContent(file: File, bucketName: string = 'course-content'): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Generate a unique file name to avoid collisions, preserving the original extension
    const fileExt = file.name.split('.').pop();
    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { url: null, error: error as Error };
  }
}
