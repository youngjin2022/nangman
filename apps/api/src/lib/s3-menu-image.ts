/**
 * 관리자 메뉴 이미지 → 객체 스토리지 업로드 (PutObject).
 * - AWS S3: 기본 SDK 설정 (리전 + 버킷).
 * - Cloudflare R2: R2_ENDPOINT + 동일 키/버킷 + region `auto`. 공개 URL은 S3_PUBLIC_BASE_URL 필수.
 * DB에는 반환된 공개 URL만 저장.
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'node:crypto';

function extFromMime(mime: string): string {
  const m = mime.toLowerCase().split(';')[0]!.trim();
  if (m === 'image/jpeg' || m === 'image/jpg') return '.jpg';
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  return '.jpg';
}

let client: S3Client | null = null;

/** R2_ENDPOINT 우선, 없으면 S3_ENDPOINT (MinIO 등 S3 호환용) */
function getCustomEndpoint(): string {
  const raw = process.env.R2_ENDPOINT ?? process.env.S3_ENDPOINT ?? '';
  return raw.trim().replace(/\/$/, '');
}

function usesCustomEndpoint(): boolean {
  return getCustomEndpoint().length > 0;
}

function getRegionForClient(): string {
  return usesCustomEndpoint() ? 'auto' : getAwsRegion();
}

function getAwsRegion(): string {
  return process.env.AWS_REGION ?? 'ap-northeast-2';
}

/** S3_BUCKET 우선, 없으면 S3_BUCKET_NAME */
function getBucket(): string {
  const raw = process.env.S3_BUCKET ?? process.env.S3_BUCKET_NAME ?? '';
  return raw.trim();
}

function getPublicBaseUrl(): string {
  return process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/$/, '') ?? '';
}

/** 503 진단용 · Railway에 무엇을 더 넣어야 할지 (값은 노출하지 않음) */
export function getMenuUploadConfigGaps(): string[] {
  const gaps: string[] = [];
  if (!process.env.AWS_ACCESS_KEY_ID?.trim()) gaps.push('AWS_ACCESS_KEY_ID');
  if (!process.env.AWS_SECRET_ACCESS_KEY?.trim()) gaps.push('AWS_SECRET_ACCESS_KEY');
  if (!getBucket()) gaps.push('S3_BUCKET 또는 S3_BUCKET_NAME');
  if (usesCustomEndpoint() && !getPublicBaseUrl()) gaps.push('S3_PUBLIC_BASE_URL');
  return gaps;
}

/**
 * R2·MinIO 등 커스텀 엔드포인트 사용 시 공개 URL 베이스가 없으면
 * 브라우저용 imageUrl을 안정적으로 만들 수 없음.
 */
export function isS3MenuUploadConfigured(): boolean {
  return getMenuUploadConfigGaps().length === 0;
}

export function getS3Client(): S3Client {
  if (!client) {
    const endpoint = getCustomEndpoint();
    client = new S3Client({
      region: getRegionForClient(),
      ...(endpoint
        ? {
            endpoint,
          }
        : {}),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

/** 브라우저에서 바로 열 수 있는 공개 URL */
export function buildPublicMenuImageUrl(key: string): string {
  const customBase = getPublicBaseUrl();
  const bucket = getBucket();
  const region = getAwsRegion();

  if (customBase) {
    return `${customBase}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
  if (usesCustomEndpoint()) {
    throw new Error('S3_PUBLIC_BASE_URL이 설정되어 있지 않아 공개 URL을 만들 수 없습니다.');
  }
  const pathForUrl = encodeURIComponent(key).replace(/%2F/g, '/');
  return `https://${bucket}.s3.${region}.amazonaws.com/${pathForUrl}`;
}

export async function uploadMenuImageToS3(params: {
  storeId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ key: string; imageUrl: string }> {
  if (!isS3MenuUploadConfigured()) {
    throw new Error('S3_NOT_CONFIGURED');
  }

  const bucket = getBucket();
  const suffix = `${Date.now()}-${randomBytes(8).toString('hex')}${extFromMime(params.contentType)}`;
  const key = `${params.storeId}/menus/${suffix}`;
  const contentTypeClean = params.contentType.split(';')[0]?.trim() ?? 'application/octet-stream';

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.buffer,
      ContentType: contentTypeClean,
      CacheControl: 'public, max-age=31536000',
    }),
  );

  const imageUrl = buildPublicMenuImageUrl(key);
  return { key, imageUrl };
}
