/** 3D + image assets for the login hero scene (greenery theme). */
const SODA_ASSET_BASE =
  'https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d';

export const LOGIN_HERO_ASSETS = {
  leavesGlb: `${SODA_ASSET_BASE}/leaves.glb`,
  bubblePng: `${SODA_ASSET_BASE}/bubble.png`,
} as const;
