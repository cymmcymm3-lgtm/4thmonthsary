# Our Little Scrapbook — enchanted book edition

A fourth-monthsary gift for my lovee Stephay, November 12, 2026 (Philippine time).

## Open the scrapbook

Open `dist/index.html` in a browser, or run `npm run dev` in this folder and open
`http://127.0.0.1:4173`. No dependency install or build is needed.
For an existing Live Server tab, press **Ctrl+F5** to load the updated files.

## What changed

- Swipe left/right on the paper, or drag it with a mouse. The page follows your hand.
- A two-sided 3D leaf turns around the book spine, with moving shading and a gentle bend.
- Short drags return to the current page; deliberate swipes complete the turn.
- Previous/next buttons, chapter buttons and keyboard arrow keys still work.
- Phone layouts use a single page; desktop layouts keep an open two-page spread.
- Each chapter has a different scrapbook composition, with its own floral details,
  tape, stamps, and glowing photoreal flowers.
- Assigned videos play directly inside their frames. They autoplay silently, loop,
  and cannot be clicked or controlled, so the book stays easy to swipe.
- Videos pause while the tab is hidden and restart automatically when it becomes
  visible again.
- The flower-surprise section, scratch-ticket ending and old footer have been removed.
- The gift opening, photo wall, video scrapbook, and photo stack remain.
- The lyric reel begins as a closed antique book, opens on Play, and turns through three lyric pages.
- The ending reveals an animated photorealistic hand offering flowers with “iloveyouuu princess steph”.
- Your own song can start with Play; pause/resume and replay control the story and song together.
- The former generated piano background music and its player have been removed.
- Reduced-motion preferences skip the animated turn.

## Add your videos

1. Copy your video into `dist/assets/videos/`, for example `memory-01.mp4`.
2. Open `dist/content.js`.
3. In `pages`, change a video's `src: ''` to:

   ```js
   src: 'assets/videos/memory-01.mp4'
   ```

4. Repeat for the other chapters if you want different clips. You may also use
   the same video path in several chapters. Keep unused chapters empty.
5. Save and refresh the page. Include the video files when you share or deploy the folder.

Use a browser-compatible MP4 (H.264 video / AAC audio) or WebM. An optional
`poster` image can provide a cover frame. Videos keep their original proportions.
No personal video is included yet; empty chapters show a designed placeholder.
For reliable autoplay, clips intentionally play muted; browsers block automatic
playback with sound.

To try a clip without changing the files, open
`http://127.0.0.1:4173/?edit=1#memories` and select a video below the book.
This is a temporary local preview; it is not saved or uploaded to the gift.

## Personalize the rest

Edit `dist/content.js` for the messages, photo paths, anniversary date and lyric-reel photo paths.
The scenery in the photo wall and lyric reel is sample imagery. No personal photos or song are included yet.

## Add the book's music

1. Put your song at `dist/assets/our-song.mp3`, or use an MP4 with an AAC audio track such as `dist/assets/our-song.mp4`.
2. In `dist/content.js`, set `lyricReel.music.src` to that asset path. An MP4 plays through the hidden audio player, so only its music is heard.
3. Adjust `music.startAt` (seconds into the song) and `duration` (milliseconds per lyric page).

The song starts on Play, including the 1.6-second cover opening. For example, if the first lyric
starts at second 30 of your track, use `startAt: 28.4`. The default pages last 3.8 seconds each,
followed by a 4.5-second flower ending. The song stops with the story. No song means a silent preview.

To try a song without editing files, open `http://127.0.0.1:4173/?edit=1#media-editor`.
Choose your song, starting second, and seconds per page, then use **Preview the enchanted book**.
Local file previews stay in the tab and are not saved into the gift or uploaded.

## Add your girlfriend's photos to the lyric reel

The three frames already have the final lyrics, floral stickers, and transitions. For permanent
photos, copy three portrait-friendly images into `dist/assets/` and update the three `src` values
in `lyricReel.frames` inside `dist/content.js`.

For a quick local preview, open `http://127.0.0.1:4173/?edit=1#lyric-reel`, choose up to three
images under **Choose three photos for the enchanted book**, then press **Play**. Those temporary
previews disappear after refreshing the page.

## Verification and hosting

`npm run check` checks all JavaScript syntax. See `VALIDATION.md` for the checks
completed and the browser limitations. This revision is saved locally and has not been published.

For Vercel, use Framework Preset Other, no build command and Output Directory
`dist`. The included `vercel.json` uses that setup.
