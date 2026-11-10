import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type PickedUserImage = {
  uri: string;
  mimeType: 'image/jpeg';
  fileName: string;
};

export async function pickUserImage(): Promise<PickedUserImage | null> {
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
  const result = await image.saveAsync({ compress: 0.72, format: ImageManipulator.SaveFormat.JPEG });
  return { uri: result.uri, mimeType: 'image/jpeg', fileName: `avatar-${Date.now()}.jpg` };
}
