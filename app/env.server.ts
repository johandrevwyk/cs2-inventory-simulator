/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import "dotenv/config";
import invariant from "tiny-invariant";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");
export const SESSION_SECRET = process.env.SESSION_SECRET;

export const BUILD_LAST_COMMIT_PATH = resolve(
  process.cwd(),
  ".build-last-commit"
);
export const BUILD_LAST_COMMIT = existsSync(BUILD_LAST_COMMIT_PATH)
  ? readFileSync(BUILD_LAST_COMMIT_PATH, "utf-8")
  : undefined;

export const { STEAM_API_KEY, STEAM_CALLBACK_URL } = process.env;
