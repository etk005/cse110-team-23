import type { KnownInformation } from "../shared/types.ts";

export const mockKnownInformation: KnownInformation[] = [
    {
        id: "info-1",
        description: "The hidden card is a heart.",
        property: "suit",
        operator: "equals",
        value: "hearts",
    },
];
