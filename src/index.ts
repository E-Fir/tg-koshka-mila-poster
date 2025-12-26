#!/usr/bin/env node

import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PHOTOS_DIR = path.join(__dirname, '..', 'photos');

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
  return token;
}

function getChannelId(): string {
  const id = process.env.TELEGRAM_CHANNEL_ID;
  if (!id) throw new Error('TELEGRAM_CHANNEL_ID not set');
  return id;
}

async function getRandomPhoto(): Promise<string | null> {
  const files = await fs.readdir(PHOTOS_DIR);
  const photos = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  if (photos.length === 0) return null;
  const random = photos[Math.floor(Math.random() * photos.length)];
  return path.join(PHOTOS_DIR, random);
}

async function getCaption(photoPath: string): Promise<string> {
  const txtPath = photoPath.replace(/\.(jpg|jpeg|png)$/i, '.txt');
  try {
    return await fs.readFile(txtPath, 'utf8');
  } catch {
    return '';
  }
}

async function sendPhoto(photoPath: string): Promise<void> {
  const bot = new TelegramBot(getToken());
  const channelId = getChannelId();
  const caption = await getCaption(photoPath);

  console.log(`Sending photo: ${path.basename(photoPath)}`);
  if (caption) console.log(`Caption: ${caption.substring(0, 50)}...`);

  await bot.sendPhoto(channelId, photoPath, { caption });
  console.log('Photo sent successfully');
}

async function deletePhoto(photoPath: string): Promise<void> {
  await fs.unlink(photoPath);
  console.log(`Deleted: ${path.basename(photoPath)}`);

  const txtPath = photoPath.replace(/\.(jpg|jpeg|png)$/i, '.txt');
  try {
    await fs.unlink(txtPath);
    console.log(`Deleted: ${path.basename(txtPath)}`);
  } catch {
    // txt file may not exist
  }
}

async function main(): Promise<void> {
  const photo = await getRandomPhoto();

  if (!photo) {
    console.log('No photos left in queue');
    return;
  }

  await sendPhoto(photo);
  await deletePhoto(photo);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
