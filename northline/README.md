# Northline combat alpha

Browser FPS built around the existing Blackpine / Old Town map and animated operator preview. Existing games in this repository remain separate.

## Play

Open `northline/index.html` through an HTTP server or GitHub Pages. Choose **Solo vs AI** to play locally with 0–12 AI opponents, three difficulty levels, configurable maximum health, regeneration, and round duration.

Online play requires the dedicated Node server. Private rooms hold up to four human players and use six-digit join codes. Only the room host can start or restart a private match. The public room supports eight humans plus four bots, remains in the server process when everyone leaves, and automatically starts another round after the results screen.

## Run locally

```sh
cd northline/server
npm ci
npm test
npm start
```

Open `http://127.0.0.1:8787`. The server serves both the game and WebSocket endpoint. `/health` reports public-room status. Set `PORT` to change the port.

## Deploy on Render

The repository's `render.yaml` defines a Node web service rooted at `northline`, with build command `npm ci --prefix server`, start command `node server/server.mjs`, and health check `/health`. It selects Render's paid Starter plan for a service that does not intentionally sleep when idle. Review the hosting price before creating it. No paid service has been purchased by adding this file.

After deployment, the game works directly at the Render service URL. To use the GitHub Pages frontend, put the service's HTTPS URL in `northline/config.json` under `serverUrl`, or enter it in the game's **Custom server** field. Do not put credentials in that file. Until a backend is deployed and configured, the GitHub Pages build supports solo and the preview; its online buttons cannot connect automatically.

## Controls

- WASD move, Shift sprint, C crouch, Space jump.
- Mouse aim; right mouse / Z aim down sights; left mouse / X fire.
- R reload, B magazine selection, arrows select, Enter load the chosen magazine.
- Q switches carried weapons; F3 primary, F4 secondary.
- E armory; arrows navigate, brackets change weapon category, Tab chooses the destination slot, Enter buys/equips.
- G grenade, F melee, T optic, K armor, U grip.
- V first/third person; F1 full controls; F2 sound; Y graphics quality.
- F5 match menu; F6 standings. Solo pauses in its match menu; online matches continue.

Magazines retain identity and remaining rounds when swapped. The HUD shows magazine groups and full/partial/empty state, without a numeric bullet counter. The armory has 30 guns across eight categories, compatible magazines, seven game-balanced ammunition profiles, attachments, armor, and grenades.

## Authority and gameplay

`simulation.js` runs the same combat rules locally for solo or on the dedicated server for multiplayer. It owns movement, collision, ammunition, purchases, health, armor, reloads, projectiles, scoring, respawns, and round timing. Clients submit inputs and commands; they do not submit their own damage or kill awards. Spawn protection lasts three seconds; respawn takes four. Regeneration starts five seconds after the last hit.

Caliber sets a penetration ceiling, so maximum-penetration pistol ammunition cannot equal a heavy rifle round. Projectile and damage numbers are fictional game balance values, not real ammunition specifications. Cover uses simplified collision boxes. Bots use visibility checks and grid navigation.

This is an alpha: it has anonymous sessions, no persistent accounts or progression, no matchmaking beyond the public room, and no production anti-cheat system. Vehicles remain scenery from the map preview. The smoke/projectile visuals and skeletal/procedural animations are retained; this does not add drivable vehicles or new motion-capture assets.

## Tests

`npm test` in `northline/server` covers settings, AI movement and combat in the production map, damage/scoring/respawn, regeneration, armor/ammo balance, magazine conservation, armory validation, and real WebSocket private/public room behavior. Browser integration checks cover solo launch, aiming/fire, partial reloads, and host/join UI.

## Assets

Three.js r170 and its loaders/utilities are vendored under `assets`; see `assets/THREE-LICENSE.txt`. The Soldier sample is the Three.js example character credited to Mixamo/Vanguard. The map, weapon silhouettes, visual effects, and gameplay code are custom procedural work. No claim of affiliation with weapon manufacturers is made.
