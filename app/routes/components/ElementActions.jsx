
import React from "react";
import { Icon } from "@shopify/polaris";

import {
    ViewIcon,
    HideIcon,
    DuplicateIcon,
    DeleteIcon,
} from "@shopify/polaris-icons";

export default function ElementActions({
    element,
    onToggleElementVisibility,
    onDuplicateElement,
    onDeleteElement,
}) {
    // Get the element ID
    const elementId = element.id;

    return (
        <div className="element-tree__actions">

            {/* Hide / Show */}
            <button
                type="button"
                className="element-tree__action-btn"
                title={element.hidden ? "Show element" : "Hide element"}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                   onToggleElementVisibility(element);
                }}
            >
                <Icon source={element.hidden ? ViewIcon : HideIcon} />
            </button>

            {/* Duplicate */}
            <button
                type="button"
                className="element-tree__action-btn"
                title="Duplicate element"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onDuplicateElement(element);
                }}
            >
                <Icon source={DuplicateIcon} />
            </button>

            {/* Remove */}
            <button
                type="button"
                className="element-tree__action-btn element-tree__action-btn--delete"
                title="Remove element"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onDeleteElement(element);
                }}
            >
                <Icon source={DeleteIcon} />
            </button>

        </div>
    );
}
