/**
 * images.js — Turns photos an admin picks into image sources the catalog can store.
 *
 * Uploaded files are resized and re-encoded in the browser so several photos
 * per item fit in localStorage. Links are only checked to load as an image;
 * the picture itself stays on the other website.
 */

const MAX_DIMENSION = 900;
const QUALITY = 0.85;
const LOAD_TIMEOUT_MS = 10000;

/** Loads `src` into an <img>, rejecting with `errorMessage` if it fails or takes too long. */
function loadImage(src, errorMessage) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => reject(new Error(errorMessage)), LOAD_TIMEOUT_MS);
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error(errorMessage));
    };
    image.src = src;
  });
}

/** Reads an image file from the computer and returns a resized data: URL. */
export async function fileToDataUrl(file) {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" isn't an image.`);

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl, `Couldn't read "${file.name}".`);
    // Some SVGs have no intrinsic size; give them a sensible one.
    const width = image.naturalWidth || MAX_DIMENSION;
    const height = image.naturalHeight || MAX_DIMENSION;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

    // WebP keeps transparency (sticker cutouts) at a fraction of PNG's size;
    // browsers that can't encode it return PNG instead.
    return canvas.toDataURL('image/webp', QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Reads up to `room` picked files into data: URLs.
 * Returns { sources, skipped } where `skipped` counts files that didn't fit.
 */
export async function filesToDataUrls(files, room) {
  const list = [...files];
  return {
    sources: await Promise.all(list.slice(0, Math.max(0, room)).map(fileToDataUrl)),
    skipped: Math.max(0, list.length - room),
  };
}

/** Checks that a pasted link is http(s) and actually loads as an image. Returns the cleaned link. */
export async function loadImageUrl(rawUrl) {
  const text = String(rawUrl ?? '').trim();
  if (!text) throw new Error('Paste an image link first.');

  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error("That doesn't look like a link.");
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use a link that starts with http:// or https://.');

  await loadImage(
    url.href,
    "Couldn't load a picture from that link. Right-click the image and choose \"Copy image address\".",
  );
  return url.href;
}
