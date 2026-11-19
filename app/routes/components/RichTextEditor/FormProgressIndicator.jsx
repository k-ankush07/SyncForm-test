
import React from "react";
import { Icon } from "@shopify/polaris";
import * as PolarisIcons from "@shopify/polaris-icons";

import "./FormProgressIndicator.css";

export default function FormProgressIndicator({
    pages = [],
    activePageId = null,
}) {
    // ==================================================
    // 1. HIDE INDICATOR WHEN THERE IS ONLY ONE PAGE
    // ==================================================

    if (!pages || pages.length <= 1) {
        return null;
    }

    // ==================================================
    // 2. CHECK WHETHER ANY PAGE HAS AN ICON
    // ==================================================

    const hasAnyIcon = pages.some(
        (page) => Boolean(page.icon)
    );

    // ==================================================
    // 3. FIND CURRENT VISITOR PREVIEW PAGE
    // ==================================================

    const foundIndex = pages.findIndex(
        (page) =>
            String(page.id) === String(activePageId)
    );

    const currentPageIndex =
        foundIndex === -1 ? 0 : foundIndex;

    // ==================================================
    // 4. CALCULATE PROGRESS
    //
    // N pages = N + 1 equal line segments.
    //
    // 3 pages:
    // Page 1 = 1/4
    // Page 2 = 2/4
    // Page 3 = 3/4
    //
    // The green line always ends at the centre
    // of the current page circle.
    // ==================================================

    const progress =
        ((currentPageIndex + 1) / (pages.length + 1)) * 100;

    // ==================================================
    // 5. DETECT ICON CHANGES
    //
    // When any icon changes, the circle animation
    // restarts for all circles.
    // ==================================================

    const iconSignature = pages
        .map((page) => page.icon || "")
        .join("|");

    // ==================================================
    // 6. RENDER PROGRESS INDICATOR
    // ==================================================

    return (
        <div
            className={`form-progress ${
                hasAnyIcon
                    ? "form-progress--with-icons"
                    : "form-progress--without-icons"
            }`}
        >
            {/* BACKGROUND LINE */}
            <div className="form-progress__line">

                {/* GREEN PROGRESS LINE */}
                <div
                    className="form-progress__line-fill"
                    style={{
                        width: `${progress}%`,
                    }}
                />

            </div>

            {/* PAGE CIRCLES */}
            <div
                className="form-progress__steps"
                style={{
                    gridTemplateColumns: `repeat(${pages.length + 1}, minmax(0, 1fr))`,
                }}
                key={iconSignature}
            >
                {pages.map((page, index) => {

                    // Get the selected Polaris icon
                    const PageIcon = page.icon
                        ? PolarisIcons[page.icon]
                        : null;

                    // Previous pages are completed
                    const isCompleted =
                        index < currentPageIndex;

                    return (
                        <div
                            key={page.id || index}
                            className={[
                                "form-progress__dot",
                                isCompleted
                                    ? "form-progress__dot--completed"
                                    : "",
                                hasAnyIcon
                                    ? "form-progress__dot--animated"
                                    : "",
                            ].filter(Boolean).join(" ")}

                            // Place each circle at the end
                            // of its own equal-width segment.
                            style={{
                                gridColumn: index + 1,
                            }}
                        >
                            {/* SELECTED PAGE ICON */}
                            {PageIcon && (
                                <Icon source={PageIcon} />
                            )}

                            {/* ANIMATED CIRCLE BORDER */}
                            {hasAnyIcon && (
                                <svg
                                    className="form-progress__circle-draw"
                                    viewBox="0 0 40 40"
                                    aria-hidden="true"
                                >
                                    <circle
                                        cx="20"
                                        cy="20"
                                        r="18"
                                        fill="none"
                                        stroke={
                                            isCompleted
                                                ? "#ffffff"
                                                : "#008060"
                                        }
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        pathLength="100"
                                    />
                                </svg>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
