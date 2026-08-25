"""Cloudflare R2 storage helpers for LINE-compatible media."""

from datetime import datetime
from urllib.parse import quote
import os
import uuid

from werkzeug.utils import secure_filename

import config


class R2StorageError(RuntimeError):
    pass


def is_configured():
    return all((
        config.R2_ACCOUNT_ID,
        config.R2_ACCESS_KEY_ID,
        config.R2_SECRET_ACCESS_KEY,
        config.R2_BUCKET_NAME,
        config.R2_PUBLIC_BASE_URL,
    ))


def _require_configured():
    if not is_configured():
        raise R2StorageError(
            'Cloudflare R2 尚未完成設定，請設定帳號、金鑰、Bucket 與公開網址'
        )
    if not config.R2_PUBLIC_BASE_URL.startswith('https://'):
        raise R2StorageError('R2 公開網址必須使用 HTTPS，LINE 才能載入影片')


def _client():
    _require_configured()
    try:
        import boto3
        from botocore.config import Config
    except ImportError as exc:
        raise R2StorageError('伺服器尚未安裝 R2 上傳元件 boto3') from exc

    return boto3.client(
        's3',
        endpoint_url=f'https://{config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=config.R2_ACCESS_KEY_ID,
        aws_secret_access_key=config.R2_SECRET_ACCESS_KEY,
        region_name='auto',
        config=Config(signature_version='s3v4'),
    )


def public_url(key):
    return f'{config.R2_PUBLIC_BASE_URL}/{quote(key, safe="/")}'


def storage_usage():
    """Return exact current object bytes by paging through the configured bucket."""
    quota_bytes = max(0, int(config.R2_DISPLAY_QUOTA_GB * 1024 ** 3))
    if not is_configured():
        return {
            'configured': False,
            'used_bytes': 0,
            'object_count': 0,
            'reference_quota_bytes': quota_bytes,
            'reference_remaining_bytes': quota_bytes,
            'is_hard_limit': False,
        }

    client = _client()
    used_bytes = 0
    object_count = 0
    try:
        paginator = client.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=config.R2_BUCKET_NAME):
            for item in page.get('Contents', []):
                used_bytes += int(item.get('Size', 0))
                object_count += 1
    except Exception as exc:
        raise R2StorageError(f'無法讀取 R2 容量：{exc}') from exc

    return {
        'configured': True,
        'bucket': config.R2_BUCKET_NAME,
        'used_bytes': used_bytes,
        'object_count': object_count,
        'reference_quota_bytes': quota_bytes,
        'reference_remaining_bytes': max(0, quota_bytes - used_bytes),
        'is_hard_limit': False,
    }


def upload_video_pair(video_file, preview_file, original_name):
    """Upload an MP4 and its JPEG/PNG preview, rolling back partial uploads."""
    client = _client()
    safe_stem = os.path.splitext(secure_filename(original_name))[0] or 'video'
    date_path = datetime.utcnow().strftime('%Y/%m')
    unique_id = uuid.uuid4().hex
    prefix = f'{config.R2_KEY_PREFIX}/' if config.R2_KEY_PREFIX else ''
    video_key = f'{prefix}videos/{date_path}/{unique_id}-{safe_stem}.mp4'
    preview_ext = '.png' if preview_file.mimetype == 'image/png' else '.jpg'
    preview_key = f'{prefix}previews/{date_path}/{unique_id}-{safe_stem}{preview_ext}'
    uploaded_keys = []

    try:
        video_file.stream.seek(0)
        client.upload_fileobj(
            video_file.stream,
            config.R2_BUCKET_NAME,
            video_key,
            ExtraArgs={
                'ContentType': 'video/mp4',
                'CacheControl': 'public, max-age=31536000, immutable',
            },
        )
        uploaded_keys.append(video_key)

        preview_file.stream.seek(0)
        client.upload_fileobj(
            preview_file.stream,
            config.R2_BUCKET_NAME,
            preview_key,
            ExtraArgs={
                'ContentType': preview_file.mimetype or 'image/jpeg',
                'CacheControl': 'public, max-age=31536000, immutable',
            },
        )
        uploaded_keys.append(preview_key)
    except Exception as exc:
        for key in uploaded_keys:
            try:
                client.delete_object(Bucket=config.R2_BUCKET_NAME, Key=key)
            except Exception:
                pass
        raise R2StorageError(f'影片上傳至 R2 失敗：{exc}') from exc

    return {
        'video_key': video_key,
        'preview_key': preview_key,
        'video_url': public_url(video_key),
        'preview_url': public_url(preview_key),
    }
