import { Alert, Platform } from 'react-native';

export enum ModalType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning'
}

/**
 * Shows feedback to the user across different platforms
 * - On web (both desktop and mobile): Uses modal
 * - On native platforms (iOS, Android): Uses native Alert
 */
export const showFeedback = (
  title: string,
  message: string,
  type: ModalType,
  setShowModal: (show: boolean) => void,
  setTitle: (title: string) => void,
  setMessage: (message: string) => void,
  setType: (type: ModalType) => void
) => {
  if (Platform.OS === 'web') {
    // For web (both desktop and mobile web)
    setTitle(title);
    setMessage(message);
    setType(type);
    setShowModal(true);
  } else {
    // For native platforms (iOS, Android)
    Alert.alert(title, message);
  }
}; 