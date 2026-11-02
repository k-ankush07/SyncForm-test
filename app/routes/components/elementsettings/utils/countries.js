import {
    getCountries,
    getCountryCallingCode,
} from "libphonenumber-js";

const regionNames = new Intl.DisplayNames(["en"], {
    type: "region",
});

function getFlag(countryCode) {
    return countryCode
        .toUpperCase()
        .replace(/./g, (char) =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
        );
}

export const countries = getCountries()
    .map((code) => ({
      label: regionNames.of(code),
        value: code.toLowerCase(),
        name: regionNames.of(code),
        flag: getFlag(code),
        dialCode: `+${getCountryCallingCode(code)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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