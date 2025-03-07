import * as helper from "../../helper.js";
import * as lib from "../../lib.js";
import express from "express";

import { db } from "../../mongo.js";
import { getItems } from "../../stats.js";

const router = express.Router();

router.use((req, res, next) => {
  req.options.debugId = helper.generateDebugId("api/v2/slayers");
  next();
});

router.get("/:player/:profile", async (req, res, next) => {
  try {
    const { profile, allProfiles } = await lib.getProfile(db, req.params.player, null, req.options);

    let output = {
      error: "Invalid Profile Name!",
    };

    for (const singleProfile of allProfiles) {
      const cuteName = singleProfile.cute_name;

      if (cuteName.toLowerCase() != req.params.profile.toLowerCase()) {
        continue;
      }

      const items = await getItems(singleProfile.members[profile.uuid], false, "", req.options);
      const data = await lib.getStats(db, singleProfile, allProfiles, items, req.options);

      output = {
        profile_id: singleProfile.profile_id,
        cute_name: singleProfile.cute_name,
        slayer_xp: data.slayer_xp,
        slayers: data.slayers,
        slayer_coins_spent: data.slayer_coins_spent,
      };
    }

    helper.sendMetric("endpoint_apiv2_slayers_profile_success");
    res.json(output);
  } catch (e) {
    next(e);
  }
});

router.get("/:player", async (req, res, next) => {
  try {
    const { profile, allProfiles } = await lib.getProfile(db, req.params.player, null, req.options);
    const bingoProfile = await lib.getBingoProfile(db, req.params.player, req.options);

    const output = { profiles: {} };

    for (const singleProfile of allProfiles) {
      const userProfile = singleProfile.members[profile.uuid];

      const items = await getItems(userProfile, bingoProfile, false, "", req.options);
      const data = await lib.getStats(db, singleProfile, bingoProfile, allProfiles, items, req.options);

      output.profiles[singleProfile.profile_id] = {
        profile_id: singleProfile.profile_id,
        cute_name: singleProfile.cute_name,
        slayer_xp: data.slayer_xp,
        slayers: data.slayers,
        slayer_coins_spent: data.slayer_coins_spent,
      };
    }

    helper.sendMetric("endpoint_apiv2_slayers_player_success");
    res.json(output);
  } catch (e) {
    next(e);
  }
});

export { router };
