
import {
    getCountries,
    getCountryCallingCode,
} from "libphonenumber-js";

// English country names
const regionNames = new Intl.DisplayNames(["en"], {
    type: "region",
});

const nativeCountryNames = {
    IN: "भारत",
    JP: "日本",
    CN: "中国",
    KR: "대한민국",
    DE: "Deutschland",
    FR: "France",
    ES: "España",
    IT: "Italia",
    PT: "Portugal",
    RU: "Россия",
    SA: "المملكة العربية السعودية",
    BD: "বাংলাদেশ",
    PK: "پاکستان",
    TH: "ประเทศไทย",
    VN: "Việt Nam",
    GR: "Ελλάδα",
    NL: "Nederland",
    PL: "Polska",
    TR: "Türkiye",
    UA: "Україна",
    IR: "ایران",
    IL: "ישראל",
    SE: "Sverige",
    NO: "Norge",
    FI: "Suomi",
    DK: "Danmark",
    CZ: "Česko",
    HU: "Magyarország",
    RO: "România",
    ID: "Indonesia",
    MY: "Malaysia",
    PH: "Pilipinas",
};


// Native country names
function getNativeName(countryCode) {
    try {
        const displayNames = new Intl.DisplayNames(
            [countryCode],
            { type: "region" }
        );

        return displayNames.of(countryCode.toUpperCase());
    } catch {
        return regionNames.of(countryCode);
    }
}

// Converts "IN" into "🇮🇳".
function getFlag(countryCode) {
    return countryCode
        .toUpperCase()
        .replace(/[A-Z]/g, (char) =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
        );
}

// Generate country data.

export const countries = getCountries()
    .map((code) => ({
        label: regionNames.of(code),
        value: code.toLowerCase(),
        name: regionNames.of(code),

        // Use native name when available, otherwise English name.
        nativeName:
            nativeCountryNames[code] || regionNames.of(code),

        flag: getFlag(code),
        dialCode: `+${getCountryCallingCode(code)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));


// Options for Polaris Select.
export const countryOptions = [
    {
        label: "Automatically select based on the customer's country",
        value: "auto",
    },
    ...countries.map(({ label, value }) => ({
        label,
        value,
    })),
];

// DEBUG
const india = countries.find(
    (country) => country.value === "in"
);

console.log("India country data:", india);
