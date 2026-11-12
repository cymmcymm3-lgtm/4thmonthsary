# Enchanted book validation — November 12, 2026

Verified in real headless Microsoft Edge via bundled Playwright, using the local server:

- Closed gilded book cover with a visible inside cover during opening, all three timed lyric pages, two-sided physical page leaves with a travelling curl/shadow, flower-handoff ending, and replay.
- Desktop 1440px and mobile 390px screenshots inspected; 320px reduced-motion layout also checked. No horizontal overflow at either phone width.
- Local audio picker with a 30-second silent WAV fixture: nonzero starting offset, playback, pause (zero time drift), resume, mute, and page seeking.
- Offscreen auto-pause; missing song continues the visual story without throwing; reduced-motion skips animated transforms while retaining reading time.
- No browser JavaScript errors, duplicate IDs, missing images, or dangling ARIA targets.
- JavaScript syntax checks and static-server request/range/security checks passed.
- Transparent bouquet asset optimized from 2.49 MB PNG to 243 KB WebP; original retained.

Screenshots are in `qa/enchanted/`. No user song or girlfriend photos were supplied; sample photos remain and the song path is empty. Actual phone hardware, an actual chosen music file, and beat alignment have not been tested. The site is updated locally, not deployed.

## Historical revision 4 checks — November 11, 2026

## Passed

- Syntax checks for all seven JavaScript files and the local static server.
- Markup check: 65 unique IDs, valid fragment links and existing local assets.
- Confirmed only home, video memories and love letter sections remain; the old
  flower section, scratch-ticket section and footer are absent.
- Executed the actual application scripts against a dependency-free simulated
  DOM built from the actual index.html, for desktop, mobile and reduced-motion modes.
- Verified startup, two-sided page clones, forward/back turns, rapid repeated
  clicks, swipe completion, short-drag rollback, canceled pointers, vertical-scroll
  intent, resize during a turn, video-control exclusions, arrow keys and chapter selection.
- Verified simulated media metadata/error states, playback-position restoration,
  pause on page turn, music volume ducking, both letter triggers and return-to-book action.
- Server request-handler checks passed for HTML, MP4 MIME, byte ranges, suffix/open-ended
  ranges, invalid ranges, HEAD requests, missing files and path traversal rejection.
  These checks invoke the actual server handler with simulated request/response streams;
  the session blocked a real loopback HTTP connection with EACCES.

## Verification limits

Computer Use stopped because it could not determine the current Windows browser
URL confidently enough to enforce its policy. No further browser automation was
attempted. Real-device touch, actual video decoding, rendered layout and animation
smoothness have not been visually verified in this session. The simulated DOM
checks do not establish browser rendering or frame rate.

No personal video was supplied. The four video slots are empty and ready to configure.

The existing hosting project was found, but opening its source repository failed
with DNS resolution failure for the hosting Git endpoint. No deployment occurred.
