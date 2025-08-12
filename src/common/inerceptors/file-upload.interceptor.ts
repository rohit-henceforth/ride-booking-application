import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export function UploadInterceptor() {
  return FileInterceptor('file', {
    storage: memoryStorage(),
  })
}
