export interface ParsedAudioFile {
  title: string;
  artist: string;
  duration: number;
}

export function parseFilenameToMeta(filename: string): { title: string; artist: string } {
  // Remove extension
  const cleanName = filename.replace(/\.[^/.]+$/, '').trim();

  // Try split by ' - ' (Artist - Title or Title - Artist)
  if (cleanName.includes(' - ')) {
    const parts = cleanName.split(' - ');
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(' - ').trim(),
      };
    }
  }

  // Try split by '_' or '-'
  return {
    title: cleanName,
    artist: '',
  };
}

export async function probeAudioDuration(file: File | Blob | string): Promise<number> {
  return new Promise((resolve) => {
    let url = '';
    if (typeof file === 'string') {
      url = file;
    } else {
      url = URL.createObjectURL(file);
    }

    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanUp = () => {
      if (typeof file !== 'string') {
        URL.revokeObjectURL(url);
      }
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };

    const onLoaded = () => {
      const dur = audio.duration;
      cleanUp();
      resolve(Number.isFinite(dur) ? Math.round(dur) : 0);
    };

    const onError = () => {
      cleanUp();
      resolve(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = url;

    // Timeout safety
    setTimeout(() => {
      cleanUp();
      resolve(0);
    }, 8000);
  });
}
