import { uploadImageFile, uploadImageDataUri } from '../firebase/cloudFunctions';

export const UPLOAD_PURPOSES = {
  avatar: 'avatar',
  feeProof: 'fee-proof',
  logo: 'logo',
  complaint: 'complaint',
};

export const uploadAvatarFile = (file) => uploadImageFile(UPLOAD_PURPOSES.avatar, file);

export const uploadFeeProof = (file) => uploadImageFile(UPLOAD_PURPOSES.feeProof, file);

export const uploadComplaintImage = (dataUri) => uploadImageDataUri(UPLOAD_PURPOSES.complaint, dataUri);

export const uploadLogo = (dataUri) => uploadImageDataUri(UPLOAD_PURPOSES.logo, dataUri);