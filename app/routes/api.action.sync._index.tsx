/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_Inventory, CS_Item } from "@ianlucas/cslib";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { requireUser } from "~/auth.server";
import { middleware } from "~/http.server";
import {
  expectRule,
  expectRuleNotContain,
  getRule
} from "~/models/rule.server";
import { manipulateUserInventory } from "~/models/user.server";
import { nonNegativeInt, teamShape } from "~/utils/shapes";
import {
  clientInventoryItemShape,
  syncInventoryShape
} from "~/utils/shapes.server";

export const ApiActionSyncUrl = "/api/action/sync";
export const AddAction = "add";
export const AddFromCacheAction = "add-from-cache";
export const AddWithNametagAction = "add-with-nametag";
export const AddWithStickerAction = "add-with-sticker";
export const ApplyItemStickerAction = "apply-item-sticker";
export const DepositToStorageUnitAction = "deposit-to-storage-unit";
export const EditAction = "edit";
export const EquipAction = "equip";
export const RemoveAction = "remove";
export const RemoveAllItemsAction = "remove-all-items";
export const RenameItemAction = "rename-item";
export const RenameStorageUnitAction = "rename-storage-unit";
export const RetrieveFromStorageUnitAction = "retrieve-from-storage-unit";
export const ScrapeItemStickerAction = "scrape-item-sticker";
export const SwapItemsStatTrakAction = "swap-items-stattrak";
export const UnequipAction = "unequip";

const actionShape = z
  .object({
    type: z.literal(AddAction),
    item: clientInventoryItemShape
  })
  .or(
    z.object({
      type: z.literal(AddFromCacheAction),
      items: syncInventoryShape
    })
  )
  .or(
    z.object({
      type: z.literal(AddWithNametagAction),
      toolUid: nonNegativeInt,
      itemId: nonNegativeInt,
      nametag: z.string()
    })
  )
  .or(
    z.object({
      type: z.literal(ApplyItemStickerAction),
      targetUid: nonNegativeInt,
      stickerUid: nonNegativeInt,
      stickerIndex: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(EquipAction),
      uid: nonNegativeInt,
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(UnequipAction),
      uid: nonNegativeInt,
      team: teamShape.optional()
    })
  )
  .or(
    z.object({
      type: z.literal(RenameItemAction),
      toolUid: nonNegativeInt,
      targetUid: nonNegativeInt,
      nametag: z.string().optional()
    })
  )
  .or(
    z.object({
      type: z.literal(RemoveAction),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(ScrapeItemStickerAction),
      targetUid: nonNegativeInt,
      stickerIndex: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(SwapItemsStatTrakAction),
      fromUid: nonNegativeInt,
      toUid: nonNegativeInt,
      toolUid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(RenameStorageUnitAction),
      uid: nonNegativeInt,
      nametag: z.string()
    })
  )
  .or(
    z.object({
      depositUids: z.array(nonNegativeInt).max(1),
      type: z.literal(DepositToStorageUnitAction),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      retrieveUids: z.array(nonNegativeInt).max(1),
      type: z.literal(RetrieveFromStorageUnitAction),
      uid: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(EditAction),
      uid: nonNegativeInt,
      attributes: clientInventoryItemShape
    })
  )
  .or(
    z.object({
      type: z.literal(AddWithStickerAction),
      stickerUid: nonNegativeInt,
      itemId: nonNegativeInt,
      stickerIndex: nonNegativeInt
    })
  )
  .or(
    z.object({
      type: z.literal(RemoveAllItemsAction)
    })
  );

export type ActionShape = z.infer<typeof actionShape>;
export type ApiActionSyncData = ReturnType<
  Awaited<ReturnType<typeof action>>["json"]
>;

async function enforceCraftRules(idOrItem: number | CS_Item) {
  const { category, type, model, id } = CS_Economy.get(idOrItem);
  await expectRuleNotContain("CraftHideId", id);
  if (category !== undefined) {
    await expectRuleNotContain("CraftHideCategory", category);
  }
  if (type !== undefined) {
    await expectRuleNotContain("CraftHideType", type);
  }
  if (model !== undefined) {
    await expectRuleNotContain("CraftHideModel", model);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  await middleware(request);
  const { id: userId, inventory: rawInventory } = await requireUser(request);
  const { syncedAt, actions } = z
    .object({
      syncedAt: z.number(),
      actions: z.array(actionShape)
    })
    .parse(await request.json());
  let addedFromCache = false;
  const { syncedAt: responseSyncedAt } = await manipulateUserInventory({
    userId,
    rawInventory,
    syncedAt,
    async manipulate(inventory) {
      for (const action of actions) {
        switch (action.type) {
          case AddAction:
            await enforceCraftRules(action.item.id);
            inventory.add(action.item);
            break;
          case AddFromCacheAction:
            if (rawInventory === null && !addedFromCache) {
              try {
                for (const item of new CS_Inventory({
                  items: action.items,
                  maxItems: await getRule("InventoryMaxItems", userId),
                  storageUnitMaxItems: await getRule(
                    "InventoryStorageUnitMaxItems",
                    userId
                  )
                }).export()) {
                  await enforceCraftRules(item.id);
                  inventory.add(item);
                }
              } catch {}
              addedFromCache = true;
            }
            break;
          case AddWithNametagAction:
            await enforceCraftRules(action.itemId);
            inventory.addWithNametag(
              action.toolUid,
              action.itemId,
              action.nametag
            );
            break;
          case ApplyItemStickerAction:
            inventory.applyItemSticker(
              action.targetUid,
              action.stickerUid,
              action.stickerIndex
            );
            break;
          case EquipAction:
            inventory.equip(action.uid, action.team);
            break;
          case UnequipAction:
            inventory.unequip(action.uid, action.team);
            break;
          case RenameItemAction:
            inventory.renameItem(
              action.toolUid,
              action.targetUid,
              action.nametag
            );
            break;
          case RemoveAction:
            inventory.remove(action.uid);
            break;
          case ScrapeItemStickerAction:
            inventory.scrapeItemSticker(action.targetUid, action.stickerIndex);
            break;
          case SwapItemsStatTrakAction:
            inventory.swapItemsStatTrak(
              action.toolUid,
              action.fromUid,
              action.toUid
            );
            break;
          case RenameStorageUnitAction:
            inventory.renameStorageUnit(action.uid, action.nametag);
            break;
          case DepositToStorageUnitAction:
            inventory.depositToStorageUnit(action.uid, action.depositUids);
            break;
          case RetrieveFromStorageUnitAction:
            inventory.retrieveFromStorageUnit(action.uid, action.retrieveUids);
            break;
          case EditAction:
            await expectRule("InventoryItemAllowEdit", true, userId);
            inventory.edit(action.uid, {
              ...action.attributes,
              stattrak:
                action.attributes.stattrak !== undefined
                  ? inventory.get(action.uid).stattrak ?? 0
                  : undefined,
              nametag: action.attributes.nametag
            });
            break;
          case AddWithStickerAction:
            await enforceCraftRules(action.itemId);
            inventory.addWithSticker(
              action.stickerUid,
              action.itemId,
              action.stickerIndex
            );
            break;
          case RemoveAllItemsAction:
            inventory.removeAll();
            break;
        }
      }
    }
  });
  return json({ syncedAt: responseSyncedAt.getTime() });
}
