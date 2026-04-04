import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

type UploadInput = {
  productId: string;
  file: Express.Multer.File;
};

@Injectable()
export class R2StorageService {
  private readonly accountId: string | undefined;
  private readonly bucketName: string | undefined;
  private readonly accessKeyId: string | undefined;
  private readonly secretAccessKey: string | undefined;
  private readonly publicUrl: string | undefined;
  private readonly endpoint: string | undefined;
  private client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {
    this.accountId = this.configService.get<string>('CLOUDFLARE_R2_ACCOUNT_ID');
    this.bucketName = this.configService.get<string>(
      'CLOUDFLARE_R2_BUCKET_NAME',
    );
    this.accessKeyId = this.configService.get<string>(
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
    );
    this.secretAccessKey = this.configService.get<string>(
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    );
    this.publicUrl = this.configService
      .get<string>('CLOUDFLARE_R2_PUBLIC_URL')
      ?.replace(/\/$/, '');

    const configuredEndpoint = this.configService
      .get<string>('CLOUDFLARE_R2_ENDPOINT')
      ?.replace(/\/$/, '');

    this.endpoint =
      configuredEndpoint ??
      (this.accountId
        ? `https://${this.accountId}.r2.cloudflarestorage.com`
        : undefined);
  }

  async uploadProductImage({ productId, file }: UploadInput) {
    const key = this.buildStorageKey(productId, file.originalname);

    await this.getClient().send(
      new PutObjectCommand({
        Bucket: this.getBucketName(),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      storageKey: key,
      url: this.resolveFileUrl(key),
      filename: file.originalname,
    };
  }

  async removeFile(storageKey: string) {
    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: this.getBucketName(),
        Key: storageKey,
      }),
    );
  }

  async removeFiles(storageKeys: string[]) {
    for (const storageKey of storageKeys) {
      await this.removeFile(storageKey);
    }
  }

  private getClient() {
    if (
      !this.bucketName ||
      !this.accessKeyId ||
      !this.secretAccessKey ||
      !this.endpoint
    ) {
      throw new ServiceUnavailableException(
        'Cloudflare R2 nao configurado. Preencha as variaveis de ambiente do storage.',
      );
    }

    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
    }

    return this.client;
  }

  private getBucketName() {
    if (!this.bucketName) {
      throw new InternalServerErrorException(
        'Bucket do Cloudflare R2 nao configurado.',
      );
    }

    return this.bucketName;
  }

  private buildStorageKey(productId: string, filename: string) {
    const extension = extname(filename).toLowerCase() || '.bin';
    return `products/${productId}/${Date.now()}-${randomUUID()}${extension}`;
  }

  resolveFileUrl(storageKey: string) {
    if (this.publicUrl) {
      return `${this.publicUrl}/${storageKey}`;
    }

    if (!this.endpoint || !this.bucketName) {
      throw new InternalServerErrorException(
        'URL publica do Cloudflare R2 nao configurada.',
      );
    }

    return `${this.endpoint}/${this.bucketName}/${storageKey}`;
  }
}
