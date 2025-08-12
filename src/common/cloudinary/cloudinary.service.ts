import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from "cloudinary"
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {

    constructor(
        private configService: ConfigService
    ) {
        cloudinary.config({
            api_key: this.configService.get("CLOUDINARY_API_KEY"),
            cloud_name: this.configService.get("CLOUDINARY_CLOUD_NAME"),
            api_secret: this.configService.get("CLOUDINARY_API_SECRET")
        })
    }

    async uploadFile(file): Promise<UploadApiResponse | undefined> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                { folder: 'user_apis' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                },
            );
            Readable.from(file.buffer).pipe(upload);
        });
    }

    async deleteFile(publicId: string): Promise<any> {
        return cloudinary.uploader.destroy(publicId);
    }

}
