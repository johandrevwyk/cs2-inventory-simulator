/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_NO_STICKER_WEAR,
  CS_safeValidateNametag,
  CS_safeValidateSeed,
  CS_safeValidateStatTrak,
  CS_safeValidateWear
} from "@ianlucas/cslib";
import { z } from "zod";
import { len } from "./number";

const inventoryItemProps = {
  equipped: z.boolean().optional(),
  equippedCT: z.boolean().optional(),
  equippedT: z.boolean().optional(),
  id: z
    .number()
    .int()
    .nonnegative()
    .finite()
    .safe()
    .refine((id) => !CS_Economy.getById(id).free),
  nametag: z
    .string()
    .max(20)
    .optional()
    .transform((nametag) => (nametag !== undefined ? nametag.trim() : nametag))
    .refine(
      (nametag) => nametag === undefined || CS_safeValidateNametag(nametag)
    ),
  seed: z
    .number()
    .int()
    .positive()
    .finite()
    .safe()
    .optional()
    .refine((seed) => seed === undefined || CS_safeValidateSeed(seed)),
  stattrak: z.literal(0).optional(),
  stickers: z
    .array(z.number().int().nonnegative().finite().safe())
    .optional()
    .transform((stickers) =>
      len(stickers?.filter((sticker) => sticker !== CS_NO_STICKER_WEAR)) > 0
        ? stickers
        : undefined
    ),
  stickerswear: z
    .array(z.number().nonnegative().finite())
    .optional()
    .transform((stickerswear) =>
      len(stickerswear?.filter((wear) => wear !== CS_NO_STICKER_WEAR)) > 0
        ? stickerswear
        : undefined
    ),
  wear: z
    .number()
    .nonnegative()
    .finite()
    .optional()
    .refine((wear) => wear === undefined || CS_safeValidateWear(wear))
};

export const externalInventoryItemShape = z.object(inventoryItemProps);
export const externalInventoryShape = z.array(externalInventoryItemShape);
export const internalInventoryShape = z.array(
  z.object({
    ...inventoryItemProps,
    id: z.number(),
    stattrak: z
      .number()
      .optional()
      .refine(
        (stattrak) =>
          stattrak === undefined || CS_safeValidateStatTrak(stattrak)
      )
  })
);

export const teamShape = z.literal(0).or(z.literal(2)).or(z.literal(3));

export type ExternalInventoryItemShape = z.infer<
  typeof externalInventoryItemShape
>;
export type ExternalInventoryShape = z.infer<typeof externalInventoryShape>;
