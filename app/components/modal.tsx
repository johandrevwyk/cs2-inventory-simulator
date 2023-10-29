/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import clsx from "clsx";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";

export function Modal({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <ClientOnly>
      {() =>
        createPortal(
          <div className="absolute top-0 left-0 w-full min-h-full flex items-center justify-center z-50 py-8">
            <div
              className={clsx(
                "shadow-lg rounded bg-neutral-900/80 min-h-[inherit] text-white backdrop-blur-sm drop-shadow-lg",
                className
              )}
            >
              {children}
            </div>
          </div>,
          document.body
        )}
    </ClientOnly>
  );
}
