import { fileURLToPath } from 'node:url';
import { defineConfig, normalizePath } from 'vite';
import { loadPilesStory, storyFile } from './scripts/load-piles-story.js';

const storyPath = normalizePath(fileURLToPath(storyFile));

export default defineConfig({
  plugins: [
    {
      name: 'dust-offering-story',
      load(id) {
        if (id !== storyPath) return;
        this.addWatchFile(id);
        return `export default ${JSON.stringify(loadPilesStory())};`;
      },
    },
  ],
  build: {
    rollupOptions: {
      input: { game: 'index.html', lab: 'lab.html', pour: 'pour.html' },
    },
  },
});
