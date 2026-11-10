import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const MAX_BASE64_BYTES = 10 * 1024 * 1024;

export async function pickUserImage(): Promise<string | null> {
  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (selection.canceled || !selection.assets[0]) return null;

  const asset = selection.assets[0];
  const image = await ImageManipulator.ImageManipulator
    .manipulate(asset.uri, { maxWidth: 1200, maxHeight: 1200 })
    .renderAsync();
  const result = await image.saveAsync({ base64: true, compress: 0.72, format: ImageManipulator.SaveFormat.JPEG });
  if (!result.base64) throw new Error('Không thể đọc dữ liệu ảnh đã chọn.');
  if (result.base64.length * 0.75 > MAX_BASE64_BYTES) {
    throw new Error('Ảnh sau khi nén vẫn vượt quá giới hạn 10 MB. Hãy chọn ảnh khác.');
  }
  return `data:image/jpeg;base64,${result.base64}`;
}
