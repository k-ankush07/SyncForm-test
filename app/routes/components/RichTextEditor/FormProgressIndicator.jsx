import React from "react";
import "./FormProgressIndicator.css";

export default function FormProgressIndicator({
    pages = [],
    activePageId = null,
}) {
    if (pages.length <= 1) return null;

    const currentPageIndex = pages.findIndex(
        (page) => String(page.id) === String(activePageId)
    );

    const progress = currentPageIndex <= 0
        ? 0
        : (currentPageIndex / (pages.length - 1)) * 100;

    return (
        <div className="form-progress">
            {/* Background line */}
            <div className="form-progress__line">
                {/* Green filled line */}
                <div
                    className="form-progress__line-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="form-progress__steps">
                {pages.map((page, index) => {
                    const isActive =
                        currentPageIndex !== -1 &&
                        index <= currentPageIndex;

                    return (
                        <div
                            key={page.id || index}
                            className={`form-progress__dot ${
                                isActive
                                    ? "form-progress__dot--active"
                                    : ""
                            }`}
                        />
                    );
                })}
            </div>
        </div>
    );
}